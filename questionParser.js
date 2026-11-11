import { validateQuestionSet } from "./questionSchema";

const splitQuestions = (text) => {
  const source = String(text || "").replace(/\r/g, "\n");
  const chunks = source.split(/(?=(?:^|\n)\s*(?:Q(?:uestion)?[\s.]*)?\d{1,3}[).:-]\s+)/i);
  return chunks.map((chunk) => chunk.trim()).filter((chunk) => chunk.length > 20);
};

const extractOptions = (block) => {
  const matches = [...String(block).matchAll(/(?:\(|\[)?([A-D])(?:\)|\]|\.)\s*([^]+?)(?=(?:\(|\[)?[A-D](?:\)|\]|\.)\s*|$)/gi)];
  if (matches.length >= 2) {
    return matches.slice(0, 4).map((match) => match[2].replace(/\s+/g, " ").trim());
  }
  return [];
};

const extractPrompt = (block) => {
  return String(block)
    .replace(/^(?:Q(?:uestion)?[\s.]*)?\d{1,3}[).:-]\s*/i, "")
    .replace(/(?:\(|\[)?[A-D](?:\)|\]|\.)\s*[^]+$/i, "")
    .replace(/\s+/g, " ")
    .trim();
};

const extractAnswerMap = (text) => {
  const map = {};
  const matches = String(text || "").matchAll(/(?:Q(?:uestion)?[\s.]*)?(\d{1,3})[).:\s-]+(?:answer\s*[:=-]?\s*)?([A-D])/gi);
  for (const match of matches) {
    map[Number(match[1])] = String(match[2]).toUpperCase();
  }
  return map;
};

export const parseQuestionsFromText = (text) => {
  const blocks = splitQuestions(text);
  const raw = blocks.map((block, index) => {
    const options = extractOptions(block);
    return {
      id: `parsed-${index + 1}`,
      questionNumber: index + 1,
      questionText: extractPrompt(block) || `Question ${index + 1}`,
      options,
    };
  });

  return validateQuestionSet(raw);
};

export const mapAnswerKey = (questions, answerKeyText) => {
  const answers = extractAnswerMap(answerKeyText);
  return questions.map((question) => ({
    ...question,
    correctOption: answers[question.questionNumber] || question.correctOption || null,
  }));
};
