const { onCall, onRequest, HttpsError } = require("firebase-functions/v2/https");
const { defineSecret } = require("firebase-functions/params");
const { initializeApp } = require("firebase-admin/app");
const { getAuth } = require("firebase-admin/auth");
const { getFirestore, FieldValue } = require("firebase-admin/firestore");
const crypto = require("crypto");
const { callAi } = require("./aiProvider");
const { validateQuestionSet } = require("./questionValidation");
const { artifactDocId, JOB_ARTIFACT_TYPE } = require("./cacheKeys");

initializeApp();
const db = getFirestore();

const aiConfigEncryptionKey = defineSecret("AI_CONFIG_ENCRYPTION_KEY");
const razorpayKeyId = defineSecret("RAZORPAY_KEY_ID");
const razorpayKeySecret = defineSecret("RAZORPAY_KEY_SECRET");
const razorpayWebhookSecret = defineSecret("RAZORPAY_WEBHOOK_SECRET");

function requireAdmin(request) {
  requireUser(request);
  if (request.auth.token.admin !== true) {
    throw new HttpsError("permission-denied", "Administrator access required.");
  }
}


const DEFAULT_PLATFORM_SETTINGS = {
  freeSignupCredits: 50,
  proPriceInr: 159,
  proMonthlyCredits: 1000,
  boosterPriceInr: 49,
  boosterCredits: 300,
  aiProvider: "gemini",
};

// Creates the first student profile and awards the free trial exactly once per
// stable browser fingerprint. The fingerprint is only an abuse signal, not a
// hardware identity; App Check and Firebase Auth protections should also be enabled.
exports.registerStudentAccount = onCall({ enforceAppCheck: true }, async (request) => {
  const uid = requireUser(request);
  const authUser = await getAuth().getUser(uid);
  if (!authUser.emailVerified) {
    throw new HttpsError("failed-precondition", "Verify your email before activating free credits.");
  }
  const fingerprint = String(request.data?.deviceFingerprint || "");
  if (!/^[a-f0-9]{20,128}$/i.test(fingerprint)) {
    throw new HttpsError("invalid-argument", "Unable to verify this device. Refresh and try again.");
  }
  const deviceHash = crypto.createHash("sha256").update(fingerprint).digest("hex");
  const userRef = db.collection("users").doc(uid);
  const deviceRef = db.collection("deviceFreeTrials").doc(deviceHash);
  const configRef = db.collection("creditConfig").doc("default");

  return db.runTransaction(async (tx) => {
    const [userSnap, deviceSnap, configSnap] = await Promise.all([
      tx.get(userRef), tx.get(deviceRef), tx.get(configRef),
    ]);
    if (userSnap.exists) {
      return { success: true, existingAccount: true, credits: Number(userSnap.data().credits || 0) };
    }
    if (deviceSnap.exists && deviceSnap.data().uid !== uid) {
      throw new HttpsError("resource-exhausted", "Free trial already used on this device. Sign in to your existing account instead.");
    }
    const freeSignupCredits = Math.max(0, Math.min(100000, Math.floor(Number(configSnap.data()?.freeSignupCredits ?? DEFAULT_PLATFORM_SETTINGS.freeSignupCredits))));
    const profile = {
      uid,
      phone: authUser.phoneNumber || "",
      name: authUser.displayName || "",
      email: authUser.email || "",
      photoURL: authUser.photoURL || "",
      role: "student",
      plan: "Free Trial",
      accountStatus: "active",
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
      credits: freeSignupCredits,
      totalXP: 0,
      streak: 0,
      trialActive: true,
    };
    tx.create(userRef, profile);
    tx.set(deviceRef, { uid, createdAt: FieldValue.serverTimestamp(), lastSeenAt: FieldValue.serverTimestamp() }, { merge: true });
    return { success: true, existingAccount: false, credits: freeSignupCredits };
  });
});

exports.adminGetSettings = onCall(async (request) => {
  requireAdmin(request);
  const snap = await db.collection("creditConfig").doc("default").get();
  return { ...DEFAULT_PLATFORM_SETTINGS, ...(snap.exists ? snap.data() : {}) };
});

