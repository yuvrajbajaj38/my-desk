import { extractPdfText, PdfExtractionError, SCANNED_PDF_MESSAGE } from "./pdfText";
import { mapAnswerKey, parseQuestionsFromText } from "./questionParser";
import { validateQuestionSet, stripAnswers } from "./questionSchema";
import { hashFile, hashObject } from "./hash";
import { validatePdfFile } from "./fileValidation";
import { findCachedArtifact, saveArtifact } from "./artifactCache";
import { runAiJob } from "./aiClient";
import { isCanonicalChapter } from "./curriculum";

const assertCanonicalChapters = (config) => {
  const invalid = (config.selectedChapters || []).filter(
    (chapter) => !isCanonicalChapter(config.examPattern, config.studyClass, config.subject, chapter)
  );
  if (invalid.length) {
    throw new Error("One or more selected chapters are outside the canonical syllabus.");
  }
};

const scannedOrRetryMessage = (error) => {
  if (error instanceof PdfExtractionError && error.code === "scanned") {
    return SCANNED_PDF_MESSAGE;
  }
  return error?.message || "PDF processing failed. Please retry.";
};

export const prepareAiMockQuestions = async (config, uid) => {
  assertCanonicalChapters(config);
  const configHash = await hashObject({
    type: "ai-mock",
    examPattern: config.examPattern,
    studyClass: config.studyClass,
    subject: config.subject,
    selectedChapters: config.selectedChapters,
    difficulty: config.difficulty,
    totalQuestions: config.totalQuestions,
    advancedPaper: config.advancedPaper || null,
  });

  const cached = await findCachedArtifact(uid, {
    artifactType: "ai-mock",
    sourceHash: configHash,
    configHash,
  });
  if (cached?.questions?.length) {
    return { questions: stripAnswers(cached.questions), reused: true, artifactId: cached.id };
  }

  const remote = await runAiJob("generate-ai-mock", {
    sourceHash: configHash,
    configHash,
    examPattern: config.examPattern,
    studyClass: config.studyClass,
    subject: config.subject,
    selectedChapters: config.selectedChapters,
    difficulty: config.difficulty,
    totalQuestions: config.totalQuestions,
    advancedPaper: config.advancedPaper || null,
  });

  const validated = validateQuestionSet(remote?.questions || [], {
    requireAnswer: true,
    allowedChapters: config.selectedChapters || [],
    meta: {
      subject: config.subject,
      difficulty: config.difficulty,
      examPattern: config.examPattern,
      studyClass: config.studyClass,
    },
  });
  if (!validated.questions.length) {
    throw new Error("The AI returned no valid questions. Please retry.");
  }

  const artifactId = remote?.artifactId || (await saveArtifact(uid, {
    artifactType: "ai-mock",
    sourceHash: configHash,
    configHash,
    questions: validated.questions,
    selectedChapters: config.selectedChapters,
    subject: config.subject,
    examPattern: config.examPattern,
    studyClass: config.studyClass,
  })).id;

  return { questions: stripAnswers(validated.questions), reused: Boolean(remote?.reused), artifactId };
};

export const prepareCoachingQuestions = async (config, uid) => {
  const testCheck = validatePdfFile(config.testFile);
  if (!testCheck.ok) throw new Error(testCheck.message);

  if (config.verificationMethod === "uploadKey") {
    const keyCheck = validatePdfFile(config.answerKeyFile);
    if (!keyCheck.ok) throw new Error(keyCheck.message);
  }

  const sourceHash = await hashFile(config.testFile);
  const keyHash = config.answerKeyFile ? await hashFile(config.answerKeyFile) : "none";
  const configHash = await hashObject({
    type: "coaching",
    sourceHash,
    keyHash,
    examPattern: config.examPattern,
    advancedPaper: config.advancedPaper,
  });

  const cached = await findCachedArtifact(uid, {
    artifactType: "coaching-parse",
    sourceHash,
    configHash,
  });
  if (cached?.questions?.length) {
    return { questions: stripAnswers(cached.questions), reused: true, artifactId: cached.id };
  }

  let questions;
  let extractedText = "";
  let scanned = false;
  try {
    const extracted = await extractPdfText(config.testFile);
    extractedText = extracted.text;
    const parsed = parseQuestionsFromText(extracted.text).questions;
    questions = config.answerKeyFile
      ? mapAnswerKey(parsed, (await extractPdfText(config.answerKeyFile)).text)
      : parsed;
  } catch (error) {
    if (error instanceof PdfExtractionError && error.code === "scanned") {
      scanned = true;
    }
    questions = [];
  }

  if (!questions.length && extractedText) {
    const remote = await runAiJob("parse-coaching-pdf", {
      sourceHash,
      configHash,
      examPattern: config.examPattern,
      hasAnswerKey: Boolean(config.answerKeyFile),
      extractedText: extractedText.slice(0, 20000),
    });
    questions = validateQuestionSet(remote?.questions || []).questions;
    if (remote?.artifactId && questions.length) {
      return { questions: stripAnswers(questions), reused: Boolean(remote.reused), artifactId: remote.artifactId };
    }
  }

  if (!questions.length) {
    throw new Error(
      scanned
        ? SCANNED_PDF_MESSAGE
        : "No questions could be parsed from this coaching PDF. Retry with a clearer text-based PDF."
    );
  }

  const saved = await saveArtifact(uid, {
    artifactType: "coaching-parse",
    sourceHash,
    configHash,
    status: "ready",
    questions,
  });

  return { questions: stripAnswers(questions), reused: false, artifactId: saved.id };
};

