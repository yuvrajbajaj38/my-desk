const test = require('node:test');
const assert = require('node:assert/strict');
const { validateQuestionSet, normalizeQuestion } = require('../questionValidation');

test('normalizes a valid answered MCQ and preserves selected chapter metadata', () => {
  const result = validateQuestionSet([{
    id: 'q-1', questionText: 'What is 2 + 2?',
    options: ['2', '3', '4', '5'], correctOption: 'C',
    subject: 'Mathematics', chapter: 'Basic Mathematics',
  }], { requireAnswer: true, allowedChapters: ['Basic Mathematics'] });
  assert.equal(result.questions.length, 1);
  assert.equal(result.questions[0].correctOption, 'C');
  assert.equal(result.questions[0].chapter, 'Basic Mathematics');
  assert.equal(result.rejected.length, 0);
});

test('rejects questions with missing text, too few options, or missing answer', () => {
  const result = validateQuestionSet([
    { options: ['A', 'B'], correctOption: 'A', chapter: 'X' },
    { questionText: 'Q2', options: ['A'], correctOption: 'A', chapter: 'X' },
    { questionText: 'Q3', options: ['A', 'B'], chapter: 'X' },
  ], { requireAnswer: true });
  assert.equal(result.questions.length, 0);
  assert.equal(result.rejected.length, 3);
});

test('rejects unsupported question types and off-syllabus chapters', () => {
  const result = validateQuestionSet([
    { questionText: 'Q1', options: ['A', 'B'], correctOption: 'A', chapter: 'Selected', type: 'integer' },
    { questionText: 'Q2', options: ['A', 'B'], correctOption: 'A', chapter: 'Outside' },
  ], { requireAnswer: true, allowedChapters: ['Selected'] });
  assert.equal(result.questions.length, 0);
  assert.match(result.rejected[0].reason, /Only MCQ/);
  assert.match(result.rejected[1].reason, /outside the selected syllabus/);
});

test('normalizes option objects and rejects invalid answer keys', () => {
  const question = normalizeQuestion({
    question: 'Choose one',
    options: [{ text: 'Alpha' }, { value: 'Beta' }],
    correctAnswer: 'E',
  });
  assert.deepEqual(question.options, ['Alpha', 'Beta']);
  assert.equal(question.correctOption, null);
});
