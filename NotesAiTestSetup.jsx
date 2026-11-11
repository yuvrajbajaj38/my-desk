import { useMemo, useState } from 'react';
import './MockTest.css';
import { getSubjectList, getGroupedChapterList } from '../services/curriculum';

const examPatterns = [
  { id: 'jee-main', label: 'JEE Main', subtitle: 'Main exam pattern' },
  { id: 'jee-advanced', label: 'JEE Advanced', subtitle: 'Paper-based mode' },
  { id: 'neet', label: 'NEET', subtitle: 'Full syllabus flow' },
];

const classOptions = [
  { id: 'class-11', label: 'Class 11' },
  { id: 'class-12', label: 'Class 12' },
  { id: 'class-11+12', label: 'Class 11 + 12' },
];

const advancedOptions = [
  { id: 'paper-1', label: 'Paper 1' },
  { id: 'paper-2', label: 'Paper 2' },
  { id: 'both-papers', label: 'Both Papers' },
];

const timerOptions = [60, 90, 120];
const NotesAiTestSetup = ({ onBack, onProceedToTest, notesConfig, setNotesConfig }) => {
  const config = useMemo(() => ({
    examPattern: 'jee-main',
    studyClass: 'class-11',
    subject: 'Physics',
    selectedChapters: [],
    totalQuestions: 30,
    difficulty: 'moderate',
    advancedPaper: 'paper-1',
    testDurationMinutes: 90,
    verificationMethod: 'notes-ai',
    questionSource: 'notes-ai',
    noteFiles: [],
    extractMode: 'practice-questions',
    sourceType: 'notes-ai',
    ...notesConfig,
  }), [notesConfig]);

  const [errors, setErrors] = useState({});
  const [showCustomTimer, setShowCustomTimer] = useState(false);
  const [customTimerInput, setCustomTimerInput] = useState('');
  const [chapterSearch, setChapterSearch] = useState('');
  const [questionType, setQuestionType] = useState('mcq');

  const selectedExam = config.examPattern || 'jee-main';
  const selectedClass = config.studyClass || 'class-11';
  const selectedSubject = config.subject || getSubjectList(selectedExam)[0];

  const subjectOptions = useMemo(() => getSubjectList(selectedExam), [selectedExam]);
  const chapterGroups = useMemo(
    () => getGroupedChapterList(selectedExam, selectedClass, selectedSubject),
    [selectedExam, selectedClass, selectedSubject]
  );
  const allAvailableChapters = useMemo(
    () => Object.values(chapterGroups).flat().filter(Boolean),
    [chapterGroups]
  );
  const filteredChapterGroups = useMemo(
    () => Object.fromEntries(
      Object.entries(chapterGroups).map(([label, chapters]) => [
        label,
        chapters.filter((chapter) => chapter.toLowerCase().includes(chapterSearch.toLowerCase())),
      ])
    ),
    [chapterGroups, chapterSearch]
  );
  const validSelectedChapters = useMemo(
    () => (config.selectedChapters || []).filter((chapter) => allAvailableChapters.includes(chapter)),
    [allAvailableChapters, config.selectedChapters]
  );

  const updateConfig = (nextConfig) => {
    if (setNotesConfig) {
      setNotesConfig((prev = {}) => ({ ...prev, ...nextConfig }));
    }
  };

  const handlePdfUpload = (file, index) => {
    const allowedFile = file && file.type === 'application/pdf';

    if (!file || !allowedFile) {
      setErrors((prev) => ({ ...prev, noteFiles: 'Only PDF documents are supported.' }));
      return;
    }

    const nextFiles = [...(config.noteFiles || [])];
    nextFiles[index] = file;

    setErrors((prev) => ({ ...prev, noteFiles: '' }));
    updateConfig({ noteFiles: nextFiles.slice(0, 2) });
  };

  const handlePatternChange = (pattern) => {
    const nextSubject = getSubjectList(pattern)[0];
    const nextClass = 'class-11';

    updateConfig({
      examPattern: pattern,
      studyClass: nextClass,
      subject: nextSubject,
      selectedChapters: [],
      advancedPaper: pattern === 'jee-advanced' ? config.advancedPaper || 'paper-1' : null,
    });
    setErrors((prev) => ({ ...prev, examPattern: '', advancedPaper: '' }));
  };

  const handleClassChange = (studyClass) => {
    updateConfig({ studyClass, selectedChapters: [] });
  };

  const handleSubjectChange = (subject) => {
    updateConfig({ subject, selectedChapters: [] });
  };

  const handleChapterToggle = (chapter) => {
    const currentChapters = config.selectedChapters || [];
    const nextChapters = currentChapters.includes(chapter)
      ? currentChapters.filter((item) => item !== chapter)
      : [...currentChapters, chapter];

    updateConfig({ selectedChapters: nextChapters });
  };

  const handleSelectAll = () => {
    updateConfig({ selectedChapters: [...new Set(allAvailableChapters)] });
  };

  const handleClearChapters = () => {
    updateConfig({ selectedChapters: [] });
  };

  const handleTimerSelection = (minutes) => {
    setShowCustomTimer(false);
    setCustomTimerInput('');
    setErrors((prev) => ({ ...prev, timer: '' }));
    updateConfig({ testDurationMinutes: minutes });
  };

  const handleCustomTimerSubmit = () => {
    const parsed = Number(customTimerInput);

    if (!customTimerInput.trim()) {
      setErrors((prev) => ({ ...prev, timer: 'Please enter a valid duration.' }));
      return;
    }

    if (!Number.isFinite(parsed) || parsed < 1 || parsed > 480) {
      setErrors((prev) => ({ ...prev, timer: 'Duration must be between 1 and 480 minutes.' }));
      return;
    }

    setErrors((prev) => ({ ...prev, timer: '' }));
    setShowCustomTimer(false);
    setCustomTimerInput('');
    updateConfig({ testDurationMinutes: parsed });
  };

  const validateAndProceed = () => {
    const nextErrors = {};

    if (!config.noteFiles || config.noteFiles.length === 0) {
      nextErrors.noteFiles = 'Upload at least one PDF note source.';
    }

    if (config.extractMode === 'generate-mock') {
      if (!config.examPattern) {
        nextErrors.examPattern = 'Please select an exam pattern.';
      }

      if (config.examPattern === 'jee-advanced' && !config.advancedPaper) {
        nextErrors.advancedPaper = 'Please select a JEE Advanced paper setup.';
      }

      if (!config.selectedChapters || config.selectedChapters.length === 0) {
        nextErrors.chapters = 'Please select at least one chapter.';
      }

      if (!config.testDurationMinutes) {
        nextErrors.timer = 'Please choose the timer.';
      }
    }

    setErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) {
      return;
    }

    onProceedToTest({
      ...config,
      examPattern: config.examPattern,
      studyClass: config.studyClass,
      subject: config.subject,
      selectedChapters: config.selectedChapters || [],
      noteFiles: (config.noteFiles || []).slice(0, 2),
      questionType,
      verificationMethod: 'notes-ai',
      sourceLabel: config.extractMode === 'generate-mock' ? 'PDF Notes â†’ AI Test' : 'PDF Notes â†’ Extract Questions',
    });
  };

  return (
    <div className="mock-setup-shell fade-in-anim">
      <button className="back-home-tab-btn" onClick={onBack}>â† Back to Dashboard</button>

      <div className="setup-header">
        <div className="setup-kicker">PDF NOTES â†’ AI TEST</div>
        <h2>Upload your notes and prepare a notes-grounded AI test</h2>
        <p>
          Upload up to two PDFs. Choose to extract questions already present in the notes or generate a fresh AI mock test grounded in the selected notes and chapter topics.
        </p>
      </div>

      <div className="setup-board">
        <section className="setup-card">
          <div className="section-header-row">
            <span className="step-badge">1</span>
            <div>
              <h3>Upload Note PDFs</h3>
              <p>Use up to two PDFs as your source material.</p>
            </div>
          </div>

          {[0, 1].map((index) => (
            <div key={index} className="file-upload-box compact-upload">
              <input
                type="file"
                id={`notes-pdf-${index}`}
                accept=".pdf"
                className="file-input"
                onChange={(event) => handlePdfUpload(event.target.files?.[0], index)}
              />
              <label htmlFor={`notes-pdf-${index}`} className="file-upload-label compact-label">
                <div className="upload-icon">ðŸ“„</div>
                <p className="upload-title">{config.noteFiles?.[index] ? config.noteFiles[index].name : `Upload PDF ${index + 1}`}</p>
                <p className="upload-subtitle">Up to 2 total PDFs</p>
              </label>
            </div>
          ))}

          {errors.noteFiles && <p className="error-text">{errors.noteFiles}</p>}
        </section>

        <section className="setup-card">
          <div className="section-header-row">
            <span className="step-badge">2</span>
            <div>
              <h3>Question Mode</h3>
              <p>Choose how the uploaded notes should be used.</p>
            </div>
          </div>

          <div className="selection-grid small-grid">
            {[
              { id: 'practice-questions', label: 'Only Extract Practice Questions' },
              { id: 'generate-mock', label: 'Generate AI Mock Test from Notes' },
            ].map((mode) => (
              <button
                key={mode.id}
                type="button"
                className={`mode-select-btn ${config.extractMode === mode.id ? 'active' : ''}`}
                onClick={() => updateConfig({ extractMode: mode.id })}
              >
                <span>{mode.label}</span>
              </button>
            ))}
          </div>
        </section>

        {config.extractMode === 'generate-mock' && (
          <>
            <section className="setup-card">
              <div className="section-header-row">
                <span className="step-badge">3</span>
                <div>
                  <h3>Exam</h3>
                  <p>Select the exam, class, and subject for the notes-grounded AI test.</p>
                </div>
              </div>

              <div className="selection-grid">
                {examPatterns.map((pattern) => (
                  <button
                    key={pattern.id}
                    type="button"
                    className={`mode-select-btn ${selectedExam === pattern.id ? 'active' : ''}`}
                    onClick={() => handlePatternChange(pattern.id)}
                  >
                    <span>{pattern.label}</span>
                    <small>{pattern.subtitle}</small>
                  </button>
                ))}
              </div>

              {selectedExam === 'jee-advanced' && (
                <div className="sub-option-panel">
                  <h4>JEE Advanced Paper Selection</h4>
                  <div className="selection-grid small-grid">
                    {advancedOptions.map((paper) => (
                      <button
                        key={paper.id}
                        type="button"
                        className={`mode-select-btn ${config.advancedPaper === paper.id ? 'active' : ''}`}
                        onClick={() => {
                          setErrors((prev) => ({ ...prev, advancedPaper: '' }));
                          updateConfig({ advancedPaper: paper.id });
                        }}
                      >
                        <span>{paper.label}</span>
                      </button>
                    ))}
                  </div>
                  {errors.advancedPaper && <p className="error-text">{errors.advancedPaper}</p>}
                </div>
              )}

              <div className="sub-option-panel">
                <h4>Class</h4>
                <div className="selection-grid small-grid">
                  {classOptions.map((entry) => (
                    <button
                      key={entry.id}
                      type="button"
                      className={`mode-select-btn ${selectedClass === entry.id ? 'active' : ''}`}
                      onClick={() => handleClassChange(entry.id)}
                    >
                      <span>{entry.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="sub-option-panel">
                <h4>Subject</h4>
                <div className="selection-grid small-grid">
                  {subjectOptions.map((subject) => (
                    <button
                      key={subject}
                      type="button"
                      className={`mode-select-btn ${selectedSubject === subject ? 'active' : ''}`}
                      onClick={() => handleSubjectChange(subject)}
                    >
                      <span>{subject}</span>
                    </button>
                  ))}
                </div>
              </div>

              {errors.examPattern && <p className="error-text">{errors.examPattern}</p>}
            </section>

            <section className="setup-card">
              <div className="section-header-row">
                <span className="step-badge">4</span>
                <div>
                  <h3>Chapter Selection</h3>
                  <p>Choose the exact chapters from the selected syllabus. The generated questions will be constrained to these chapters.</p>
                </div>
              </div>

              {allAvailableChapters.length > 0 ? (
                <>
                  <div className="chapter-search-box">
                    <input
                      type="text"
                      value={chapterSearch}
                      onChange={(event) => setChapterSearch(event.target.value)}
                      placeholder="Search chapters"
                    />
                  </div>

                  <div className="chapter-actions">
                    <button type="button" className="btn-secondary small-btn" onClick={handleSelectAll}>Select All</button>
                    <button type="button" className="btn-secondary small-btn" onClick={handleClearChapters}>Clear All</button>
                  </div>

                  <div className="selected-chapter-summary">
                    <span className="selection-count">Selected: {validSelectedChapters.length}</span>
                    {validSelectedChapters.slice(0, 8).map((chapter) => (
                      <span key={chapter} className="selected-chapter-chip">{chapter}</span>
                    ))}
                  </div>

                  <div className="chapter-group-list">
                    {Object.entries(filteredChapterGroups).map(([groupLabel, chapters]) => {
                      if (!chapters.length) return null;

                      return (
                        <div key={groupLabel} className="chapter-group">
                          <div className="chapter-group-header">
                            <h4>{groupLabel}</h4>
                            <span>{chapters.filter((chapter) => validSelectedChapters.includes(chapter)).length} selected</span>
                          </div>

                          <div className="chapter-list">
                            {chapters.map((chapter) => (
                              <button
                                key={chapter}
                                type="button"
                                className={`chapter-item ${validSelectedChapters.includes(chapter) ? 'selected' : ''}`}
                                onClick={() => handleChapterToggle(chapter)}
                              >
                                <span>{chapter}</span>
                                <span>{validSelectedChapters.includes(chapter) ? 'Selected' : 'Add'}</span>
                              </button>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </>
              ) : (
                <p className="muted-text">Pick an exam, class, and subject to view the syllabus.</p>
              )}

              {errors.chapters && <p className="error-text">{errors.chapters}</p>}
            </section>

            <section className="setup-card">
              <div className="section-header-row">
                <span className="step-badge">5</span>
                <div>
                  <h3>AI Mock Configuration</h3>
                  <p>Set the question type, count, difficulty, and timer.</p>
                </div>
              </div>

              <div className="sub-option-panel">
                <h4>Question Type</h4>
                <div className="selection-grid small-grid">
                  <button
                    type="button"
                    className={`mode-select-btn ${questionType === 'mcq' ? 'active' : ''}`}
                    onClick={() => setQuestionType('mcq')}
                  >
                    <span>Multiple Choice Questions</span>
                  </button>
                </div>
              </div>

              <div className="sub-option-panel">
                <h4>Question Count</h4>
                <div className="selection-grid small-grid">
                  {[15, 30, 45, 60].map((count) => (
                    <button
                      key={count}
                      type="button"
                      className={`mode-select-btn ${config.totalQuestions === count ? 'active' : ''}`}
                      onClick={() => updateConfig({ totalQuestions: count })}
                    >
                      <span>{count} Questions</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="sub-option-panel">
                <h4>Difficulty</h4>
                <div className="selection-grid small-grid">
                  {['Moderate', 'Hard', 'Adaptive'].map((level) => (
                    <button
                      key={level}
                      type="button"
                      className={`mode-select-btn ${config.difficulty === level.toLowerCase() ? 'active' : ''}`}
                      onClick={() => updateConfig({ difficulty: level.toLowerCase() })}
                    >
                      <span>{level}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="sub-option-panel">
                <h4>Timer</h4>
                <div className="selection-grid timer-grid">
                  {timerOptions.map((minutes) => (
                    <button
                      key={minutes}
                      type="button"
                      className={`mode-select-btn ${config.testDurationMinutes === minutes ? 'active' : ''}`}
                      onClick={() => handleTimerSelection(minutes)}
                    >
                      <span>{minutes} min</span>
                    </button>
                  ))}
                  <button
                    type="button"
                    className={`mode-select-btn ${showCustomTimer || config.testDurationMinutes === 'custom' ? 'active' : ''}`}
                    onClick={() => setShowCustomTimer(true)}
                  >
                    <span>Custom</span>
                  </button>
                </div>

                {showCustomTimer && (
                  <div className="custom-input-box">
                    <input
                      type="number"
                      min="1"
                      max="480"
                      value={customTimerInput}
                      onChange={(event) => setCustomTimerInput(event.target.value)}
                      placeholder="Enter minutes"
                    />
                    <button type="button" className="btn-primary inline-btn" onClick={handleCustomTimerSubmit}>Apply</button>
                  </div>
                )}

                {errors.timer && <p className="error-text">{errors.timer}</p>}
              </div>
            </section>
          </>
        )}
      </div>

      <div className="setup-note">
        <strong>Notes-grounded generation:</strong> The selected chapter(s), uploaded notes, and exam/class/subject configuration are preserved for the future AI generation backend. The generated questions remain tied to the uploaded notes and the selected syllabus context, not to unrelated chapters.
      </div>

      <div className="setup-actions">
        <button type="button" className="btn-primary action-btn-full" onClick={validateAndProceed}>
          {config.extractMode === 'generate-mock' ? 'Continue to CBT Engine' : 'Extract Practice Questions'}
        </button>
      </div>
    </div>
  );
};

export default NotesAiTestSetup;