exports.adminSetAiKey = onCall({ secrets: [aiConfigEncryptionKey] }, async (request) => {
  requireAdmin(request);
  const apiKey = String(request.data?.apiKey || "").trim();
  if (apiKey.length < 12 || apiKey.length > 4096) {
    throw new HttpsError("invalid-argument", "Enter a valid AI API key.");
  }
  const encryptionSecret = aiConfigEncryptionKey.value();
  if (!/^[a-f0-9]{64}$/i.test(encryptionSecret)) {
    throw new HttpsError("failed-precondition", "AI_CONFIG_ENCRYPTION_KEY must be a 32-byte hex secret. Configure it in Firebase Secret Manager first.");
  }
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", Buffer.from(encryptionSecret, "hex"), iv);
  const encrypted = Buffer.concat([cipher.update(apiKey, "utf8"), cipher.final()]);
  await db.collection("privateConfig").doc("ai").set({
    encryptedKey: encrypted.toString("base64"),
    iv: iv.toString("base64"),
    authTag: cipher.getAuthTag().toString("base64"),
    keyUpdatedAt: FieldValue.serverTimestamp(),
    keyUpdatedBy: request.auth.uid,
  }, { merge: true });
  return { success: true };
});

exports.adminUpdateSettings = onCall(async (request) => {
  requireAdmin(request);
  const input = request.data || {};
  const numeric = ["freeSignupCredits", "proPriceInr", "proMonthlyCredits", "boosterPriceInr", "boosterCredits"];
  const settings = {};
  for (const key of numeric) {
    const value = Number(input[key]);
    if (!Number.isFinite(value) || value < 0 || value > 10000000) {
      throw new HttpsError("invalid-argument", `Invalid ${key}.`);
    }
    settings[key] = Math.floor(value);
  }
  if (!["gemini", "openai", "custom"].includes(input.aiProvider)) {
    throw new HttpsError("invalid-argument", "Unsupported AI provider.");
  }
  settings.aiProvider = input.aiProvider;
  if (input.aiModel !== undefined) settings.aiModel = String(input.aiModel).trim().slice(0, 120);
  if (input.aiBaseUrl !== undefined) settings.aiBaseUrl = String(input.aiBaseUrl).trim().slice(0, 500);
  settings.updatedAt = FieldValue.serverTimestamp();
  settings.updatedBy = request.auth.uid;
  await db.collection("creditConfig").doc("default").set(settings, { merge: true });
  return { success: true };
});

exports.adminListUsers = onCall(async (request) => {
  requireAdmin(request);
  const pageSize = Math.min(Math.max(Number(request.data?.pageSize) || 50, 1), 100);
  const result = await getAuth().listUsers(pageSize);
  return { users: result.users.map((u) => ({ uid: u.uid, email: u.email || "", displayName: u.displayName || "", disabled: u.disabled })) };
});

exports.adminUpdateUser = onCall(async (request) => {
  requireAdmin(request);
  const { uid, action } = request.data || {};
  if (typeof uid !== "string" || !uid || !["enable", "disable"].includes(action)) {
    throw new HttpsError("invalid-argument", "A user ID and valid action are required.");
  }
  await getAuth().updateUser(uid, { disabled: action === "disable" });
  await db.collection("users").doc(uid).set({ accountStatus: action === "disable" ? "disabled" : "active", updatedAt: FieldValue.serverTimestamp() }, { merge: true });
  return { success: true };
});



const MAX_QUESTIONS = 400;
const PROCESSING_LOCK_MS = 120000;
const PAYMENT_BUSINESS_RULES_READY = false;

const CREDIT_COSTS = {
  "generate-ai-mock": Number(process.env.CREDIT_COST_AI_MOCK || 8),
  "generate-notes-mock": Number(process.env.CREDIT_COST_NOTES_MOCK || 10),
  "extract-notes-questions": Number(process.env.CREDIT_COST_NOTES_EXTRACT || 4),
  "parse-coaching-pdf": Number(process.env.CREDIT_COST_COACHING_PARSE || 6),
  "parse-question-bank": Number(process.env.CREDIT_COST_QUESTION_BANK || 8),
  "analyze-result": Number(process.env.CREDIT_COST_ANALYSIS || 3),
  "backlog-insights": Number(process.env.CREDIT_COST_BACKLOG_INSIGHTS || 2),
};

const ALLOWED_ARTIFACT_TYPES = new Set(Object.values(JOB_ARTIFACT_TYPE));

