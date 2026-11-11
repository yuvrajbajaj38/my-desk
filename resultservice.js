import {
  collection,
  getDocs,
  limit,
  orderBy,
  query,
} from "firebase/firestore";
import { httpsCallable } from "firebase/functions";
import { db, functions } from "../firebase/config";

export const buildResultModel = ({
  attempt,
  questions = [],
  answers = {},
  markedForReview = {},
  visitedQuestions = {},
  timeUsedSeconds = 0,
  testType = "custom",
  examPattern = "custom",
  studyClass = "",
  subject = "",
  selectedChapters = [],
}) => {
  const totalQuestions = questions.length;
  let correct = 0;
  let wrong = 0;
  let skipped = 0;
  const chapterPerformance = {};
  const subjectPerformance = {};

  questions.forEach((question) => {
    const selected = answers[question.id];
    const chapter = question.chapter || "Unspecified";
    const qSubject = question.subject || subject || "General";
    if (!chapterPerformance[chapter]) chapterPerformance[chapter] = { correct: 0, wrong: 0, skipped: 0, total: 0 };
    if (!subjectPerformance[qSubject]) subjectPerformance[qSubject] = { correct: 0, wrong: 0, skipped: 0, total: 0 };
    chapterPerformance[chapter].total += 1;
    subjectPerformance[qSubject].total += 1;

    if (!selected) {
      skipped += 1;
      chapterPerformance[chapter].skipped += 1;
      subjectPerformance[qSubject].skipped += 1;
      return;
    }

    // Client no longer receives correctOption. Local preview cannot score.
    // Official scoring happens server-side via submitTestAttempt.
    // Mark as pending so the UI shows "Pending key" until server result arrives.
    chapterPerformance[chapter].skipped += 1;
    subjectPerformance[qSubject].skipped += 1;
  });

  const evaluated = correct + wrong;
  const accuracy = evaluated > 0 ? Math.round((correct / evaluated) * 100) : 0;
  const score = correct;
  const evaluationComplete = false;

  return {
    attemptId: attempt?.testId || `attempt-${Date.now()}`,
    testType,
    examPattern,
    studyClass,
    subject,
    selectedChapters,
    score,
    totalQuestions,
    correct,
    wrong,
    skipped,
    attempted: Object.keys(answers || {}).length,
    markedForReviewCount: Object.keys(markedForReview || {}).length,
    visitedCount: Object.keys(visitedQuestions || {}).length,
    accuracy,
    timeUsedSeconds,
    chapterPerformance,
    subjectPerformance,
    evaluationComplete,
    evaluationSource: "pending-server",
    createdAt: new Date().toISOString(),
  };
};

export const saveAttemptResult = async (uid, result, submission = {}) => {
  if (!uid) return { success: false, error: "Not signed in." };

  try {
    const callable = httpsCallable(functions, "submitTestAttempt");
    const response = await callable({
      attemptId: result.attemptId,
      artifactId: submission.artifactId || result.artifactId || null,
      answers: submission.answers || {},
      markedForReview: submission.markedForReview || {},
      visitedQuestions: submission.visitedQuestions || {},
      timeUsedSeconds: result.timeUsedSeconds || 0,
      autoSubmitted: Boolean(submission.autoSubmitted),
      testType: result.testType,
      examPattern: result.examPattern,
      studyClass: result.studyClass,
      subject: result.subject,
      selectedChapters: result.selectedChapters || [],
    });
    return { success: true, trusted: true, data: response.data };
  } catch (error) {
    return {
      success: false,
      trusted: false,
      error: error.message || "Official result could not be saved.",
    };
  }
};

export const listAttemptResults = async (uid, max = 20) => {
  if (!uid) return [];

  try {
    const q = query(
      collection(db, "users", uid, "attempts"),
      orderBy("clientCreatedAt", "desc"),
      limit(max)
    );
    const snap = await getDocs(q);
    return snap.docs.map((docSnap) => ({ id: docSnap.id, ...docSnap.data() }));
  } catch {
    try {
      const snap = await getDocs(collection(db, "users", uid, "attempts"));
      return snap.docs
        .map((docSnap) => ({ id: docSnap.id, ...docSnap.data() }))
        .sort((a, b) => String(b.clientCreatedAt || "").localeCompare(String(a.clientCreatedAt || "")));
    } catch (error) {
      console.error("Failed to load attempts:", error);
      return [];
    }
  }
};

export const summarizeAttempts = (attempts = []) => {
  const trusted = attempts.filter((item) => item.trusted === true);
  const testsAttempted = trusted.length;
  const totalQuestions = trusted.reduce((sum, item) => sum + (item.totalQuestions || 0), 0);
  const totalCorrect = trusted.reduce((sum, item) => sum + (item.correct || 0), 0);
  const totalEvaluated = trusted.reduce((sum, item) => sum + ((item.correct || 0) + (item.wrong || 0)), 0);
  const accuracy = totalEvaluated > 0 ? Math.round((totalCorrect / totalEvaluated) * 100) : 0;
  const subjectTotals = {};

  trusted.forEach((attempt) => {
    Object.entries(attempt.subjectPerformance || {}).forEach(([name, stats]) => {
      if (!subjectTotals[name]) subjectTotals[name] = { correct: 0, total: 0 };
      subjectTotals[name].correct += stats.correct || 0;
      subjectTotals[name].total += stats.total || 0;
    });
  });

  const subjectProgress = Object.entries(subjectTotals).map(([name, stats]) => ({
    name,
    accuracy: stats.total ? Math.round((stats.correct / stats.total) * 100) : 0,
    total: stats.total,
  }));

  const weakest = [...subjectProgress].sort((a, b) => a.accuracy - b.accuracy)[0] || null;

  return {
    testsAttempted,
    totalQuestions,
    accuracy,
    subjectProgress,
    weakest,
  };
};

export const buildLocalAnalysis = (result) => {
  if (!result) return null;

  const chapterEntries = Object.entries(result.chapterPerformance || {}).map(([chapter, stats]) => {
    const evaluated = (stats.correct || 0) + (stats.wrong || 0);
    return {
      chapter,
      accuracy: evaluated ? Math.round((stats.correct / evaluated) * 100) : 0,
      ...stats,
    };
  });

  const weakTopics = chapterEntries.filter((item) => item.accuracy < 60 && item.total > 0).map((item) => item.chapter);
  const strengths = chapterEntries.filter((item) => item.accuracy >= 75).map((item) => item.chapter);
  const avgSeconds = result.totalQuestions ? Math.round((result.timeUsedSeconds || 0) / result.totalQuestions) : 0;

  return {
    source: "local-metrics",
    strengths: strengths.length ? strengths : ["Complete more evaluated tests to identify strengths."],
    weakTopics: weakTopics.length ? weakTopics : ["No weak topics yet. Take an evaluated test first."],
    accuracyPatterns: `Overall accuracy is ${result.accuracy || 0}% with ${result.correct || 0} correct and ${result.wrong || 0} incorrect.`,
    timeManagement: `Average time per question was ${avgSeconds}s.`,
    chapterPerformance: chapterEntries,
    recommendations: weakTopics.length
      ? [`Revise ${weakTopics.slice(0, 3).join(", ")} and attempt a focused mock on those chapters.`]
      : ["Keep a consistent test cadence to unlock richer recommendations."],
    rankPrediction: null,
  };
};