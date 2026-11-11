import { useEffect, useMemo, useState } from 'react';
import '../styles/TestResult.css';
import { buildLocalAnalysis, buildResultModel, saveAttemptResult } from '../services/resultservice';
import { runAiJob } from '../services/aiClient';
import { useAuth } from '../hooks/useAuth';

const formatTime = (seconds = 0) => {
  const safe = Math.max(0, seconds || 0);
  const hrs = String(Math.floor(safe / 3600)).padStart(2, '0');
  const mins = String(Math.floor((safe % 3600) / 60)).padStart(2, '0');
  const secs = String(safe % 60).padStart(2, '0');
  return `${hrs}:${mins}:${secs}`;
};

const TestResult = ({ result, onBack, userId }) => {
  const { refreshProfile } = useAuth();
  const [saveState, setSaveState] = useState('');
  const [official, setOfficial] = useState(null);
  const [analysis, setAnalysis] = useState(null);
  const [analysisError, setAnalysisError] = useState('');
  const [analysisLoading, setAnalysisLoading] = useState(false);

  const preview = useMemo(() => {
    if (!result) return null;
    return buildResultModel({
      attempt: result,
      questions: result.questions || [],
      answers: result.answers || {},
      markedForReview: result.markedForReview || {},
      visitedQuestions: result.visitedQuestions || {},
      timeUsedSeconds: result.timeUsedSeconds || 0,
      testType: result.testType || result.questionSource || 'custom',
      examPattern: result.examPattern || 'custom',
      studyClass: result.studyClass || '',
      subject: result.subject || '',
      selectedChapters: result.selectedChapters || [],
    });
  }, [result]);

  useEffect(() => {
    const persist = async () => {
      if (!userId || !preview || !result) return;
      const saved = await saveAttemptResult(userId, {
        ...preview,
        artifactId: result.artifactId || null,
      }, {
        artifactId: result.artifactId || null,
        answers: result.answers || {},
        markedForReview: result.markedForReview || {},
        visitedQuestions: result.visitedQuestions || {},
        autoSubmitted: Boolean(result.autoSubmitted),
      });

      if (saved.success && saved.data?.result) {
        setOfficial(saved.data.result);
        setSaveState('Official result saved. Streak and XP were updated on the server.');
        try {
          await refreshProfile?.();
        } catch {
          // dashboard will refresh on next load
        }
      } else {
        setSaveState(saved.error
          ? `Official scoring is unavailable: ${saved.error} The numbers below are a local preview only.`
          : 'Official scoring is unavailable. The numbers below are a local preview only.');
      }
    };
    persist();
  }, [preview, refreshProfile, result, userId]);

  const scored = official || preview;

  if (!result || !scored) {
    return (
      <div className="result-shell result-empty fade-in-anim">
        <div className="result-card">
          <h2>No test result available.</h2>
          <p>Complete a CBT attempt to view the result summary.</p>
          <button type="button" className="btn-primary" onClick={onBack}>Back to Dashboard</button>
        </div>
      </div>
    );
  }

  const handleAnalysis = async () => {
    setAnalysisError('');
    setAnalysisLoading(true);
    const local = buildLocalAnalysis(official || preview);
    setAnalysis(local);
    try {
      if (!official?.attemptId) {
        setAnalysisError('AI analysis requires an official server result. Local metrics below are not official AI output.');
        return;
      }
      const remote = await runAiJob('analyze-result', { attemptId: official.attemptId });
      if (remote?.analysis) {
        setAnalysis({ ...local, ...remote.analysis, source: 'ai-server' });
      }
    } catch (error) {
      setAnalysisError(error.message);
    } finally {
      setAnalysisLoading(false);
    }
  };

  return (
    <div className="result-shell fade-in-anim">
      <div className="result-card">
        <div className="result-badge">{official ? 'Official Result' : 'Test Submitted'}</div>
        <h1>Attempt Summary</h1>
        {saveState && <p className="result-note">{saveState}</p>}

        <div className="result-grid">
          <div className="result-stat"><span>Score</span><strong>{scored.score} / {scored.totalQuestions}</strong></div>
          <div className="result-stat"><span>Correct</span><strong>{scored.correct}</strong></div>
          <div className="result-stat"><span>Wrong</span><strong>{scored.wrong}</strong></div>
          <div className="result-stat"><span>Skipped</span><strong>{scored.skipped}</strong></div>
          <div className="result-stat"><span>Accuracy</span><strong>{scored.accuracy}%</strong></div>
          <div className="result-stat"><span>Time Used</span><strong>{formatTime(scored.timeUsedSeconds)}</strong></div>
          <div className="result-stat"><span>Type</span><strong>{scored.testType}</strong></div>
          <div className="result-stat"><span>Pattern</span><strong>{scored.examPattern}</strong></div>
        </div>

        {!scored.evaluationComplete && (
          <div className="result-note">
            <p>Some answers could not be scored because an answer key was not mapped. Metrics above exclude those items from accuracy.</p>
          </div>
        )}

        <div className="result-actions">
          <button type="button" className="btn-secondary" onClick={onBack}>Back to Dashboard</button>
          <button type="button" className="btn-primary" onClick={handleAnalysis} disabled={analysisLoading || !official}>
            {analysisLoading ? 'Analyzing...' : 'AI Detail Analysis'}
          </button>
        </div>

        {analysisError && <p className="result-note">{analysisError} Local metrics are still shown below.</p>}

        {analysis && (
          <div className="result-note" style={{ marginTop: '20px', textAlign: 'left' }}>
            <h3>Analysis layer</h3>
            <p><strong>Source:</strong> {analysis.source}</p>
            <p><strong>Strengths:</strong> {(analysis.strengths || []).join(', ')}</p>
            <p><strong>Weak topics:</strong> {(analysis.weakTopics || []).join(', ')}</p>
            <p><strong>Accuracy:</strong> {analysis.accuracyPatterns}</p>
            <p><strong>Time:</strong> {analysis.timeManagement}</p>
            <p><strong>Recommendations:</strong> {(analysis.recommendations || []).join(' ')}</p>
            <p><strong>Rank/performance prediction:</strong> {analysis.rankPrediction || 'Available after the server analysis job is configured. Streak and rank still come from stored results, not this panel.'}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default TestResult;
