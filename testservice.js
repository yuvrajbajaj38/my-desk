export const startTest = ({ testId, examPattern, advancedPaper, durationMinutes, verificationMethod }) => ({
  testId,
  examPattern,
  advancedPaper: advancedPaper || null,
  durationMinutes,
  verificationMethod: verificationMethod || 'uploadKey',
  startedAt: new Date().toISOString(),
  submittedAt: null,
  autoSubmitted: false,
  answers: {},
  markedForReview: {},
  visitedQuestions: {},
});

export const saveAttempt = (attempt, updates = {}) => ({
  ...attempt,
  ...updates,
  updatedAt: new Date().toISOString(),
});

export const submitTest = (attempt, { autoSubmitted = false } = {}) => ({
  ...attempt,
  submittedAt: new Date().toISOString(),
  autoSubmitted,
});

// Client-side evaluation is intentionally removed.
// The client never receives correctOption, so local scoring is impossible.
// Official scoring happens server-side via submitTestAttempt.
export const evaluateWithAnswerKey = async () => {
  return {
    status: "pending",
    message: "Official scoring runs server-side via submitTestAttempt. The client does not receive answer keys.",
  };
};

export const evaluateWithAI = async () => {
  return {
    status: "pending",
    message: "AI evaluation runs through the server-side runAiJob('evaluate-answers') function.",
  };
};