export const prepareNotesExtract = async (config, uid) => {
  const files = (config.noteFiles || []).filter(Boolean);
  if (!files.length) throw new Error("Upload at least one notes PDF.");

  files.forEach((file) => {
    const check = validatePdfFile(file);
    if (!check.ok) throw new Error(check.message);
  });

  const hashes = await Promise.all(files.map((file) => hashFile(file)));
  const sourceHash = hashes.join(":");
  const cached = await findCachedArtifact(uid, {
    artifactType: "notes-extract",
    sourceHash,
    configHash: sourceHash,
  });
  if (cached?.questions?.length) {
    return { questions: stripAnswers(cached.questions), reused: true, artifactId: cached.id };
  }

  let questions = [];
  let extractedText = "";
  let scannedCount = 0;
  for (const file of files) {
    try {
      const extracted = await extractPdfText(file);
      extractedText += `\n${extracted.text}`;
      questions = questions.concat(parseQuestionsFromText(extracted.text).questions);
    } catch (error) {
      if (error instanceof PdfExtractionError && error.code === "scanned") scannedCount += 1;
    }
  }

  if (!questions.length && extractedText.trim()) {
    const remote = await runAiJob("extract-notes-questions", {
      sourceHash,
      configHash: sourceHash,
      extractedText: extractedText.slice(0, 20000),
    });
    questions = validateQuestionSet(remote?.questions || []).questions;
    if (remote?.artifactId && questions.length) {
      return { questions: stripAnswers(questions), reused: Boolean(remote.reused), artifactId: remote.artifactId };
    }
  }

  if (!questions.length) {
    throw new Error(
      scannedCount === files.length
        ? SCANNED_PDF_MESSAGE
        : "No practice questions were found in the uploaded notes. Retry with notes that contain selectable question text."
    );
  }

  const saved = await saveArtifact(uid, {
    artifactType: "notes-extract",
    sourceHash,
    configHash: sourceHash,
    status: "ready",
    questions,
  });

  return { questions: stripAnswers(questions), reused: false, artifactId: saved.id };
};

export const prepareNotesAiMock = async (config, uid) => {
  const files = (config.noteFiles || []).filter(Boolean);
  if (!files.length) throw new Error("Upload at least one notes PDF.");
  assertCanonicalChapters(config);

  const hashes = await Promise.all(files.map((file) => hashFile(file)));
  const sourceHash = hashes.join(":");
  const configHash = await hashObject({
    type: "notes-ai-mock",
    sourceHash,
    examPattern: config.examPattern,
    studyClass: config.studyClass,
    subject: config.subject,
    selectedChapters: config.selectedChapters,
    difficulty: config.difficulty,
    totalQuestions: config.totalQuestions,
    questionType: config.questionType || "mcq",
  });

  const cached = await findCachedArtifact(uid, {
    artifactType: "notes-ai-mock",
    sourceHash,
    configHash,
  });
  if (cached?.questions?.length) {
    return { questions: stripAnswers(cached.questions), reused: true, artifactId: cached.id };
  }

  let notesText = "";
  for (const file of files) {
    try {
      const extracted = await extractPdfText(file);
      notesText += `\n${extracted.text}`;
    } catch (error) {
      if (error instanceof PdfExtractionError && error.code === "scanned") {
        throw error;
      }
      throw new Error(scannedOrRetryMessage(error), { cause: error });
    }
  }

  if (!notesText.trim()) {
    throw new Error(SCANNED_PDF_MESSAGE);
  }

  const remote = await runAiJob("generate-notes-mock", {
    sourceHash,
    configHash,
    examPattern: config.examPattern,
    studyClass: config.studyClass,
    subject: config.subject,
    selectedChapters: config.selectedChapters,
    difficulty: config.difficulty,
    totalQuestions: config.totalQuestions,
    notesExcerpt: notesText.slice(0, 12000),
  });

  const validated = validateQuestionSet(remote?.questions || [], {
    requireAnswer: true,
    allowedChapters: config.selectedChapters || [],
    meta: {
      subject: config.subject,
      difficulty: config.difficulty,
      examPattern: config.examPattern,
      studyClass: config.studyClass,
    },
  });
  if (!validated.questions.length) {
    throw new Error("The notes-based AI mock could not be generated. Configure the AI backend and retry.");
  }

  const artifactId = remote?.artifactId || (await saveArtifact(uid, {
    artifactType: "notes-ai-mock",
    sourceHash,
    configHash,
    questions: validated.questions,
    selectedChapters: config.selectedChapters,
    subject: config.subject,
    examPattern: config.examPattern,
    studyClass: config.studyClass,
  })).id;

  return { questions: stripAnswers(validated.questions), reused: Boolean(remote?.reused), artifactId };
};