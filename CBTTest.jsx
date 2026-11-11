import { useEffect, useMemo, useState, useCallback } from 'react';
import '../styles/CBTTest.css';
import { startTest, submitTest } from '../services/testservice';

const statusLabels = {
  notVisited: 'Not Visited',
  answered: 'Answered',
  unattempted: 'Not Answered',
  marked: 'Marked for Review',
  answeredMarked: 'Answered + Marked for Review',
};

const formatTime = (seconds) => {
  const safe = Math.max(0, seconds);
  const hours = String(Math.floor(safe / 3600)).padStart(2, '0');
  const minutes = String(Math.floor((safe % 3600) / 60)).padStart(2, '0');
  const secs = String(safe % 60).padStart(2, '0');
  return `${hours}:${minutes}:${secs}`;
};

const getQuestionStatus = ({ answered, marked, visited }) => {
  if (marked && answered) return 'answeredMarked';
  if (marked) return 'marked';
  if (answered) return 'answered';
  if (visited) return 'unattempted';
  return 'notVisited';
};

const CBTTest = ({ testConfig = {}, questions = [], onBack, onFinish }) => {
  const examPattern = testConfig.examPattern || 'custom';
  const durationMinutes = Number(testConfig.testDurationMinutes || 60);
  const advancedPaper = testConfig.advancedPaper || null;
  const verificationMethod = testConfig.verificationMethod || 'uploadKey';

  const questionSet = useMemo(() => Array.isArray(questions) ? questions : [], [questions]);
  const isPreparationState = questionSet.length === 0;

  const [timeLeft, setTimeLeft] = useState(() => durationMinutes * 60);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [visitedQuestions, setVisitedQuestions] = useState({});
  const [markedForReview, setMarkedForReview] = useState({});
  const [isSubmitOpen, setIsSubmitOpen] = useState(false);
  const [attemptMeta, setAttemptMeta] = useState(() => startTest({
    testId: `test-${Date.now()}`,
    examPattern,
    advancedPaper,
    durationMinutes,
    verificationMethod,
  }));
  const [paperPhase, setPaperPhase] = useState(
    examPattern === 'jee-advanced' && advancedPaper === 'both-papers' ? 'paper-1' : 'single'
  );

  const isReady = !isPreparationState;

  const handleSubmitAttempt = useCallback((autoSubmitted = false) => {
    if (!questionSet.length) return;

    const submittedResult = submitTest(
      {
        ...attemptMeta,
        examPattern,
        advancedPaper,
        durationMinutes,
        verificationMethod,
        questions: questionSet,
        answers,
        visitedQuestions,
        markedForReview,
        timeUsedSeconds: durationMinutes * 60 - timeLeft,
        submittedAt: new Date().toISOString(),
        autoSubmitted,
      },
      { autoSubmitted }
    );

    if (onFinish) {
      onFinish(submittedResult);
    }
  }, [advancedPaper, answers, attemptMeta, durationMinutes, examPattern, markedForReview, onFinish, questionSet, timeLeft, verificationMethod, visitedQuestions]);

  const handleAutoSubmit = useCallback(() => {
    handleSubmitAttempt(true);
  }, [handleSubmitAttempt]);

  useEffect(() => {
    if (!isReady || isPreparationState) return undefined;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          handleAutoSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isReady, isPreparationState, handleAutoSubmit]);

  const currentQuestion = questionSet[currentIndex] || null;
  const answeredCount = Object.keys(answers).length;
  const markedCount = Object.keys(markedForReview).length;
  const notVisitedCount = questionSet.filter((question) => !visitedQuestions[question.id]).length;
  const unattemptedCount = questionSet.filter((question) => {
    const status = getQuestionStatus({
      answered: !!answers[question.id],
      marked: !!markedForReview[question.id],
      visited: !!visitedQuestions[question.id],
    });
    return status === 'notVisited' || status === 'unattempted';
  }).length;

  const updateAttemptMeta = (nextState) => {
    setAttemptMeta((prev) => ({
      ...prev,
      ...nextState,
    }));
  };

  const handleAnswerSelect = (optionValue) => {
    if (!currentQuestion) return;

    setAnswers((prev) => ({
      ...prev,
      [currentQuestion.id]: optionValue,
    }));

    setVisitedQuestions((prev) => ({
      ...prev,
      [currentQuestion.id]: true,
    }));

    updateAttemptMeta({ answers: { ...answers, [currentQuestion.id]: optionValue } });
  };

  const handleClearResponse = () => {
    if (!currentQuestion) return;

    setAnswers((prev) => {
      const next = { ...prev };
      delete next[currentQuestion.id];
      return next;
    });

    setMarkedForReview((prev) => {
      const next = { ...prev };
      delete next[currentQuestion.id];
      return next;
    });

    updateAttemptMeta({ answers: { ...answers } });
  };

  const handleMarkForReview = () => {
    if (!currentQuestion) return;
    const alreadyMarked = Boolean(markedForReview[currentQuestion.id]);

    setMarkedForReview((prev) => {
      const next = { ...prev };
      if (alreadyMarked) delete next[currentQuestion.id];
      else next[currentQuestion.id] = true;
      return next;
    });

    setVisitedQuestions((prev) => ({
      ...prev,
      [currentQuestion.id]: true,
    }));

    if (!alreadyMarked && currentIndex < questionSet.length - 1) {
      setCurrentIndex((prev) => prev + 1);
    }
  };

  const goToQuestion = (index) => {
    if (questionSet.length === 0) return;
    setCurrentIndex(Math.max(0, Math.min(index, questionSet.length - 1)));
  };

  const handleSaveAndNext = () => {
    if (currentIndex < questionSet.length - 1) {
      setCurrentIndex((prev) => prev + 1);
    }
  };

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
    }
  };

  const handleOpenSubmit = () => setIsSubmitOpen(true);
  const handleCloseSubmit = () => setIsSubmitOpen(false);

  const renderPaperBreakScreen = () => (
    <div className="cbt-prep-screen cbt-break-screen fade-in-anim">
      <div className="prep-card">
        <div className="prep-badge">Paper 1 Complete</div>
        <h2>Take a break before Paper 2</h2>
        <p>
          Paper 1 has been submitted and locked. You can begin Paper 2 whenever you are ready.
        </p>
        <button type="button" className="btn-primary cbt-action-btn" onClick={() => {
          setPaperPhase('paper-2');
          setTimeLeft(durationMinutes * 60);
          setCurrentIndex(0);
        }}>
          Start Paper 2
        </button>
      </div>
    </div>
  );

  const renderPreparationState = () => (
    <div className="cbt-prep-screen fade-in-anim">
      <div className="prep-card">
        <div className="prep-badge">Preparing Test</div>
        <h2>Your questions are being prepared.</h2>
        <p>
          PDF extraction and question parsing are not connected in this step yet. The CBT engine is ready for a real question array, and this state will transition to the live exam once the coaching PDF is integrated.
        </p>
        <button type="button" className="btn-primary cbt-action-btn" onClick={onBack}>
          Return to Setup
        </button>
      </div>
    </div>
  );

  if (isPreparationState) return renderPreparationState();

  if (examPattern === 'jee-advanced' && advancedPaper === 'both-papers' && paperPhase === 'paper-1' && attemptMeta.submittedAt) {
    return renderPaperBreakScreen();
  }

  return (
    <div className="cbt-shell fade-in-anim">
      <header className="cbt-header">
        <div className="cbt-brand-block">
          <div className="cbt-logo">RV</div>
          <div>
            <div className="cbt-brand-name">RankWorld AI</div>
            <div className="cbt-brand-subtitle">
              {examPattern === 'jee-main' && 'JEE Main'}
              {examPattern === 'jee-advanced' && 'JEE Advanced'}
              {examPattern === 'neet' && 'NEET'}
              {examPattern === 'custom' && 'Custom Exam'}
              {advancedPaper && advancedPaper !== 'both-papers' ? ` • ${advancedPaper.replace('-', ' ')}` : ''}
            </div>
          </div>
        </div>

        <div className="cbt-meta-block">
          <div className="cbt-meta-item">
            <span className="meta-label">Exam</span>
            <strong>{examPattern === 'jee-main' ? 'JEE Main' : examPattern === 'jee-advanced' ? 'JEE Advanced' : examPattern === 'neet' ? 'NEET' : 'Custom'}</strong>
          </div>
          <div className="cbt-meta-item">
            <span className="meta-label">Paper</span>
            <strong>{advancedPaper ? advancedPaper.replace('-', ' ') : 'Standard'}</strong>
          </div>
          <div className={`cbt-timer ${timeLeft <= 300 ? 'warning' : ''}`}>
            <span className="meta-label">Time Left</span>
            <strong>{formatTime(timeLeft)}</strong>
          </div>
        </div>

        <button type="button" className="btn-primary cbt-submit-btn" onClick={handleOpenSubmit}>
          Submit Test
        </button>
      </header>

      <main className="cbt-main">
        <section className="cbt-main-panel">
          <div className="question-header-row">
            <div className="question-meta">
              <span className="question-subject">{currentQuestion?.subject || 'General'}</span>
              <span className="question-number">Question {currentQuestion?.questionNumber || currentIndex + 1}</span>
            </div>
            <div className="question-actions-inline">
              <button type="button" className="action-btn secondary" onClick={handlePrevious}>Previous</button>
              <button type="button" className="action-btn secondary" onClick={handleSaveAndNext}>Save &amp; Next</button>
            </div>
          </div>

          <article className="question-card">
            <h3>{currentQuestion?.questionText || 'Question content will appear here once the PDF extraction is connected.'}</h3>

            <div className="options-list">
              {(currentQuestion?.options || []).length === 0 && (
                <p>This question has no selectable options. Skip it or return to setup.</p>
              )}
              {(currentQuestion?.options || []).map((option, index) => {
                const optionKey = String.fromCharCode(65 + index);
                const selectedValue = answers[currentQuestion?.id];
                const isSelected = selectedValue === optionKey;

                return (
                  <button
                    key={`${currentQuestion?.id || currentIndex}-${optionKey}`}
                    type="button"
                    className={`option-item ${isSelected ? 'selected' : ''}`}
                    onClick={() => handleAnswerSelect(optionKey)}
                  >
                    <span className="option-label">{optionKey}</span>
                    <span className="option-text">{option}</span>
                  </button>
                );
              })}
            </div>
          </article>

          <div className="navigation-row">
            <button type="button" className="action-btn" onClick={handleClearResponse}>Clear Response</button>
            <button type="button" className="action-btn" onClick={handleMarkForReview}>
              {markedForReview[currentQuestion?.id] ? 'Remove Review' : 'Mark for Review & Next'}
            </button>
            <button type="button" className="action-btn primary" onClick={handleSaveAndNext}>Next</button>
          </div>
        </section>

        <aside className="cbt-palette-panel">
          <div className="palette-header-row">
            <h4>Question Palette</h4>
            <span className="palette-progress">{currentIndex + 1}/{questionSet.length || 0}</span>
          </div>

          <div className="status-legend">
            {Object.entries(statusLabels).map(([key, label]) => (
              <div key={key} className="legend-item">
                <span className={`legend-dot ${key}`} />
                <span>{label}</span>
              </div>
            ))}
          </div>

          <div className="palette-grid">
            {questionSet.map((question, index) => {
              const status = getQuestionStatus({
                answered: !!answers[question.id],
                marked: !!markedForReview[question.id],
                visited: !!visitedQuestions[question.id] || index === currentIndex,
              });

              return (
                <button
                  key={question.id || index}
                  type="button"
                  className={`palette-item ${status} ${currentIndex === index ? 'active' : ''}`}
                  onClick={() => goToQuestion(index)}
                >
                  {index + 1}
                </button>
              );
            })}
          </div>
        </aside>
      </main>

      {isSubmitOpen && (
        <div className="submit-modal-overlay" onClick={handleCloseSubmit}>
          <div className="submit-modal" onClick={(e) => e.stopPropagation()}>
            <h3>Submit Test</h3>
            <p>Are you sure you want to submit your test?</p>

            <div className="submit-summary">
              <div><span>Answered</span><strong>{answeredCount}</strong></div>
              <div><span>Not Answered</span><strong>{unattemptedCount}</strong></div>
              <div><span>Marked for Review</span><strong>{markedCount}</strong></div>
              <div><span>Not Visited</span><strong>{notVisitedCount}</strong></div>
            </div>

            <div className="submit-actions">
              <button type="button" className="btn-secondary" onClick={handleCloseSubmit}>Cancel</button>
              <button type="button" className="btn-primary" onClick={() => { handleCloseSubmit(); handleSubmitAttempt(false); }}>
                Submit Test
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CBTTest;
