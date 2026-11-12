const crypto = require("crypto");

function artifactDocId(artifactType, sourceHash, configHash) {
  const raw = `${artifactType}|${sourceHash}|${configHash || sourceHash}`;
  return crypto.createHash("sha256").update(raw).digest("hex").slice(0, 40);
}

const JOB_ARTIFACT_TYPE = {
  "generate-ai-mock": "ai-mock",
  "generate-notes-mock": "notes-ai-mock",
  "parse-coaching-pdf": "coaching-parse",
  "parse-question-bank": "question-bank-book",
  "extract-notes-questions": "notes-extract",
};

module.exports = { artifactDocId, JOB_ARTIFACT_TYPE };
