import { useState } from 'react';
import './DailyPlanView.css';

const DailyPlanView = ({ dailyPlan }) => {
  const [expandedDays, setExpandedDays] = useState(new Set([0]));

  const toggleDay = (dayIndex) => {
    const newExpanded = new Set(expandedDays);
    if (newExpanded.has(dayIndex)) {
      newExpanded.delete(dayIndex);
    } else {
      newExpanded.add(dayIndex);
    }
    setExpandedDays(newExpanded);
  };

  const formatMinutesToHoursMinutes = (minutes) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours === 0) return `${mins}m`;
    if (mins === 0) return `${hours}h`;
    return `${hours}h ${mins}m`;
  };

  const formatDate = (date) => {
    if (!date) return '';
    if (typeof date === 'string') date = new Date(date);
    return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
  };

  if (!dailyPlan || dailyPlan.length === 0) {
    return (
      <div className="daily-plan-view">
        <p className="empty-message">No daily plan generated yet</p>
      </div>
    );
  }

  return (
    <div className="daily-plan-view fade-in-anim">
      <div className="plan-header-info premium-card">
        <p className="info-text">
          📅 Your personalized plan spans <strong>{dailyPlan.length} days</strong>
        </p>
      </div>

      <div className="daily-plan-list">
        {dailyPlan.map((day, index) => (
          <div key={index} className="daily-card premium-card">
            <div
              className="day-header"
              onClick={() => toggleDay(index)}
              role="button"
              tabIndex="0"
            >
              <div className="day-title">
                <span className="day-number">Day {day.day}</span>
                <span className="day-date">{formatDate(day.date)}</span>
              </div>

              <div className="day-stats">
                <span className="stat-badge">
                  {day.lectures?.length || 0} lectures
                </span>
                <span className="stat-badge time">
                  {formatMinutesToHoursMinutes(day.totalMinutes)}
                </span>
              </div>

              <button
                className={`expand-btn ${expandedDays.has(index) ? 'expanded' : ''}`}
              >
                ▼
              </button>
            </div>

            {expandedDays.has(index) && (
              <div className="day-content">
                <div className="lectures-list">
                  {day.lectures?.map((lecture, lecIdx) => (
                    <div key={lecIdx} className="lecture-item">
                      <div className="lecture-checkbox">
                        <input type="checkbox" readOnly />
                      </div>
                      <div className="lecture-details">
                        <p className="subject-name">{lecture.subject}</p>
                        <p className="chapter-name">{lecture.chapterName}</p>
                      </div>
                      <div className="lecture-meta">
                        <span className="lecture-label">Lecture {lecture.lectureIndex}</span>
                        <span className="lecture-duration">
                          {formatMinutesToHoursMinutes(lecture.lectureDuration)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="day-summary">
                  <p className="summary-text">
                    Total: <strong>{formatMinutesToHoursMinutes(day.totalMinutes)}</strong>
                  </p>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="plan-footer">
        <p className="footer-text">
          💡 This plan adapts as you mark lectures complete. Stay consistent!
        </p>
      </div>
    </div>
  );
};

export default DailyPlanView;
