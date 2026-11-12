const OPTION_KEYS = ["A", "B", "C", "D"];

function asText(value) {
  return String(value || "").trim();
}

function normalizeQuestion(raw, index = 0, meta = {}) {
  const optionsSource = Array.isArray(raw?.options) ? raw.options : [];
  const options = optionsSource
    .map((option) => asText(typeof option === "object" ? option.text || option.value : option))
    .filter(Boolean)
    .slice(0, 6);

  const correct = asText(raw?.correctOption || raw?.answer || raw?.correctAnswer).toUpperCase();

  return {
    id: asText(raw?.id) || `q-${index + 1}`,
    questionNumber: Number(raw?.questionNumber || index + 1),
    questionText: asText(raw?.questionText || raw?.text || raw?.question),
    options,
    correctOption: OPTION_KEYS.includes(correct) ? correct : null,
    subject: asText(raw?.subject) || asText(meta.subject) || "General",
    chapter: asText(raw?.chapter),
    difficulty: asText(raw?.difficulty) || asText(meta.difficulty) || "moderate",
    questionType: asText(raw?.questionType || raw?.type) || "mcq",
    examPattern: asText(raw?.examPattern) || asText(meta.examPattern) || "",
    studyClass: asText(raw?.studyClass) || asText(meta.studyClass) || "",
  };
}

function validateQuestion(question, { requireAnswer = false, allowedChapters = [] } = {}) {
  if (!question.questionText) return { ok: false, reason: "Missing question text." };
  if (question.options.length < 2) return { ok: false, reason: "A question needs at least two options." };
  if (question.questionType && question.questionType !== "mcq") {
    return { ok: false, reason: "Only MCQ questions are supported." };
  }
  if (requireAnswer && !question.correctOption) {
    return { ok: false, reason: "Missing correct answer." };
  }
  if (requireAnswer && !question.subject) {
    return { ok: false, reason: "Missing subject." };
  }
  if (requireAnswer && !question.chapter) {
    return { ok: false, reason: "Missing chapter." };
  }
  if (requireAnswer && allowedChapters.length && !allowedChapters.includes(question.chapter)) {
    return { ok: false, reason: "Chapter is outside the selected syllabus." };
  }
  return { ok: true, reason: "" };
}

function validateQuestionSet(rawQuestions = [], options = {}) {
  const accepted = [];
  const rejected = [];
  (Array.isArray(rawQuestions) ? rawQuestions : []).forEach((raw, index) => {
    const question = normalizeQuestion(raw, index, options.meta || {});
    const check = validateQuestion(question, options);
    if (check.ok) accepted.push(question);
    else rejected.push({ index, reason: check.reason });
  });
  return { questions: accepted, rejected };
}

module.exports = { validateQuestionSet, normalizeQuestion };