async function getAiRuntimeConfig(encryptionSecret) {
  const [settingsSnap, privateSnap] = await Promise.all([
    db.collection("creditConfig").doc("default").get(),
    db.collection("privateConfig").doc("ai").get(),
  ]);
  const settings = settingsSnap.exists ? settingsSnap.data() : {};
  const provider = settings.aiProvider || process.env.AI_PROVIDER || "gemini";
  const config = { provider };
  if (provider === "openai") {
    config.model = settings.aiModel || "gpt-4o-mini";
    config.baseUrl = settings.aiBaseUrl || "https://api.openai.com/v1/chat/completions";
  } else if (provider === "gemini") {
    config.model = settings.aiModel || "gemini-3.1-flash-lite";
    config.baseUrl = settings.aiBaseUrl || "https://generativelanguage.googleapis.com/v1beta";
  } else {
    config.model = settings.aiModel || process.env.AI_MODEL || "custom-model";
    config.baseUrl = settings.aiBaseUrl || process.env.AI_BASE_URL || "";
  }
  const privateConfig = privateSnap.exists ? privateSnap.data() : {};
  if (privateConfig.encryptedKey && encryptionSecret) {
    try {
      const decipher = crypto.createDecipheriv("aes-256-gcm", Buffer.from(encryptionSecret, "hex"), Buffer.from(privateConfig.iv, "base64"));
      decipher.setAuthTag(Buffer.from(privateConfig.authTag, "base64"));
      config.apiKey = Buffer.concat([
        decipher.update(Buffer.from(privateConfig.encryptedKey, "base64")),
        decipher.final(),
      ]).toString("utf8");
    } catch (error) {
      throw new HttpsError("failed-precondition", "Stored AI key could not be decrypted. Re-save it from Admin Panel.");
    }
  }
  if (settings.aiModel) config.model = String(settings.aiModel).slice(0, 120);
  if (settings.aiBaseUrl) config.baseUrl = String(settings.aiBaseUrl).slice(0, 500);
  if (provider === "custom" && !config.baseUrl) {
    throw new HttpsError("failed-precondition", "Set the custom AI provider base URL in Admin Panel.");
  }
  return config;
}

function requireUser(request) {
  if (!request.auth?.uid) {
    throw new HttpsError("unauthenticated", "Sign in required.");
  }
  return request.auth.uid;
}

function artifactRef(uid, id) {
  return db.collection("users").doc(uid).collection("artifacts").doc(id);
}

function answerKeyRef(uid, artifactId) {
  return db.collection("users").doc(uid).collection("answerKeys").doc(artifactId);
}

function stripAnswers(questions) {
  return (Array.isArray(questions) ? questions : []).map((question) => {
    const { correctOption, answer, correctAnswer, ...safe } = question;
    return safe;
  });
}

function extractAnswerMap(questions) {
  const map = {};
  (Array.isArray(questions) ? questions : []).forEach((question) => {
    if (question.id && question.correctOption) {
      map[question.id] = question.correctOption;
    }
  });
  return map;
}

function isStaleProcessing(data) {
  const updated = data?.updatedAt?.toMillis?.() || 0;
  return Date.now() - updated > PROCESSING_LOCK_MS;
}

async function claimArtifactLock(uid, artifactType, sourceHash, configHash) {
  if (!sourceHash || !artifactType) return null;
  const id = artifactDocId(artifactType, sourceHash, configHash);
  const ref = artifactRef(uid, id);

  const claimed = await db.runTransaction(async (tx) => {
    const snap = await tx.get(ref);
    if (snap.exists) {
      const data = snap.data();
      if (data.status === "ready" && Array.isArray(data.questions) && data.questions.length) {
        return { id, ref, data, reusable: true };
      }
      if (data.status === "processing" && !isStaleProcessing(data)) {
        throw new HttpsError(
          "already-exists",
          "This source and configuration is already being processed. Retry in a moment."
        );
      }
    }

    tx.set(ref, {
      uid,
      artifactType,
      sourceHash,
      configHash,
      status: "processing",
      updatedAt: FieldValue.serverTimestamp(),
      createdAt: snap.exists ? snap.data().createdAt || FieldValue.serverTimestamp() : FieldValue.serverTimestamp(),
    }, { merge: true });
    return { id, ref, data: null, reusable: false };
  });

  return claimed;
}

async function markReady(ref, fields) {
  await ref.set({
    ...fields,
    status: "ready",
    error: FieldValue.delete(),
    updatedAt: FieldValue.serverTimestamp(),
  }, { merge: true });
}

async function markFailed(ref, errorMessage) {
  if (!ref) return;
  await ref.set({
    status: "failed",
    error: String(errorMessage || "Processing failed.").slice(0, 400),
    updatedAt: FieldValue.serverTimestamp(),
  }, { merge: true });
}

function sanitizeQuestions(raw, options) {
  const { questions } = validateQuestionSet(raw, options);
  if (questions.length > MAX_QUESTIONS) {
    throw new HttpsError("invalid-argument", `A question set cannot exceed ${MAX_QUESTIONS} questions.`);
  }
  return questions;
}

// Intentionally not used for client-stored artifacts: the client never
// receives answer keys, so storeQuestionArtifact validates structure only.
// Server-generated artifacts (runAiJob) validate answers before stripping.
function requireAnswerForType(artifactType) {
  return artifactType === "ai-mock" || artifactType === "notes-ai-mock";
}

