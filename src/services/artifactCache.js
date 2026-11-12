import {
  collection,
  getDocs,
  limit,
  query,
  where,
} from "firebase/firestore";
import { httpsCallable } from "firebase/functions";
import { db, functions } from "../firebase/config";
import { stripAnswers } from "./questionSchema";

export const findCachedArtifact = async (uid, { artifactType, sourceHash, configHash }) => {
  if (!uid || !sourceHash) return null;

  try {
    const constraints = [
      where("artifactType", "==", artifactType),
      where("sourceHash", "==", sourceHash),
      where("status", "==", "ready"),
      limit(5),
    ];
    if (configHash) constraints.splice(2, 0, where("configHash", "==", configHash));

    const snap = await getDocs(query(collection(db, "users", uid, "artifacts"), ...constraints));
    const match = snap.docs[0];
    if (!match) return null;
    const data = match.data();
    return {
      id: match.id,
      ...data,
      questions: stripAnswers(data.questions || []),
    };
  } catch (error) {
    console.warn("Artifact cache lookup skipped:", error.message);
    return null;
  }
};

export const saveArtifact = async (uid, artifact) => {
  if (!uid) {
    throw new Error("Sign in required to store a trusted question set.");
  }

  const callable = httpsCallable(functions, "storeQuestionArtifact", { timeout: 120000 });
  const result = await callable({
    artifactType: artifact.artifactType,
    sourceHash: artifact.sourceHash,
    configHash: artifact.configHash || artifact.sourceHash,
    questions: artifact.questions,
    bookId: artifact.bookId || null,
    selectedChapters: artifact.selectedChapters || [],
    subject: artifact.subject || "",
    examPattern: artifact.examPattern || "",
    studyClass: artifact.studyClass || "",
  });

  return { success: true, id: result.data.artifactId, reused: Boolean(result.data.reused) };
};