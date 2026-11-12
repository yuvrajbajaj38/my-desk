import { useState } from 'react';
import '../styles/CoachingTestUpload.css';

const CoachingTestUpload = ({ onBack, onProceedToTest, coachingConfig, setCoachingConfig }) => {
  const [uploadProgress, setUploadProgress] = useState({
    testFile: false,
    answerKeyFile: false
  });

  const [errors, setErrors] = useState({
    testFile: '',
    examPattern: '',
    advancedPaper: '',
    answerKeyFile: '',
    timer: '',
    verification: ''
  });

  const [showCustomTimer, setShowCustomTimer] = useState(false);
  const [customTimerInput, setCustomTimerInput] = useState('');

  // File validation
  const validateFile = (file) => {
    if (!file) {
      return 'No file selected';
    }

    const maxSizeMB = 50;
    const maxSizeBytes = maxSizeMB * 1024 * 1024;

    if (file.size > maxSizeBytes) {
      return `File size exceeds ${maxSizeMB}MB limit. Current: ${(file.size / 1024 / 1024).toFixed(2)}MB`;
    }

    if (file.type !== 'application/pdf') {
      return 'Only PDF files are allowed. Received: ' + (file.type || 'unknown type');
    }

    return '';
  };

  // Handle test PDF upload
  const handleTestFileChange = (e) => {
    const file = e.target.files[0];
    const error = validateFile(file, 'test');

    if (error) {
      setErrors(prev => ({ ...prev, testFile: error }));
      setCoachingConfig(prev => ({ ...prev, testFile: null }));
      setUploadProgress(prev => ({ ...prev, testFile: false }));
    } else {
      setErrors(prev => ({ ...prev, testFile: '' }));
      setCoachingConfig(prev => ({ ...prev, testFile: file }));
      setUploadProgress(prev => ({ ...prev, testFile: true }));
    }
  };

  // Handle answer key upload
  const handleAnswerKeyChange = (e) => {
    const file = e.target.files[0];
    const error = validateFile(file, 'answerKey');

    if (error) {
      setErrors(prev => ({ ...prev, answerKeyFile: error }));
      setCoachingConfig(prev => ({ ...prev, answerKeyFile: null }));
      setUploadProgress(prev => ({ ...prev, answerKeyFile: false }));
    } else {
      setErrors(prev => ({ ...prev, answerKeyFile: '' }));
      setCoachingConfig(prev => ({ ...prev, answerKeyFile: file }));
      setUploadProgress(prev => ({ ...prev, answerKeyFile: true }));
    }
  };

  // Handle timer selection
  const handleTimerSelection = (minutes) => {
    setShowCustomTimer(false);
    setCustomTimerInput('');
    setErrors(prev => ({ ...prev, timer: '' }));
    setCoachingConfig(prev => ({ ...prev, testDurationMinutes: minutes }));
  };

  // Handle custom timer
  const handleCustomTimerSubmit = () => {
    const minutes = parseInt(customTimerInput, 10);

    if (!customTimerInput.trim()) {
      setErrors(prev => ({ ...prev, timer: 'Please enter a time duration' }));
      return;
    }

    if (isNaN(minutes) || minutes < 1 || minutes > 480) {
      setErrors(prev => ({ ...prev, timer: 'Duration must be between 1 and 480 minutes' }));
      return;
    }

    setErrors(prev => ({ ...prev, timer: '' }));
    setCoachingConfig(prev => ({ ...prev, testDurationMinutes: minutes }));
    setShowCustomTimer(false);
    setCustomTimerInput('');
  };

  // Handle exam pattern selection
  const handleExamPatternChange = (pattern) => {
    setErrors(prev => ({ ...prev, examPattern: '', advancedPaper: '' }));
    setCoachingConfig(prev => ({
      ...prev,
      examPattern: pattern,
      advancedPaper: pattern === 'jee-advanced' ? prev.advancedPaper || 'paper-1' : null
    }));
  };

  // Handle JEE Advanced paper selection
  const handleAdvancedPaperChange = (paper) => {
    setErrors(prev => ({ ...prev, advancedPaper: '' }));
    setCoachingConfig(prev => ({ ...prev, advancedPaper: paper }));
  };

  // Handle verification method change
  const handleVerificationChange = (method) => {
    setErrors(prev => ({ ...prev, verification: '' }));
    setCoachingConfig(prev => ({ ...prev, verificationMethod: method }));
  };

  // Validate all requirements before proceeding
  const validateAllConfigurations = () => {
    const newErrors = {};

    if (!coachingConfig.testFile) {
      newErrors.testFile = 'Test PDF is required';
    }

    if (!coachingConfig.examPattern) {
      newErrors.examPattern = 'Exam pattern is required';
    }

    if (coachingConfig.examPattern === 'jee-advanced' && !coachingConfig.advancedPaper) {
      newErrors.advancedPaper = 'Select the JEE Advanced paper configuration';
    }

    if (!coachingConfig.testDurationMinutes) {
      newErrors.timer = 'Test duration is required';
    }

    if (!coachingConfig.verificationMethod) {
      newErrors.verification = 'Answer verification method is required';
    }

    if (coachingConfig.verificationMethod === 'uploadKey' && !coachingConfig.answerKeyFile) {
      newErrors.answerKeyFile = 'Answer key PDF is required for upload verification';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Proceed to CBT engine
  const handleProceed = () => {
    if (validateAllConfigurations()) {
      onProceedToTest('coaching', coachingConfig);
    }
  };

  return (
    <div className="coaching-test-container fade-in-anim">
      <div className="coaching-test-header">
        <button className="back-btn" onClick={onBack}>
          ← Back
        </button>
        <h1>Upload Your Coaching Test</h1>
        <p className="subtitle">Configure your test settings before starting the exam</p>
      </div>

      <div className="coaching-test-content">
        {/* Step 1: Upload Test PDF */}
        <section className="coaching-section">
          <div className="section-header">
            <div className="step-badge">1</div>
            <div>
              <h2>Upload Test PDF</h2>
              <p>Select the test/exam PDF from your coaching institute</p>
            </div>
          </div>

          <div className="file-upload-box">
            <input
              type="file"
              id="test-file-input"
              accept=".pdf"
              onChange={handleTestFileChange}
              className="file-input"
            />
            <label htmlFor="test-file-input" className="file-upload-label">
              <div className="upload-icon">📄</div>
              <p className="upload-title">Click to select PDF or drag and drop</p>
              <p className="upload-subtitle">Maximum file size: 50 MB</p>
            </label>

            {uploadProgress.testFile && coachingConfig.testFile && (
              <div className="file-status success">
                <span className="status-icon">✓</span>
                <div className="file-info">
                  <p className="file-name">{coachingConfig.testFile.name}</p>
                  <p className="file-size">{(coachingConfig.testFile.size / 1024 / 1024).toFixed(2)} MB</p>
                </div>
              </div>
            )}

            {errors.testFile && (
              <div className="file-status error">
                <span className="status-icon">✕</span>
                <p className="error-message">{errors.testFile}</p>
              </div>
            )}
          </div>
        </section>

        {/* Step 2: Select Exam Pattern */}
        <section className="coaching-section">
          <div className="section-header">
            <div className="step-badge">2</div>
            <div>
              <h2>Exam Pattern</h2>
              <p>Select the exam format this coaching test follows</p>
            </div>
          </div>

          <div className="exam-pattern-grid">
            {[
              { id: 'jee-main', label: 'JEE Main', subtitle: 'Flexible pattern support' },
              { id: 'jee-advanced', label: 'JEE Advanced', subtitle: 'Paper-specific setup' },
              { id: 'neet', label: 'NEET', subtitle: 'Flexible pattern support' },
              { id: 'custom', label: 'Custom', subtitle: 'Define your own structure' }
            ].map((pattern) => (
              <button
                key={pattern.id}
                type="button"
                className={`pattern-btn ${coachingConfig.examPattern === pattern.id ? 'active' : ''}`}
                onClick={() => handleExamPatternChange(pattern.id)}
              >
                <span className="pattern-label">{pattern.label}</span>
                <span className="pattern-subtitle">{pattern.subtitle}</span>
              </button>
            ))}
          </div>

          {coachingConfig.examPattern === 'jee-advanced' && (
            <div className="advanced-paper-options">
              <h3>JEE Advanced Paper Selection</h3>
              <div className="paper-option-grid">
                {[
                  { id: 'paper-1', label: 'Paper 1' },
                  { id: 'paper-2', label: 'Paper 2' },
                  { id: 'both-papers', label: 'Both Papers' }
                ].map((paper) => (
                  <button
                    key={paper.id}
                    type="button"
                    className={`paper-btn ${coachingConfig.advancedPaper === paper.id ? 'active' : ''}`}
                    onClick={() => handleAdvancedPaperChange(paper.id)}
                  >
                    {paper.label}
                  </button>
                ))}
              </div>

              {coachingConfig.advancedPaper === 'both-papers' && (
                <div className="info-box">
                  <span className="info-badge">ℹ️</span>
                  <p>Both Papers mode is enabled. The CBT setup can include a break between Paper 1 and Paper 2 while timing remains configurable.</p>
                </div>
              )}
            </div>
          )}

          {errors.examPattern && (
            <div className="error-box">
              <span className="error-icon">⚠️</span>
              <p>{errors.examPattern}</p>
            </div>
          )}

          {errors.advancedPaper && (
            <div className="error-box">
              <span className="error-icon">⚠️</span>
              <p>{errors.advancedPaper}</p>
            </div>
          )}
        </section>

        {/* Step 3: Select Timer Duration */}
        <section className="coaching-section">
          <div className="section-header">
            <div className="step-badge">3</div>
            <div>
              <h2>Set Test Duration</h2>
              <p>Choose how much time you have to complete the test</p>
            </div>
          </div>

          <div className="timer-options-grid">
            <button
              className={`timer-btn ${coachingConfig.testDurationMinutes === 60 ? 'active' : ''}`}
              onClick={() => handleTimerSelection(60)}
            >
              <span className="timer-value">60</span>
              <span className="timer-label">Minutes</span>
            </button>

            <button
              className={`timer-btn ${coachingConfig.testDurationMinutes === 90 ? 'active' : ''}`}
              onClick={() => handleTimerSelection(90)}
            >
              <span className="timer-value">90</span>
              <span className="timer-label">Minutes</span>
            </button>

            <button
              className={`timer-btn custom-timer-trigger ${showCustomTimer ? 'active' : ''}`}
              onClick={() => setShowCustomTimer(!showCustomTimer)}
            >
              <span className="timer-value">⚙️</span>
              <span className="timer-label">Custom</span>
            </button>
          </div>

          {showCustomTimer && (
            <div className="custom-timer-section">
              <div className="custom-timer-input-group">
                <input
                  type="number"
                  min="1"
                  max="480"
                  placeholder="Enter minutes (1-480)"
                  value={customTimerInput}
                  onChange={(e) => setCustomTimerInput(e.target.value)}
                  className="custom-timer-input"
                />
                <button className="custom-timer-submit" onClick={handleCustomTimerSubmit}>
                  Set Time
                </button>
              </div>
              <p className="custom-timer-hint">Duration: 1 minute to 8 hours</p>
            </div>
          )}

          {coachingConfig.testDurationMinutes && !showCustomTimer && (
            <div className="selected-timer-display">
              <span className="timer-icon">⏱️</span>
              <p>Test duration: <strong>{coachingConfig.testDurationMinutes} minutes</strong></p>
            </div>
          )}

          {errors.timer && (
            <div className="error-box">
              <span className="error-icon">⚠️</span>
              <p>{errors.timer}</p>
            </div>
          )}
        </section>

        {/* Step 4: Answer Verification Method */}
        <section className="coaching-section">
          <div className="section-header">
            <div className="step-badge">4</div>
            <div>
              <h2>Answer Verification Method</h2>
              <p>Choose how your test will be evaluated</p>
            </div>
          </div>

          <div className="verification-options">
            {/* Option A: Upload Answer Key */}
            <div className="verification-card">
              <input
                type="radio"
                id="upload-key"
                name="verification"
                value="uploadKey"
                checked={coachingConfig.verificationMethod === 'uploadKey'}
                onChange={() => handleVerificationChange('uploadKey')}
                className="verification-radio"
              />
              <label htmlFor="upload-key" className="verification-label">
                <div className="verification-header">
                  <span className="radio-custom"></span>
                  <h3>Upload Answer Key</h3>
                </div>
                <p className="verification-description">
                  Upload a PDF with the answer key. We'll automatically match your answers with the key for instant scoring.
                </p>
                <ul className="verification-benefits">
                  <li>✓ Instant scoring and accuracy calculation</li>
                  <li>✓ Detailed answer-by-answer comparison</li>
                  <li>✓ Mistake tracking and weak area analysis</li>
                </ul>
              </label>
            </div>

            {/* Option B: AI Check */}
            <div className="verification-card">
              <input
                type="radio"
                id="ai-check"
                name="verification"
                value="aiCheck"
                checked={coachingConfig.verificationMethod === 'aiCheck'}
                onChange={() => handleVerificationChange('aiCheck')}
                className="verification-radio"
              />
              <label htmlFor="ai-check" className="verification-label">
                <div className="verification-header">
                  <span className="radio-custom"></span>
                  <h3>AI Check (Coming Soon)</h3>
                </div>
                <p className="verification-description">
                  Our AI will evaluate your answers intelligently, supporting subjective questions and detailed explanations.
                </p>
                <ul className="verification-benefits">
                  <li>✓ Intelligent evaluation of written answers</li>
                  <li>✓ Support for subjective and objective questions</li>
                  <li>✓ Feedback and suggestions for improvement</li>
                </ul>
              </label>
            </div>
          </div>

          {errors.verification && (
            <div className="error-box">
              <span className="error-icon">⚠️</span>
              <p>{errors.verification}</p>
            </div>
          )}
        </section>

        {/* Answer Key Upload (Conditional) */}
        {coachingConfig.verificationMethod === 'uploadKey' && (
          <section className="coaching-section">
            <div className="section-header">
              <div className="step-badge">5</div>
              <div>
                <h2>Upload Answer Key PDF</h2>
                <p>Upload the corresponding answer key for this test</p>
              </div>
            </div>

            <div className="file-upload-box">
              <input
                type="file"
                id="answer-key-input"
                accept=".pdf"
                onChange={handleAnswerKeyChange}
                className="file-input"
              />
              <label htmlFor="answer-key-input" className="file-upload-label">
                <div className="upload-icon">🔑</div>
                <p className="upload-title">Click to select Answer Key PDF or drag and drop</p>
                <p className="upload-subtitle">Maximum file size: 50 MB</p>
              </label>

              {uploadProgress.answerKeyFile && coachingConfig.answerKeyFile && (
                <div className="file-status success">
                  <span className="status-icon">✓</span>
                  <div className="file-info">
                    <p className="file-name">{coachingConfig.answerKeyFile.name}</p>
                    <p className="file-size">{(coachingConfig.answerKeyFile.size / 1024 / 1024).toFixed(2)} MB</p>
                  </div>
                </div>
              )}

              {errors.answerKeyFile && (
                <div className="file-status error">
                  <span className="status-icon">✕</span>
                  <p className="error-message">{errors.answerKeyFile}</p>
                </div>
              )}
            </div>
          </section>
        )}

        {/* Configuration Review */}
        <section className="coaching-section review-section">
          <h2>Configuration Summary</h2>
          <div className="config-summary">
            <div className="config-item">
              <span className="config-label">Test File:</span>
              <span className="config-value">
                {coachingConfig.testFile ? (
                  <span className="value-success">
                    ✓ {coachingConfig.testFile.name}
                  </span>
                ) : (
                  <span className="value-pending">Pending</span>
                )}
              </span>
            </div>

            <div className="config-item">
              <span className="config-label">Exam Pattern:</span>
              <span className="config-value">
                {coachingConfig.examPattern ? (
                  <span className="value-success">
                    ✓ {coachingConfig.examPattern === 'jee-main' ? 'JEE Main' : coachingConfig.examPattern === 'jee-advanced' ? 'JEE Advanced' : coachingConfig.examPattern === 'neet' ? 'NEET' : 'Custom'}
                  </span>
                ) : (
                  <span className="value-pending">Pending</span>
                )}
              </span>
            </div>

            {coachingConfig.examPattern === 'jee-advanced' && (
              <div className="config-item">
                <span className="config-label">Advanced Paper:</span>
                <span className="config-value">
                  {coachingConfig.advancedPaper ? (
                    <span className="value-success">
                      ✓ {coachingConfig.advancedPaper === 'paper-1' ? 'Paper 1' : coachingConfig.advancedPaper === 'paper-2' ? 'Paper 2' : 'Both Papers'}
                    </span>
                  ) : (
                    <span className="value-pending">Pending</span>
                  )}
                </span>
              </div>
            )}

            <div className="config-item">
              <span className="config-label">Duration:</span>
              <span className="config-value">
                {coachingConfig.testDurationMinutes ? (
                  <span className="value-success">
                    ✓ {coachingConfig.testDurationMinutes} minutes
                  </span>
                ) : (
                  <span className="value-pending">Pending</span>
                )}
              </span>
            </div>

            <div className="config-item">
              <span className="config-label">Verification:</span>
              <span className="config-value">
                {coachingConfig.verificationMethod ? (
                  <span className="value-success">
                    ✓ {coachingConfig.verificationMethod === 'uploadKey' ? 'Upload Answer Key' : 'AI Check'}
                  </span>
                ) : (
                  <span className="value-pending">Pending</span>
                )}
              </span>
            </div>

            {coachingConfig.answerKeyFile && (
              <div className="config-item">
                <span className="config-label">Answer Key:</span>
                <span className="config-value">
                  <span className="value-success">✓ {coachingConfig.answerKeyFile.name}</span>
                </span>
              </div>
            )}
          </div>
        </section>
      </div>

      {/* Action Buttons */}
      <div className="coaching-action-bar">
        <button className="btn btn-secondary" onClick={onBack}>
          ← Back
        </button>
        <button 
          className="btn btn-primary" 
          onClick={handleProceed}
          disabled={!coachingConfig.testFile || !coachingConfig.examPattern || (coachingConfig.examPattern === 'jee-advanced' && !coachingConfig.advancedPaper) || !coachingConfig.testDurationMinutes || !coachingConfig.verificationMethod}
        >
          Proceed to Test →
        </button>
      </div>
    </div>
  );
};

export default CoachingTestUpload;