async function debitCredits(uid, jobType, units = 1) {
  const cost = (CREDIT_COSTS[jobType] || 1) * units;
  const userRef = db.collection("users").doc(uid);

  await db.runTransaction(async (tx) => {
    const snap = await tx.get(userRef);
    const current = Number(snap.data()?.credits || 0);
    if (current < cost) {
      throw new HttpsError("resource-exhausted", "Not enough AI credits.");
    }
    tx.update(userRef, { credits: current - cost, updatedAt: FieldValue.serverTimestamp() });
    tx.set(userRef.collection("creditLedger").doc(), {
      type: "debit",
      jobType,
      amount: cost,
      createdAt: FieldValue.serverTimestamp(),
    });
  });

  return cost;
}

async function refundCredits(uid, jobType, amount) {
  if (!amount) return;
  const userRef = db.collection("users").doc(uid);
  await db.runTransaction(async (tx) => {
    const snap = await tx.get(userRef);
    const current = Number(snap.data()?.credits || 0);
    tx.update(userRef, { credits: current + amount, updatedAt: FieldValue.serverTimestamp() });
    tx.set(userRef.collection("creditLedger").doc(), {
      type: "refund",
      jobType,
      amount,
      createdAt: FieldValue.serverTimestamp(),
    });
  });
}

function evaluateAnswers(questions = [], answers = {}, answerMap = null) {
  return questions.map((question) => {
    const selected = answers[question.id];
    if (!selected) return { id: question.id, status: "skipped" };
    const correct = answerMap ? answerMap[question.id] : question.correctOption;
    if (!correct) return { id: question.id, status: "pending" };
    return {
      id: question.id,
      status: selected === correct ? "correct" : "wrong",
    };
  });
}

function trustedAnalysisPayload(attempt) {
  return {
    score: Number(attempt.score || 0),
    correct: Number(attempt.correct || 0),
    wrong: Number(attempt.wrong || 0),
    skipped: Number(attempt.skipped || 0),
    accuracy: Number(attempt.accuracy || 0),
    timeUsedSeconds: Number(attempt.timeUsedSeconds || 0),
    subject: attempt.subject || "",
    examPattern: attempt.examPattern || "",
    testType: attempt.testType || "",
    selectedChapters: Array.isArray(attempt.selectedChapters) ? attempt.selectedChapters : [],
    chapterPerformance: attempt.chapterPerformance || {},
    subjectPerformance: attempt.subjectPerformance || {},
  };
}

