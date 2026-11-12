const ExtractedQuestions = ({ questions = [], onBack, onStartTest }) => {
  if (!questions.length) {
    return (
      <div className="sub-dashboard fade-in-anim">
        <button className="back-home-tab-btn" onClick={onBack}>← Back</button>
        <h2>No questions extracted</h2>
        <p>Upload a notes PDF that already contains practice questions, then try again.</p>
      </div>
    );
  }

  return (
    <div className="sub-dashboard fade-in-anim" style={{ maxWidth: "900px", margin: "0 auto" }}>
      <button className="back-home-tab-btn" onClick={onBack}>← Back to Notes AI</button>
      <h2>Extracted Practice Questions</h2>
      <p>{questions.length} question(s) found in your notes. This is extraction only — not a generated mock test.</p>

      <div style={{ display: "flex", flexDirection: "column", gap: "16px", marginTop: "24px" }}>
        {questions.map((question, index) => (
          <article key={question.id || index} className="premium-card" style={{ padding: "20px" }}>
            <h4>Q{question.questionNumber || index + 1}. {question.questionText}</h4>
            <ul>
              {(question.options || []).map((option, optionIndex) => (
                <li key={`${question.id}-${optionIndex}`}>{String.fromCharCode(65 + optionIndex)}. {option}</li>
              ))}
            </ul>
          </article>
        ))}
      </div>

      {onStartTest && (
        <div style={{ marginTop: "24px" }}>
          <button type="button" className="btn-primary" onClick={onStartTest}>Practice these in CBT</button>
        </div>
      )}
    </div>
  );
};

export default ExtractedQuestions;
