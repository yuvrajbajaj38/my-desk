import './MockTest.css';

const MockTestSelector = ({ onBack, onSelectMode }) => {
  return (
    <div className="sub-dashboard fade-in-anim">
      <button className="back-home-tab-btn" onClick={onBack}>← Back to Dashboard</button>

      <div className="mock-test-header">
        <h2>📝 Mock Test Engine</h2>
        <p>Choose the mock test path you want to launch. All flows are designed to use the same CBT engine.</p>
      </div>

      <div className="mock-modes-grid">
        <div
          className="mock-mode-card coaching-mode"
          onClick={() => onSelectMode('coaching')}
        >
          <div className="mode-icon">📚</div>
          <div className="mode-content">
            <h3>COACHING TEST → CBT</h3>
            <p className="mode-subtitle">Existing uploaded coaching test</p>
            <p className="mode-description">
              Upload an existing coaching or institute test PDF and convert it into a live CBT experience with timer,
              answer-key validation, and the same reusable exam engine.
            </p>
            <ul className="mode-features">
              <li>✓ JEE Main / Advanced / NEET / Custom</li>
              <li>✓ Paper 1 / Paper 2 / Both Papers</li>
              <li>✓ Timer and answer-key configuration</li>
              <li>✓ AI checking option and status</li>
              <li>✓ Reusable CBT engine flow</li>
            </ul>
          </div>
          <button className="btn-primary mode-btn">Start Coaching Test →</button>
        </div>

        <div
          className="mock-mode-card ai-mode"
          onClick={() => onSelectMode('ai-mock')}
        >
          <div className="mode-icon">🧠</div>
          <div className="mode-content">
            <h3>AI MOCK TEST</h3>
            <p className="mode-subtitle">Standalone AI-generated exam</p>
            <p className="mode-description">
              Set up a genuine AI-generated mock exam experience with selected exam patterns, chapter filters,
              question count, difficulty setting, and timer. This remains separate from the notes-upload workflow.
            </p>
            <ul className="mode-features">
              <li>✓ JEE Main / Advanced / NEET</li>
              <li>✓ Class 11 / Class 12 / Class 11 + 12</li>
              <li>✓ Subject and dynamic chapter selection</li>
              <li>✓ Moderate / Hard / Adaptive difficulty</li>
              <li>✓ Ready for the reusable CBT engine</li>
            </ul>
          </div>
          <button className="btn-primary mode-btn">Build AI Mock Test →</button>
        </div>
      </div>

      <div className="mock-test-info">
        <div className="info-card">
          <h4>💡 How it works</h4>
          <p>Select a mode above, configure the test setup, and continue into the same reusable CBT engine for the final attempt.</p>
        </div>
        <div className="info-card">
          <h4>⚡ Result architecture</h4>
          <p>All final attempts are designed to feed the same result flow for scoring, accuracy, time spent, and analysis reporting.</p>
        </div>
      </div>
    </div>
  );
};

export default MockTestSelector;