exports.runAiJob = onCall({
  cors: true,
  enforceAppCheck: true,
  timeoutSeconds: 120,
  secrets: [aiConfigEncryptionKey],
}, async (request) => {
  const uid = requireUser(request);
  const jobType = request.data?.jobType;
  const payload = request.data?.payload || {};

  if (jobType === "evaluate-answers") {
    return {
      evaluation: evaluateAnswers(payload.questions || [], payload.answers || {}),
      provider: "server",
      model: "local-evaluator",
    };
  }

  if (!CREDIT_COSTS[jobType]) {
    throw new HttpsError("invalid-argument", "Unknown AI job type.");
  }

  const artifactType = JOB_ARTIFACT_TYPE[jobType] || null;
  const sourceHash = String(payload.sourceHash || payload.configHash || "").trim();
  const configHash = String(payload.configHash || sourceHash).trim();
  let cache = null;

  if (artifactType && sourceHash) {
    cache = await claimArtifactLock(uid, artifactType, sourceHash, configHash);
    if (cache?.reusable) {
      return {
        questions: stripAnswers(cache.data.questions),
        artifactId: cache.id,
        reused: true,
        provider: cache.data.provider || "cache",
        model: cache.data.model || "",
      };
    }
  }

  let cost = 0;
  try {
    cost = await debitCredits(uid, jobType);
  } catch (error) {
    await markFailed(cache?.ref, error.message);
    throw error;
  }
  const jobRef = db.collection("aiJobs").doc();
  await jobRef.set({
    uid,
    jobType,
    status: "running",
    createdAt: FieldValue.serverTimestamp(),
  });

  try {
    let result = { questions: [], analysis: null, evaluation: null, provider: null, model: null, artifactId: null, reused: false };

    if (jobType === "analyze-result") {
      const attemptId = String(payload.attemptId || "").replace(/[^a-zA-Z0-9_-]/g, "").slice(0, 80);
      if (!attemptId) {
        throw new HttpsError("invalid-argument", "Official attempt id is required for AI analysis.");
      }
      const attemptSnap = await db.collection("users").doc(uid).collection("attempts").doc(attemptId).get();
      if (!attemptSnap.exists || !attemptSnap.data().trusted) {
        throw new HttpsError("failed-precondition", "AI analysis can only run on an official server result.");
      }
      const runtimeConfig = await getAiRuntimeConfig(aiConfigEncryptionKey.value());
      const ai = await callAi({
        apiKeyValue: () => runtimeConfig.apiKey,
        runtimeConfig,
        jobType,
        system: "You analyze trusted exam metrics only. Return JSON with strengths, weakTopics, accuracyPatterns, timeManagement, recommendations. Never invent official scores, XP, streak, or rank. Do not claim to overwrite results.",
        user: JSON.stringify(trustedAnalysisPayload(attemptSnap.data())),
      });
      result = { ...result, analysis: ai.data, provider: ai.provider, model: ai.model };
    } else if (jobType === "backlog-insights") {
      const runtimeConfig = await getAiRuntimeConfig(aiConfigEncryptionKey.value());
      const ai = await callAi({
        apiKeyValue: () => runtimeConfig.apiKey,
        runtimeConfig,
        jobType,
        system: "You give study-plan insights from backlog metadata. Return JSON with strengths, weakTopics, recommendations. Never invent lecture completion. The planner remains authoritative.",
        user: JSON.stringify({
          subjects: payload.subjects || [],
          progress: payload.progress || {},
          pendingLectures: payload.pendingLectures || null,
        }),
      });
      result = { ...result, analysis: ai.data, provider: ai.provider, model: ai.model };
    } else {
      const parseJobs = ["parse-coaching-pdf", "parse-question-bank", "extract-notes-questions"];
      const sourceText = String(payload.extractedText || payload.notesExcerpt || "").trim();
      if (parseJobs.includes(jobType) && !sourceText) {
        throw new HttpsError(
          "failed-precondition",
          "No selectable text was provided. Scanned or image-only PDFs cannot be parsed because OCR did not run."
        );
      }
      if (jobType === "generate-notes-mock" && !sourceText) {
        throw new HttpsError(
          "failed-precondition",
          "Notes text is required to generate a notes-grounded mock. Scanned PDFs are not OCR'd."
        );
      }

      const requireAnswer = jobType === "generate-ai-mock" || jobType === "generate-notes-mock";
      const allowedChapters = Array.isArray(payload.selectedChapters) ? payload.selectedChapters.filter(Boolean) : [];
      const runtimeConfig = await getAiRuntimeConfig(aiConfigEncryptionKey.value());
      const ai = await callAi({
        apiKeyValue: () => runtimeConfig.apiKey,
        runtimeConfig,
        jobType,
        system: "Generate valid MCQ JSON: { questions: [{ id, questionText, options, correctOption, subject, chapter, questionType, examPattern, studyClass }] }. Options must be an array of at least 2 strings. Stay inside the provided syllabus chapters. Never invent off-syllabus topics. If source text is provided, only use that text. Never invent fake questions to fill a quota if the source cannot support them.",
        user: JSON.stringify({ jobType, payload: { ...payload, extractedText: sourceText.slice(0, 20000), notesExcerpt: sourceText.slice(0, 12000) } }),
      });

      const questions = sanitizeQuestions(ai.data?.questions || ai.data, {
        requireAnswer,
        allowedChapters,
        meta: {
          subject: payload.subject,
          difficulty: payload.difficulty,
          examPattern: payload.examPattern,
          studyClass: payload.studyClass,
        },
      });

      if (!questions.length) {
        throw new HttpsError("internal", "AI returned no valid questions. The malformed output was rejected.");
      }

      // Split: public questions for client, private answer key for server
      const publicQuestions = stripAnswers(questions);
      const answerMap = extractAnswerMap(questions);

      result = {
        ...result,
        questions: publicQuestions,
        provider: ai.provider,
        model: ai.model,
      };

      if (cache?.ref) {
        await markReady(cache.ref, {
          uid,
          artifactType,
          sourceHash,
          configHash,
          questions: publicQuestions,
          provider: ai.provider,
          model: ai.model,
        });
        await answerKeyRef(uid, cache.id).set({
          uid,
          artifactId: cache.id,
          answers: answerMap,
          createdAt: FieldValue.serverTimestamp(),
        });
        result.artifactId = cache.id;
      }
    }

    await jobRef.update({ status: "ready", updatedAt: FieldValue.serverTimestamp() });
    return result;
  } catch (error) {
    await refundCredits(uid, jobType, cost);
    await markFailed(cache?.ref, error.message);
    await jobRef.update({ status: "failed", error: String(error.message || "AI job failed").slice(0, 400) });
    if (error instanceof HttpsError) throw error;
    throw new HttpsError("internal", error.message || "AI job failed.");
  }
});

