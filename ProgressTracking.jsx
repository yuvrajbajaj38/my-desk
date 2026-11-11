import './ProgressTracking.css';

const ProgressTracking = ({ dailyPlan }) => {
  const calculateStats = () => {
    let total = 0;
    let completed = 0;
    let inProgress = 0;

    dailyPlan?.forEach((day) => {
      day.lectures?.forEach((lecture) => {
        total++;
        if (lecture.status === 'completed') completed++;
        else if (lecture.status === 'in-progress') inProgress++;
      });
    });

    return {
      total,
      completed,
      inProgress,
      pending: total - completed - inProgress,
      percentage: total > 0 ? Math.round((completed / total) * 100) : 0,
    };
  };

  const stats = calculateStats();

  const getDayStatus = (day) => {
    let completed = 0;
    let total = 0;

    day.lectures?.forEach((lecture) => {
      total++;
      if (lecture.status === 'completed') completed++;
    });

    return { completed, total, percentage: total > 0 ? Math.round((completed / total) * 100) : 0 };
  };

  if (!dailyPlan || dailyPlan.length === 0) {
    return (
      <div className="progress-tracking">
        <p className="empty-message">No progress data available</p>
      </div>
    );
  }

  return (
    <div className="progress-tracking fade-in-anim">
      {/* Overall Statistics */}
      <div className="overall-stats">
        <div className="stat-box premium-card completed">
          <p className="stat-title">Completed</p>
          <p className="stat-number">{stats.completed}</p>
          <p className="stat-label">out of {stats.total} lectures</p>
        </div>

        <div className="stat-box premium-card in-progress">
          <p className="stat-title">In Progress</p>
          <p className="stat-number">{stats.inProgress}</p>
          <p className="stat-label">currently studying</p>
        </div>

        <div className="stat-box premium-card pending">
          <p className="stat-title">Pending</p>
          <p className="stat-number">{stats.pending}</p>
          <p className="stat-label">to be completed</p>
        </div>

        <div className="stat-box premium-card percentage">
          <p className="stat-title">Completion</p>
          <p className="stat-number">{stats.percentage}%</p>
          <p className="stat-label">progress</p>
        </div>
      </div>

      {/* Main Progress Bar */}
      <div className="main-progress premium-card">
        <div className="progress-labels">
          <h4>Overall Progress</h4>
          <span className="percentage-text">{stats.percentage}%</span>
        </div>
        <div className="progress-bar-large">
          <div className="progress-segment completed-seg" style={{ width: `${(stats.completed / stats.total) * 100}%` }}></div>
          <div className="progress-segment in-progress-seg" style={{ width: `${(stats.inProgress / stats.total) * 100}%` }}></div>
        </div>
      </div>

      {/* Daily Progress Timeline */}
      <div className="daily-progress-section">
        <h4>Daily Progress Timeline</h4>
        <div className="daily-progress-list">
          {dailyPlan.map((day, idx) => {
            const dayStats = getDayStatus(day);
            return (
              <div key={idx} className="day-progress-item">
                <div className="day-label">
                  <span className="day-name">Day {day.day}</span>
                  <span className="day-stats-mini">
                    {dayStats.completed}/{dayStats.total} completed
                  </span>
                </div>
                <div className="day-progress-bar">
                  <div
                    className="day-progress-fill"
                    style={{ width: `${dayStats.percentage}%` }}
                  ></div>
                </div>
                <span className="day-percent">{dayStats.percentage}%</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Status Legend */}
      <div className="status-legend">
        <h4>Status Legend</h4>
        <div className="legend-items">
          <div className="legend-item">
            <span className="legend-dot pending"></span>
            <span>Pending - Not started</span>
          </div>
          <div className="legend-item">
            <span className="legend-dot in-progress"></span>
            <span>In Progress - Currently studying</span>
          </div>
          <div className="legend-item">
            <span className="legend-dot completed"></span>
            <span>Completed - Finished</span>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="quick-actions">
        {stats.completed === 0 && (
          <p className="action-text">💪 Let's get started! Mark your first lecture complete today.</p>
        )}
        {stats.completed > 0 && stats.completed < stats.total && (
          <p className="action-text">🎯 You're doing great! {stats.pending} lectures to go!</p>
        )}
        {stats.completed === stats.total && (
          <p className="action-text">🎉 Congratulations! Backlog cleared!</p>
        )}
      </div>
    </div>
  );
};

export default ProgressTracking;
