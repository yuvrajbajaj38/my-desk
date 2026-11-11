import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
} from "firebase/firestore";
import { ref, uploadBytes } from "firebase/storage";
import { db, storage } from "../firebase/config";
import { hashFile } from "./hash";
import { validatePdfFile } from "./fileValidation";
import { extractPdfText, PdfExtractionError, SCANNED_PDF_MESSAGE } from "./pdfText";
import { parseQuestionsFromText } from "./questionParser";
import { stripAnswers } from "./questionSchema";
import { findCachedArtifact, saveArtifact } from "./artifactCache";
import { runAiJob } from "./aiClient";

export const getBookQuestions = async (uid, book) => {
  if (book?.questions?.length) return stripAnswers(book.questions);
  if (!uid || !book?.artifactId) return [];
  try {
    const snap = await getDoc(doc(db, "users", uid, "artifacts", book.artifactId));
    return snap.exists() ? stripAnswers(snap.data().questions || []) : [];
  } catch {
    return [];
  }
};

export const listBooks = async (uid) => {
  if (!uid) return [];
  try {
    const snap = await getDocs(
      query(collection(db, "users", uid, "books"), orderBy("createdAt", "desc"))
    );
    return snap.docs.map((item) => ({ id: item.id, ...item.data() }));
  } catch {
    try {
      const snap = await getDocs(collection(db, "users", uid, "books"));
      return snap.docs.map((item) => ({ id: item.id, ...item.data() }));
    } catch (error) {
      console.error("Failed to load books:", error);
      return [];
    }
  }
};

export const createBookJob = async (uid, file, metadata = {}) => {
  const validation = validatePdfFile(file);
  if (!validation.ok) {
    throw new Error(validation.message);
  }

  const sourceHash = await hashFile(file);
  const existing = (await listBooks(uid)).find((book) => book.sourceHash === sourceHash && book.status === "ready");
  if (existing) {
    return { reused: true, book: existing };
  }

  const bookRef = await addDoc(collection(db, "users", uid, "books"), {
    title: metadata.title || file.name.replace(/\.pdf$/i, ""),
    fileName: file.name,
    size: file.size,
    sourceHash,
    status: "processing",
    questionCount: 0,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  try {
    const storageRef = ref(storage, `users/${uid}/books/${bookRef.id}.pdf`);
    await uploadBytes(storageRef, file, { contentType: "application/pdf" });
  } catch (error) {
    console.warn("Storage upload skipped:", error.message);
  }

  const cached = await findCachedArtifact(uid, {
    artifactType: "question-bank-book",
    sourceHash,
  });

  if (cached?.questions?.length) {
    await updateDoc(doc(db, "users", uid, "books", bookRef.id), {
      status: "ready",
      questionCount: cached.questions.length,
      artifactId: cached.id,
      updatedAt: serverTimestamp(),
    });
    return { reused: true, book: { id: bookRef.id, ...(cached), status: "ready" } };
  }

  let questions = [];
  let extractedText = "";
  let scanned = false;
  try {
    const extracted = await extractPdfText(file);
    extractedText = extracted.text;
    const parsed = parseQuestionsFromText(extracted.text).questions;
    if (parsed.length) {
      questions = parsed;
    }
  } catch (error) {
    if (error instanceof PdfExtractionError && error.code === "scanned") scanned = true;
    questions = [];
  }

  if (!questions.length && extractedText) {
    try {
      const remote = await runAiJob("parse-question-bank", {
        sourceHash,
        configHash: sourceHash,
        fileName: file.name,
        extractedText: extractedText.slice(0, 20000),
      });
      questions = remote?.questions || [];
      if (remote?.artifactId && questions.length) {
        await updateDoc(doc(db, "users", uid, "books", bookRef.id), {
          status: "ready",
          questionCount: questions.length,
          artifactId: remote.artifactId,
          updatedAt: serverTimestamp(),
        });
        return {
          reused: Boolean(remote.reused),
          book: {
            id: bookRef.id,
            title: metadata.title || file.name,
            status: "ready",
            questionCount: questions.length,
            questions: stripAnswers(questions),
            artifactId: remote.artifactId,
          },
        };
      }
    } catch {
      questions = [];
    }
  }

  if (!questions.length) {
    await updateDoc(doc(db, "users", uid, "books", bookRef.id), {
      status: "failed",
      error: scanned ? SCANNED_PDF_MESSAGE : "No questions could be extracted from this book yet.",
      updatedAt: serverTimestamp(),
    });
    throw new Error(scanned ? SCANNED_PDF_MESSAGE : "This book could not be processed. Retry with a selectable-text PDF.");
  }

  const saved = await saveArtifact(uid, {
    artifactType: "question-bank-book",
    sourceHash,
    configHash: sourceHash,
    questions,
    bookId: bookRef.id,
  });
  if (!saved.id) {
    throw new Error("The question set could not be stored on the server.");
  }

  await updateDoc(doc(db, "users", uid, "books", bookRef.id), {
    status: "ready",
    questionCount: questions.length,
    artifactId: saved.id || null,
    updatedAt: serverTimestamp(),
  });

  return {
    reused: false,
    book: {
      id: bookRef.id,
      title: metadata.title || file.name,
      status: "ready",
      questionCount: questions.length,
      questions: stripAnswers(questions),
    },
  };
};