exports.storeQuestionArtifact = onCall({ cors: true }, async (request) => {
  const uid = requireUser(request);
  const data = request.data || {};
  const artifactType = String(data.artifactType || "").trim();
  const sourceHash = String(data.sourceHash || "").trim();
  const configHash = String(data.configHash || sourceHash).trim();

  if (!ALLOWED_ARTIFACT_TYPES.has(artifactType)) {
    throw new HttpsError("invalid-argument", "Unknown artifact type.");
  }
  if (!sourceHash) {
    throw new HttpsError("invalid-argument", "sourceHash is required.");
  }

  const cache = await claimArtifactLock(uid, artifactType, sourceHash, configHash);
  if (cache?.reusable) {
    return { artifactId: cache.id, reused: true, questionCount: cache.data.questions.length };
  }

  try {
    const questions = sanitizeQuestions(data.questions || [], {
      requireAnswer: false,
      allowedChapters: Array.isArray(data.selectedChapters) ? data.selectedChapters : [],
      meta: {
        subject: data.subject,
        examPattern: data.examPattern,
        studyClass: data.studyClass,
      },
    });

    if (!questions.length) {
      throw new HttpsError("invalid-argument", "No valid questions were provided.");
    }

    // Split: public questions for client, private answer key for server
    const publicQuestions = stripAnswers(questions);
    const answerMap = extractAnswerMap(questions);

    await markReady(cache.ref, {
      uid,
      artifactType,
      sourceHash,
      configHash,
      questions: publicQuestions,
      provider: "local-parse",
      model: "",
      bookId: data.bookId || null,
    });

    await answerKeyRef(uid, cache.id).set({
      uid,
      artifactId: cache.id,
      answers: answerMap,
      createdAt: FieldValue.serverTimestamp(),
    });

    return { artifactId: cache.id, reused: false, questionCount: questions.length };
  } catch (error) {
    await markFailed(cache?.ref, error.message);
    if (error instanceof HttpsError) throw error;
    throw new HttpsError("internal", error.message || "Could not store the question set.");
  }
});

