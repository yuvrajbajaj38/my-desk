import { useState, useMemo } from 'react';
import './BacklogDashboard.css';
import { calculateProgress, generateAIInsights } from '../../services/backlogservice';
import DailyPlanView from './DailyPlanView';
import ProgressTracking from './ProgressTracking';

const BacklogDashboard = ({ backlogData, onStartOver, onEditStep, onReschedule }) => {
  const [activeView, setActiveView] = useState('dashboard');
  const [missedDays, setMissedDays] = useState(1);

  const progress = useMemo(() => calculateProgress(backlogData.dailyPlan), [backlogData.dailyPlan]);
  const insights = useMemo(() => generateAIInsights(backlogData, progress), [backlogData, progress]);

  const getSubjectProgress = () => {
    const subjectData = {};
    backlogData.chapters?.forEach((ch) => {
      if (!subjectData[ch.subject]) {
        subjectData[ch.subject] = {
          name: ch.subject,
          total: 0,
          completed: 0,
          hours: 0,
        };
      }
      const hours = (ch.pendingLectures * (ch.lectureDuration || 60)) / 60;
      subjectData[ch.subject].total += ch.pendingLectures || 0;
      subjectData[ch.subject].hours += hours;
    });

    return Object.values(subjectData);
  };

  const getTotalHours = () => {
    return backlogData.chapters?.reduce((total, ch) => {
      return total + ((ch.pendingLectures || 0) * (ch.lectureDuration || 60)) / 60;
    }, 0) || 0;
  };

  const subjectProgress = getSubjectProgress();
  const totalHours = getTotalHours();
  const remainingHours = totalHours * (1 - progress.completedPercent / 100);
  const targetDate = new Date(backlogData.targetDate || new Date().getTime() + (backlogData.targetDays || 30) * 24 * 60 * 60 * 1000);

  return (
    <div className="step-container backlog-dashboard fade-in-anim">
      {/* Header */}
      <div className="dashboard-header">
        <h3>📊 Your Backlog Dashboard</h3>
        <p>Track your progress and stay on schedule</p>
      </div>

      {/* View Tabs */}
      <div className="dashboard-tabs">
        <button
          className={`tab-btn ${activeView === 'dashboard' ? 'active' : ''}`}
          onClick={() => setActiveView('dashboard')}
        >
          📊 Dashboard
        </button>
        <button
          className={`tab-btn ${activeView === 'daily-plan' ? 'active' : ''}`}
          onClick={() => setActiveView('daily-plan')}
        >
          📅 Daily Plan
        </button>
        <button
          className={`tab-btn ${activeView === 'progress' ? 'active' : ''}`}
          onClick={() => setActiveView('progress')}
        >
          ✓ Progress
        </button>
      </div>

      {/* Dashboard View */}
      {activeView === 'dashboard' && (
        <div className="dashboard-view">
          {/* Main Stats */}
          <div className="stats-grid-4">
            <div className="stat-card premium-card">
              <span className="stat-emoji">📚</span>
              <div className="stat-content">
                <p className="stat-label">Total Backlog</p>
                <p className="stat-value">{progress.totalLectures || 0} lectures</p>
                <p className="stat-subtext">{totalHours.toFixed(1)} hours</p>
              </div>
            </div>

            <div className="stat-card premium-card">
              <span className="stat-emoji">✓</span>
              <div className="stat-content">
                <p className="stat-label">Completed</p>
                <p className="stat-value">{progress.completedLectures || 0}</p>
                <p className="stat-subtext">{progress.completedPercent}%</p>
              </div>
            </div>

            <div className="stat-card premium-card">
              <span className="stat-emoji">⏳</span>
              <div className="stat-content">
                <p className="stat-label">Remaining</p>
                <p className="stat-value">{progress.totalLectures - progress.completedLectures}</p>
                <p className="stat-subtext">{remainingHours.toFixed(1)} hours</p>
              </div>
            </div>

            <div className="stat-card premium-card target-card">
              <span className="stat-emoji">🎯</span>
              <div className="stat-content">
                <p className="stat-label">Target Date</p>
                <p className="stat-value">{targetDate.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</p>
                <p className="stat-subtext">{backlogData.targetDays} days</p>
              </div>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="progress-section premium-card">
            <div className="progress-header">
              <h4>Overall Progress</h4>
              <span className="progress-percent">{progress.completedPercent}%</span>
            </div>
            <div className="progress-bar-container">
              <div
                className="progress-bar"
                style={{ width: `${progress.completedPercent}%` }}
              >
                <span className="progress-text">{progress.completedPercent}%</span>
              </div>
            </div>
          </div>

          {/* Subject-wise Progress */}
          <div className="subject-progress-section">
            <h4>Subject-wise Progress</h4>
            <div className="subject-cards">
              {subjectProgress.map((subject) => (
                <div key={subject.name} className="subject-progress-card premium-card">
                  <div className="subject-header">
                    <h5>{subject.name.charAt(0).toUpperCase() + subject.name.slice(1)}</h5>
                    <span className="subject-badge">{subject.total} lectures</span>
                  </div>
                  <div className="subject-bar">
                    <div className="subject-progress" style={{ width: '0%' }}>
                      0%
                    </div>
                  </div>
                  <p className="subject-hours">{subject.hours.toFixed(1)} hours total</p>
                </div>
              ))}
            </div>
          </div>

          {/* AI Insights */}
          {insights.length > 0 && (
            <div className="insights-section">
              <h4>💡 AI Insights</h4>
              <div className="insights-list">
                {insights.map((insight, idx) => (
                  <div key={idx} className="insight-card premium-card">
                    <p>{insight}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Daily Plan View */}
      {activeView === 'daily-plan' && (
        <DailyPlanView dailyPlan={backlogData.dailyPlan} />
      )}

      {/* Progress Tracking View */}
      {activeView === 'progress' && (
        <ProgressTracking dailyPlan={backlogData.dailyPlan} />
      )}

      {/* Edit Controls */}
      <div className="dashboard-controls">
        <button className="btn-secondary" onClick={onStartOver}>
          ↺ Start New Plan
        </button>
        <button className="btn-primary" onClick={() => onEditStep(4)}>
          ✎ Edit Backlog
        </button>
        {onReschedule && (
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
            <input
              type="number"
              min="1"
              max="30"
              value={missedDays}
              onChange={(event) => setMissedDays(Number(event.target.value))}
              style={{ width: '72px', padding: '8px', borderRadius: '8px' }}
            />
            <button className="btn-secondary" onClick={() => onReschedule(missedDays)}>
              Reschedule missed days
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default BacklogDashboard;
