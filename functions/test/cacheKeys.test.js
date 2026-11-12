const test = require('node:test');
const assert = require('node:assert/strict');
const { artifactDocId, JOB_ARTIFACT_TYPE } = require('../cacheKeys');

test('artifact document IDs are deterministic for identical inputs', () => {
  assert.equal(artifactDocId('ai-mock', 'source', 'config'), artifactDocId('ai-mock', 'source', 'config'));
});

test('artifact document IDs separate artifact types and configurations', () => {
  const base = artifactDocId('ai-mock', 'source', 'config-a');
  assert.notEqual(base, artifactDocId('notes-ai-mock', 'source', 'config-a'));
  assert.notEqual(base, artifactDocId('ai-mock', 'source', 'config-b'));
  assert.match(base, /^[a-f0-9]{40}$/);
});

test('AI generation jobs map to expected artifact types', () => {
  assert.equal(JOB_ARTIFACT_TYPE['generate-ai-mock'], 'ai-mock');
  assert.equal(JOB_ARTIFACT_TYPE['generate-notes-mock'], 'notes-ai-mock');
  assert.equal(JOB_ARTIFACT_TYPE['parse-question-bank'], 'question-bank-book');
});