exports.submitTestAttempt = onCall({ cors: true }, async (request) => {
  const uid = requireUser(request);
  const payload = request.data || {};
  const attemptId = String(payload.attemptId || "").replace(/[^a-zA-Z0-9_-]/g, "").slice(0, 80);
  const artifactId = String(payload.artifactId || "").trim();

  if (!attemptId) {
    throw new HttpsError("invalid-argument", "A valid attempt id is required.");
  }
  if (!artifactId) {
    throw new HttpsError(
      "failed-precondition",
      "This attempt has no trusted question artifact, so official scoring cannot run."
    );
  }

  const attemptRef = db.collection("users").doc(uid).collection("attempts").doc(attemptId);
  const existing = await attemptRef.get();
  if (existing.exists) {
    return {
      duplicate: true,
      result: existing.data(),
      streak: existing.data().streakAfter || null,
      totalXP: existing.data().totalXPAfter || null,
      globalRank: existing.data().globalRankAfter || null,
    };
  }

  const artifactSnap = await db.collection("users").doc(uid).collection("artifacts").doc(artifactId).get();
  if (!artifactSnap.exists) {
    throw new HttpsError("not-found", "Trusted question set was not found.");
  }

  const artifact = artifactSnap.data();
  if (artifact.status !== "ready") {
    throw new HttpsError("failed-precondition", "The trusted question set is not ready.");
  }
  if (artifact.uid && artifact.uid !== uid) {
    throw new HttpsError("permission-denied", "This question set does not belong to the signed-in user.");
  }

  const questions = Array.isArray(artifact.questions) ? artifact.questions : [];
  if (!questions.length) {
    throw new HttpsError("failed-precondition", "The trusted question set is empty.");
  }

  // Load private answer key (server-only, not client-readable)
  let answerMap = {};
  const answerKeySnap = await answerKeyRef(uid, artifactId).get();
  if (answerKeySnap.exists) {
    answerMap = answerKeySnap.data().answers || {};
  } else {
    // Legacy migration: extract answers from artifact questions if present,
    // then strip the artifact to prevent future leaks.
    const legacyAnswers = extractAnswerMap(questions);
    if (Object.keys(legacyAnswers).length) {
      answerMap = legacyAnswers;
      await answerKeyRef(uid, artifactId).set({
        uid,
        artifactId,
        answers: answerMap,
        createdAt: FieldValue.serverTimestamp(),
      });
      await artifactRef(uid, artifactId).set({
        questions: stripAnswers(questions),
      }, { merge: true });
    }
  }

  // Validate answers payload shape and size
  const answers = payload.answers && typeof payload.answers === "object" ? payload.answers : {};
  const answerKeys = Object.keys(answers);
  if (answerKeys.length > 500) {
    throw new HttpsError("invalid-argument", "Too many answers submitted.");
  }
  for (const key of answerKeys) {
    const value = answers[key];
    if (typeof value !== "string" || !["A", "B", "C", "D"].includes(value)) {
      throw new HttpsError("invalid-argument", "Invalid answer format.");
    }
  }

  // Validate markedForReview and visitedQuestions shapes
  const markedForReview = payload.markedForReview && typeof payload.markedForReview === "object" ? payload.markedForReview : {};
  const visitedQuestions = payload.visitedQuestions && typeof payload.visitedQuestions === "object" ? payload.visitedQuestions : {};
  if (Object.keys(markedForReview).length > 500) {
    throw new HttpsError("invalid-argument", "Too many marked questions.");
  }
  if (Object.keys(visitedQuestions).length > 500) {
    throw new HttpsError("invalid-argument", "Too many visited questions.");
  }

  // Validate timeUsedSeconds
  const timeUsedSeconds = Number(payload.timeUsedSeconds || 0);
  if (!Number.isFinite(timeUsedSeconds) || timeUsedSeconds < 0 || timeUsedSeconds > 86400) {
    throw new HttpsError("invalid-argument", "Invalid time used value.");
  }

  const evaluation = evaluateAnswers(questions, answers, answerMap);

  const chapterPerformance = {};
  const subjectPerformance = {};
  let correct = 0;
  let wrong = 0;
  let skipped = 0;

  questions.forEach((question) => {
    const item = evaluation.find((entry) => entry.id === question.id) || { status: "skipped" };
    const chapter = question.chapter || "Unspecified";
    const qSubject = question.subject || payload.subject || "General";
    if (!chapterPerformance[chapter]) chapterPerformance[chapter] = { correct: 0, wrong: 0, skipped: 0, total: 0 };
    if (!subjectPerformance[qSubject]) subjectPerformance[qSubject] = { correct: 0, wrong: 0, skipped: 0, total: 0 };
    chapterPerformance[chapter].total += 1;
    subjectPerformance[qSubject].total += 1;
    if (item.status === "correct") {
      correct += 1;
      chapterPerformance[chapter].correct += 1;
      subjectPerformance[qSubject].correct += 1;
    } else if (item.status === "wrong") {
      wrong += 1;
      chapterPerformance[chapter].wrong += 1;
      subjectPerformance[qSubject].wrong += 1;
    } else {
      skipped += 1;
      chapterPerformance[chapter].skipped += 1;
      subjectPerformance[qSubject].skipped += 1;
    }
  });

  const evaluated = correct + wrong;
  const result = {
    attemptId,
    artifactId,
    testType: payload.testType || "custom",
    examPattern: payload.examPattern || "custom",
    studyClass: payload.studyClass || "",
    subject: payload.subject || "",
    selectedChapters: Array.isArray(payload.selectedChapters) ? payload.selectedChapters : [],
    score: correct,
    totalQuestions: questions.length,
    correct,
    wrong,
    skipped,
    attempted: Object.keys(answers).length,
    markedForReviewCount: Object.keys(markedForReview).length,
    visitedCount: Object.keys(visitedQuestions).length,
    accuracy: evaluated > 0 ? Math.round((correct / evaluated) * 100) : 0,
    timeUsedSeconds,
    chapterPerformance,
    subjectPerformance,
    evaluationComplete: Object.keys(answerMap).length > 0,
    evaluationSource: "server",
    trusted: true,
    autoSubmitted: Boolean(payload.autoSubmitted),
    clientCreatedAt: new Date().toISOString(),
  };

  const xpGain = (correct * Number(process.env.XP_PER_CORRECT || 10))
    + Number(process.env.XP_TEST_COMPLETION || 15);

  const userRef = db.collection("users").doc(uid);
  const today = new Date().toISOString().slice(0, 10);
  let progress = { streak: 1, totalXP: xpGain, globalRank: 0, lastActivityDate: today };

  let duplicateResult = null;
  await db.runTransaction(async (tx) => {
    const attemptNow = await tx.get(attemptRef);
    if (attemptNow.exists) {
      duplicateResult = attemptNow.data();
      return;
    }

    const userSnap = await tx.get(userRef);
    const profile = userSnap.exists ? userSnap.data() : {};
    const last = profile.lastActivityDate || "";
    let streak = Number(profile.streak || 0);
    if (last === today) {
      streak = streak || 1;
    } else {
      const yesterday = new Date();
      yesterday.setUTCDate(yesterday.getUTCDate() - 1);
      const yesterdayKey = yesterday.toISOString().slice(0, 10);
      streak = last === yesterdayKey ? streak + 1 : 1;
    }
    const totalXP = Number(profile.totalXP || 0) + xpGain;
    progress = { streak, totalXP, lastActivityDate: today, globalRank: Number(profile.globalRank || 0) };

    tx.create(attemptRef, {
      ...result,
      answers,
      xpAwarded: xpGain,
      createdAt: FieldValue.serverTimestamp(),
    });
    tx.set(userRef, {
      streak,
      totalXP,
      lastActivityDate: today,
      updatedAt: FieldValue.serverTimestamp(),
    }, { merge: true });
    tx.set(db.collection("publicLeaderboard").doc(uid), {
      uid,
      displayName: profile.name || profile.email || "Student",
      xp: totalXP,
      updatedAt: FieldValue.serverTimestamp(),
    }, { merge: true });
  });

  if (duplicateResult) {
    return {
      duplicate: true,
      result: duplicateResult,
      streak: duplicateResult.streakAfter || null,
      totalXP: duplicateResult.totalXPAfter || null,
      globalRank: duplicateResult.globalRankAfter || null,
    };
  }

  const higher = await db.collection("publicLeaderboard").where("xp", ">", progress.totalXP).count().get();
  const globalRank = Number(higher.data().count || 0) + 1;
  await userRef.set({ globalRank, updatedAt: FieldValue.serverTimestamp() }, { merge: true });
  await attemptRef.set({
    globalRankAfter: globalRank,
    streakAfter: progress.streak,
    totalXPAfter: progress.totalXP,
  }, { merge: true });
  await db.collection("publicLeaderboard").doc(uid).set({ rank: globalRank }, { merge: true });

  return {
    duplicate: false,
    result: { ...result, globalRankAfter: globalRank, streakAfter: progress.streak, totalXPAfter: progress.totalXP },
    streak: progress.streak,
    totalXP: progress.totalXP,
    globalRank,
  };
});

