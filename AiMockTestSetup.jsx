import { useMemo, useState } from 'react';
import './MockTest.css';
import { getSubjectList, getGroupedChapterList } from '../services/curriculum';

const examPatterns = [
  { id: 'jee-main', label: 'JEE Main' },
  { id: 'jee-advanced', label: 'JEE Advanced' },
  { id: 'neet', label: 'NEET' },
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

const AiMockTestSetup = ({ onBack, onProceedToTest, mockConfig, setMockConfig }) => {
  const config = useMemo(() => ({
    examPattern: 'jee-main',
    studyClass: 'class-11',
    subject: 'Physics',
    selectedChapters: [],
    advancedPaper: 'paper-1',
    testDurationMinutes: 90,
    verificationMethod: 'ai-generated',
    totalQuestions: 30,
    difficulty: 'moderate',
    questionSource: 'ai-mock',
    ...mockConfig,
  }), [mockConfig]);

  const [selectedExam, setSelectedExam] = useState(config.examPattern || 'jee-main');
  const [selectedClass, setSelectedClass] = useState(config.studyClass || 'class-11');
  const [selectedSubject, setSelectedSubject] = useState(config.subject || getSubjectList(config.examPattern || 'jee-main')[0]);
  const [selectedChapters, setSelectedChapters] = useState(config.selectedChapters || []);
  const [errors, setErrors] = useState({});
  const [showCustomTimer, setShowCustomTimer] = useState(false);
  const [customTimerInput, setCustomTimerInput] = useState('');
  const [chapterSearch, setChapterSearch] = useState('');

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
    () => selectedChapters.filter((chapter) => allAvailableChapters.includes(chapter)),
    [allAvailableChapters, selectedChapters]
  );

  const currentSubject = subjectOptions.includes(selectedSubject) ? selectedSubject : subjectOptions[0];
  const safeSelectedChapters = validSelectedChapters;

  const updateConfig = (nextConfig) => {
    if (setMockConfig) {
      setMockConfig((prev = {}) => ({ ...prev, ...nextConfig }));
    }
  };

  const handleExamChange = (exam) => {
    const nextSubject = getSubjectList(exam)[0];
    const nextClass = 'class-11';

    setSelectedExam(exam);
    setSelectedClass(nextClass);
    setSelectedSubject(nextSubject);
    setSelectedChapters([]);
    setErrors((prev) => ({ ...prev, examPattern: '', advancedPaper: '' }));

    updateConfig({
      examPattern: exam,
      studyClass: nextClass,
      subject: nextSubject,
      selectedChapters: [],
      advancedPaper: exam === 'jee-advanced' ? config.advancedPaper || 'paper-1' : null,
    });
  };

  const handleClassChange = (studyClass) => {
    setSelectedClass(studyClass);
    setSelectedChapters([]);
    updateConfig({ studyClass, selectedChapters: [] });
  };

  const handleSubjectChange = (subject) => {
    setSelectedSubject(subject);
    setSelectedChapters([]);
    updateConfig({ subject, selectedChapters: [] });
  };

  const handleChapterToggle = (chapter) => {
    setSelectedChapters((prev) => {
      const next = prev.includes(chapter)
        ? prev.filter((item) => item !== chapter)
        : [...prev, chapter];

      updateConfig({ selectedChapters: next });
      return next;
    });
  };

  const handleSelectAll = () => {
    const next = [...new Set(allAvailableChapters)];
    setSelectedChapters(next);
    updateConfig({ selectedChapters: next });
  };

  const handleClearChapters = () => {
    setSelectedChapters([]);
    updateConfig({ selectedChapters: [] });
  };

  const validateAndProceed = () => {
    const nextErrors = {};

    if (!selectedExam) {
      nextErrors.examPattern = 'Please select an exam.';
    }

    if (!selectedSubject) {
      nextErrors.subject = 'Please select a subject.';
    }

    if (!safeSelectedChapters.length) {
      nextErrors.chapters = 'Please select at least one chapter to generate questions from.';
    }

    if (selectedExam === 'jee-advanced' && !config.advancedPaper) {
      nextErrors.advancedPaper = 'Please select a JEE Advanced paper setup.';
    }

    if (!config.testDurationMinutes) {
      nextErrors.timer = 'Please choose the mock test timer.';
    }

    setErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) {
      return;
    }

    onProceedToTest({
      ...config,
      examPattern: selectedExam,
      studyClass: selectedClass,
      subject: selectedSubject,
      selectedChapters: safeSelectedChapters,
      verificationMethod: 'ai-generated',
      questionSource: 'ai-mock',
      sourceLabel: 'AI Mock Test',
      questionStyle: selectedExam === 'jee-main' ? 'jee-main' : selectedExam === 'jee-advanced' ? 'jee-advanced' : 'neet',
    });
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

  return (
    <div className="mock-setup-shell fade-in-anim">
      <button className="back-home-tab-btn" onClick={onBack}>â† Back to Mock Tests</button>

      <div className="setup-header">
        <div className="setup-kicker">AI MOCK TEST</div>
        <h2>Generate a syllabus-based AI mock test</h2>
        <p>
          Select the exam, class, subject, and chapters. The AI generator will only build questions from the chosen chapters and use the selected exam style for difficulty and pattern.
        </p>
      </div>

      <div className="setup-board">
        <section className="setup-card">
          <div className="section-header-row">
            <span className="step-badge">1</span>
            <div>
              <h3>Exam</h3>
              <p>Choose the target exam pattern.</p>
            </div>
          </div>

          <div className="selection-grid">
            {examPatterns.map((pattern) => (
              <button
                key={pattern.id}
                type="button"
                className={`mode-select-btn ${selectedExam === pattern.id ? 'active' : ''}`}
                onClick={() => handleExamChange(pattern.id)}
              >
                <span>{pattern.label}</span>
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

          {errors.examPattern && <p className="error-text">{errors.examPattern}</p>}
        </section>

        <section className="setup-card">
          <div className="section-header-row">
            <span className="step-badge">2</span>
            <div>
              <h3>Class and Subject</h3>
              <p>Filter the syllabus by class and subject.</p>
            </div>
          </div>

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

          <div className="selection-grid small-grid" style={{ marginTop: '14px' }}>
            {subjectOptions.map((subject) => (
              <button
                key={subject}
                type="button"
                className={`mode-select-btn ${currentSubject === subject ? 'active' : ''}`}
                onClick={() => handleSubjectChange(subject)}
              >
                <span>{subject}</span>
              </button>
            ))}
          </div>

          {errors.subject && <p className="error-text">{errors.subject}</p>}
        </section>

        <section className="setup-card">
          <div className="section-header-row">
            <span className="step-badge">3</span>
            <div>
              <h3>Chapter Selection</h3>
              <p>Select one chapter, multiple chapters, or all chapters from the chosen syllabus.</p>
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
                <span className="selection-count">Selected: {safeSelectedChapters.length}</span>
                {safeSelectedChapters.slice(0, 8).map((chapter) => (
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
                        <span>{chapters.filter((chapter) => safeSelectedChapters.includes(chapter)).length} selected</span>
                      </div>

                      <div className="chapter-list">
                        {chapters.map((chapter) => (
                          <button
                            key={chapter}
                            type="button"
                            className={`chapter-item ${safeSelectedChapters.includes(chapter) ? 'selected' : ''}`}
                            onClick={() => handleChapterToggle(chapter)}
                          >
                            <span>{chapter}</span>
                            <span>{safeSelectedChapters.includes(chapter) ? 'Selected' : 'Add'}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          ) : (
            <p className="muted-text">Pick an exam, class, and subject to view the chapter list.</p>
          )}

          {errors.chapters && <p className="error-text">{errors.chapters}</p>}
        </section>

        <section className="setup-card">
          <div className="section-header-row">
            <span className="step-badge">4</span>
            <div>
              <h3>Question Settings</h3>
              <p>Set the question count, difficulty, and timer.</p>
            </div>
          </div>

          <div className="selection-grid small-grid">
            {[30, 45, 60, 90].map((count) => (
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

          <div className="selection-grid small-grid" style={{ marginTop: '14px' }}>
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

          <div className="selection-grid timer-grid" style={{ marginTop: '14px' }}>
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
                onChange={(e) => setCustomTimerInput(e.target.value)}
                placeholder="Enter minutes"
              />
              <button type="button" className="btn-primary inline-btn" onClick={handleCustomTimerSubmit}>Apply</button>
            </div>
          )}

          {errors.timer && <p className="error-text">{errors.timer}</p>}
        </section>
      </div>

      <div className="setup-note">
        <strong>Question generation note:</strong> AI-generated questions are created only from the selected chapter(s) and styled according to the selected exam pattern (JEE Main, JEE Advanced, or NEET). They are practice questions generated from the selected syllabus, not verified previous-year questions unless a real source is explicitly provided.
      </div>

      <div className="setup-actions">
        <button type="button" className="btn-primary action-btn-full" onClick={validateAndProceed}>
          Generate Mock Test
        </button>
      </div>
    </div>
  );
};

export default AiMockTestSetup;
