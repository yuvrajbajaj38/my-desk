import { useEffect, useState } from 'react';
import './StudentDashboard.css';
import { listAttemptResults, summarizeAttempts } from '../services/resultservice';
import { listBooks } from '../services/questionBankService';
import { getBacklogPlan, calculateProgress } from '../services/backlogservice';
import { useAuth } from '../hooks/useAuth';

const StudentDashboard = ({ onLogout, onNavigate, userProfile, profileLoading, profileError }) => {
  const [useTimer, setUseTimer] = useState(true);
  const [autoCheck, setAutoCheck] = useState(true);
  const [uploadAnsKey, setUploadAnsKey] = useState(false);
  const { user } = useAuth();
  const [attempts, setAttempts] = useState([]);
  const [books, setBooks] = useState([]);
  const [backlogProgress, setBacklogProgress] = useState(null);
  const [dataError, setDataError] = useState("");
  const [dataLoading, setDataLoading] = useState(false);

  useEffect(() => {
    const load = async () => {
      if (!user?.uid) return;
      setDataLoading(true);
      setDataError("");
      try {
        const [attemptRows, bookRows, backlog] = await Promise.all([
          listAttemptResults(user.uid),
          listBooks(user.uid),
          getBacklogPlan(user.uid),
        ]);
        setAttempts(attemptRows);
        setBooks(bookRows);
        if (backlog.success && backlog.data?.dailyPlan) {
          setBacklogProgress(calculateProgress(backlog.data.dailyPlan));
        }
      } catch (error) {
        setDataError(error.message || "Could not load dashboard stats.");
      } finally {
        setDataLoading(false);
      }
    };
    load();
  }, [user?.uid]);

  const summary = summarizeAttempts(attempts);
  const weakest = summary.weakest;

  return (
    <div className="dashboard-main fade-in-anim">
      
      {/* 1. GAMIFIED HEADER */}
      <div className="dash-top-bar">
        <div className="welcome-text">
          <h2>Welcome back, <span className="highlight-brand">{userProfile?.name}!</span></h2>
          <p>Your AI Study Engine is ready.</p>
          {profileLoading && <p>Loading profile...</p>}
          {profileError && <p>Profile could not be fully synced. Showing available data.</p>}
          {dataLoading && <p>Loading your latest stats...</p>}
          {dataError && <p>{dataError}</p>}
        </div>
        
        {/* GAMIFICATION BAR: Streak, XP & Leaderboard */}
        <div className="gamification-bar">
          <div className="stat-badge streak-badge" title="Daily Login Streak">
            <span className="stat-icon pulse-orange">🔥</span>
            <div className="stat-info">
              <span className="stat-val">{userProfile?.streak ?? 0}</span>
              <span className="stat-text">Day Streak</span>
            </div>
          </div>

          <div className="stat-badge xp-badge" title="Total Experience Points">
            <span className="stat-icon">⚡</span>
            <div className="stat-info">
              <span className="stat-val">{(userProfile?.totalXP || 0).toLocaleString()}</span>
              <span className="stat-text">XP Earned</span>
            </div>
          </div>

          {/* लीडरबोर्ड बटन - अब यह काम करेगा! */}
          <button className="leaderboard-btn hover-glow" onClick={() => onNavigate('leaderboard')}>
            🏆 Global Rank
          </button>
        </div>

        <div className="dash-right">
          <div className="big-credit-wallet">
            <div className="wallet-icon">💎</div>
            <div className="wallet-details">
              <span className="wallet-count">{userProfile?.credits ?? 0}</span>
              <span className="wallet-label">AI Credits Left</span>
            </div>
          </div>
          <button className="btn-secondary logout-btn" onClick={onLogout}>Logout</button>
        </div>
      </div>

      {/* 2. Action Hub (3 Interactive Boxes) */}
      <div className="action-hub-3">
        
        {/* Box 1: AI Mock Test */}
        <div className="action-box mock-box">
          <div className="box-header">
            <span className="box-icon">🎯</span>
            <h3>AI Mock Test</h3>
          </div>
          <p className="box-desc">Generate a customized exam-level test.</p>
          
          <div className="box-settings">
            <label className="setting-row">
              <span>⏱️ Custom Timer</span>
              <input type="checkbox" checked={useTimer} onChange={() => setUseTimer(!useTimer)} />
            </label>
            <label className="setting-row">
              <span>🤖 AI Auto-Check</span>
              <input type="checkbox" checked={autoCheck} onChange={() => setAutoCheck(!autoCheck)} />
            </label>
            <label className="setting-row">
              <span>📄 Upload Answer Key</span>
              <input type="checkbox" checked={uploadAnsKey} onChange={() => setUploadAnsKey(!uploadAnsKey)} />
            </label>
          </div>
          
          <button className="btn-primary w-100 action-btn" onClick={() => onNavigate('mock-tests')}>Start Test Engine</button>
        </div>

        {/* Box 2: PDF Notes → AI Test */}
        <div className="action-box pdf-box">
          <div className="box-header">
            <span className="box-icon">📄</span>
            <h3>PDF Notes → AI Test</h3>
          </div>
          <p className="box-desc">Upload class notes or PDFs and convert them into AI-generated practice questions.</p>

          <div className="box-settings">
            <label className="setting-row">
              <span>🧠 Extract from notes</span>
              <input type="checkbox" checked={true} readOnly />
            </label>
            <label className="setting-row">
              <span>✍️ Generate AI questions</span>
              <input type="checkbox" checked={true} readOnly />
            </label>
            <label className="setting-row">
              <span>⚡ Reuse CBT engine</span>
              <input type="checkbox" checked={true} readOnly />
            </label>
          </div>

          <button className="btn-primary w-100 action-btn pdf-btn" onClick={() => onNavigate('notes-ai-test')}>Open Notes AI</button>
        </div>

        {/* Box 3: Personal Question Bank */}
        <div className="action-box qbank-box">
          <div className="box-header">
            <span className="box-icon">📚</span>
            <h3>My Question Bank</h3>
          </div>
          <p className="box-desc">Your personal vault of books and modules.</p>
          
          <div className="saved-books">
            {books.slice(0, 2).map((book) => (
              <div key={book.id} className="book-tag active">{book.title || book.fileName}</div>
            ))}
            {!books.length && <div className="book-tag">No books uploaded yet</div>}
            <div className="book-tag add-new" onClick={() => onNavigate('qbank')}>➕ Upload New Book</div>
          </div>
          
          <button className="btn-primary w-100 action-btn qbank-btn" onClick={() => onNavigate('qbank')}>Open Vault</button>
        </div>

      </div>
      <div className="analytics-grid" style={{ marginBottom: '24px' }}>
        <div className="premium-card">
          <h4>Tests Attempted</h4>
          <h2>{summary.testsAttempted}</h2>
        </div>
        <div className="premium-card">
          <h4>Accuracy</h4>
          <h2>{summary.testsAttempted ? `${summary.accuracy}%` : '—'}</h2>
        </div>
        <div className="premium-card">
          <h4>Global Rank</h4>
          <h2>{userProfile?.globalRank || 'Unranked'}</h2>
          <p>Rank is calculated from saved XP, not by AI.</p>
        </div>
        <div className="premium-card">
          <h4>Backlog</h4>
          <h2>{backlogProgress ? `${backlogProgress.completedPercent}%` : 'No plan'}</h2>
        </div>
      </div>
      <div 
        className="premium-card hover-glow" 
        onClick={() => onNavigate('backlog-manager')} 
        style={{ 
          cursor: 'pointer', 
          marginBottom: '40px', 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.1), rgba(5, 150, 105, 0.15))', 
          borderColor: 'rgba(16, 185, 129, 0.3)',
          flexWrap: 'wrap',
          gap: '15px'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <div style={{ fontSize: '3rem' }}>📅</div>
          <div>
            <h3 style={{ fontSize: '1.4rem', color: '#f8fafc', marginBottom: '5px' }}>AI Backlog & Coaching Manager</h3>
            <p style={{ color: '#94a3b8', fontSize: '0.95rem' }}>Clear your pending lectures with personalized daily targets and earn XP!</p>
          </div>
        </div>
        <button className="btn-primary" style={{ background: 'linear-gradient(110deg, #10b981, #059669)', padding: '10px 25px' }}>
          Open Planner →
        </button>
      </div>
      {/* 3. Analytics Section */}
      <div className="analytics-grid">
        <div className="premium-card weak-topic-alert">
          <div className="card-glow red-glow"></div>
          <div className="alert-header">
            <span className="alert-icon pulse-red">🚨</span>
            <h4>Weak Topic Alert</h4>
          </div>
          <h2>{weakest ? weakest.name : 'No weak topic yet'}</h2>
          <div className="progress-track">
            <div className="progress-fill red-fill" style={{width: `${weakest ? Math.max(10, 100 - weakest.accuracy) : 0}%`}}></div>
          </div>
          <p>{weakest ? `Accuracy in this subject is ${weakest.accuracy}%.` : 'Take an evaluated mock test to unlock topic alerts.'}</p>
          <button className="btn-outline-red" onClick={() => onNavigate('mock-tests')}>Fix Topic Now →</button>
        </div>

        <div className="premium-card predicted-rank">
          <div className="card-glow blue-glow"></div>
          <div className="alert-header">
            <span className="alert-icon">🏆</span>
            <h4>Predicted AIR</h4>
          </div>
          <h2 className="rank-text">{userProfile?.predictedRank || '—'}</h2>
          <p>{summary.testsAttempted ? `Based on ${summary.testsAttempted} saved test attempt(s).` : 'Predicted AIR appears after evaluated tests are stored.'}</p>
          <p className="sub-text">Non-AI rank uses stored scores and XP, not generated copy.</p>
          <button className="btn-outline-red" style={{ borderColor: '#60a5fa', color: '#60a5fa' }} onClick={() => onNavigate('analytics')}>Open Analytics</button>
        </div>
      </div>

      {/* 4. Recent Test History */}
      <div className="premium-card history-section">
        <h3>Recent Performance</h3>
        <div className="history-list">
          {!attempts.length && (
            <p>No tests attempted yet. Start the Mock Test Engine to see results here.</p>
          )}
          {attempts.slice(0, 5).map((attempt) => (
            <div className="history-row" key={attempt.id}>
              <div className="h-left">
                <div className="h-icon">📝</div>
                <div>
                  <h4>{attempt.subject || attempt.testType || 'Mock Test'} • {attempt.examPattern || 'Custom'}</h4>
                  <p>{attempt.timeUsedSeconds ? `${Math.round(attempt.timeUsedSeconds / 60)} mins` : 'Timed'} • <span className="badge green-badge">{attempt.evaluationComplete ? 'Evaluated' : 'Pending key'}</span></p>
                </div>
              </div>
              <div className="h-right">
                <div className="score">{attempt.score ?? 0} <span>/ {attempt.totalQuestions || 0}</span></div>
                <button className="review-btn" onClick={() => onNavigate('analytics')}>Review</button>
              </div>
            </div>
          ))}
        </div>
        {summary.subjectProgress.length > 0 && (
          <div style={{ marginTop: '24px' }}>
            <h3>Subject Progress</h3>
            {summary.subjectProgress.map((subject) => (
              <p key={subject.name}>{subject.name}: {subject.accuracy}% accuracy across {subject.total} questions</p>
            ))}
          </div>
        )}
      </div>
      
    </div>
  );
};

export default StudentDashboard;