exports.createPaymentOrder = onCall({
  cors: true,
  secrets: [razorpayKeyId, razorpayKeySecret],
}, async (request) => {
  requireUser(request);
  if (!PAYMENT_BUSINESS_RULES_READY) {
    throw new HttpsError(
      "failed-precondition",
      "Payment is not production-ready. Pricing, packages, subscriptions, and fulfillment are intentionally pending."
    );
  }

  const secret = razorpayKeySecret.value();
  const keyId = razorpayKeyId.value();
  if (!secret || !keyId) {
    throw new HttpsError("failed-precondition", "Razorpay is not configured on the server.");
  }

  const planId = request.data?.planId;
  const configSnap = await db.collection("creditConfig").doc("default").get();
  const config = { ...DEFAULT_PLATFORM_SETTINGS, ...(configSnap.exists ? configSnap.data() : {}) };
  const dynamicPlans = {
    pro: { amountPaise: Number(config.proPriceInr) * 100, credits: Number(config.proMonthlyCredits), label: "RankWorld Pro" },
    booster: { amountPaise: Number(config.boosterPriceInr) * 100, credits: Number(config.boosterCredits), label: "Credit Booster" },
  };
  const plan = dynamicPlans[planId];
  if (!plan) throw new HttpsError("invalid-argument", "Unknown plan.");

  const auth = Buffer.from(`${keyId}:${secret}`).toString("base64");
  const response = await fetch("https://api.razorpay.com/v1/orders", {
    method: "POST",
    headers: {
      Authorization: `Basic ${auth}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      amount: plan.amountPaise,
      currency: "INR",
      receipt: `${planId}-${Date.now()}`,
      notes: { uid: request.auth.uid, planId },
    }),
  });

  if (!response.ok) {
    throw new HttpsError("unavailable", "Could not create a payment order.");
  }

  const order = await response.json();
  return { orderId: order.id, amount: order.amount, currency: order.currency, planId };
});

exports.razorpayWebhook = onRequest({
  secrets: [razorpayWebhookSecret],
}, async (req, res) => {
  const secret = razorpayWebhookSecret.value();
  if (!secret) {
    res.status(503).send("Webhook is not configured.");
    return;
  }

  const signature = req.headers["x-razorpay-signature"];
  const rawBody = req.rawBody ? req.rawBody.toString("utf8") : "";
  if (!signature || !rawBody) {
    res.status(400).send("Missing webhook signature.");
    return;
  }

  const expected = crypto.createHmac("sha256", secret).update(rawBody).digest("hex");
  const signatureBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expected);
  if (
    signatureBuffer.length !== expectedBuffer.length ||
    !crypto.timingSafeEqual(signatureBuffer, expectedBuffer)
  ) {
    res.status(400).send("Invalid webhook signature.");
    return;
  }

  res.status(200).json({
    received: true,
    credited: false,
    reason: "Signature verified. Payment business rules are intentionally pending, so no credits, packages, or subscriptions were granted.",
  });
});
