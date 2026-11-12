import { useState } from 'react';
import './StudyTimeStep.css';

const StudyTimeStep = ({
  dailyStudyHours,
  studySchedule,
  targetDays,
  targetDate,
  onComplete,
}) => {
  const [studyMode, setStudyMode] = useState(studySchedule ? 'custom' : 'simple');
  const [hours, setHours] = useState(dailyStudyHours || 4);
  const [schedule, setSchedule] = useState(
    studySchedule || {
      morning: 2,
      afternoon: 1,
      evening: 1,
    }
  );
  const [days, setDays] = useState(targetDays || 30);
  const [useDate, setUseDate] = useState(!!targetDate);
  const [selectedDate, setSelectedDate] = useState(
    targetDate ? new Date(targetDate).toISOString().split('T')[0] : ''
  );

  const handleNext = () => {
    const totalScheduleHours =
      schedule.morning + schedule.afternoon + schedule.evening;

    if (studyMode === 'custom' && totalScheduleHours === 0) {
      alert('Please allocate at least some study time');
      return;
    }

    if (studyMode === 'simple' && hours <= 0) {
      alert('Please enter valid daily study hours');
      return;
    }

    if (days <= 0) {
      alert('Please enter a valid number of days');
      return;
    }

    const finalData = {
      dailyStudyHours: studyMode === 'simple' ? hours : totalScheduleHours,
      studySchedule: studyMode === 'custom' ? schedule : null,
      targetDays: days,
      targetDate: useDate ? selectedDate : null,
    };

    onComplete(finalData);
  };

  const getTotalScheduleHours = () => {
    return schedule.morning + schedule.afternoon + schedule.evening;
  };

  const getEstimatedCompletionDate = () => {
    const date = new Date();
    date.setDate(date.getDate() + days);
    return date.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  return (
    <div className="step-container study-time-step fade-in-anim">
      <div className="step-header">
        <h3>Step 5: Configure Study Time</h3>
        <p>Set your available daily study hours and target completion date</p>
      </div>

      {/* Study Mode Selection */}
      <div className="mode-selector">
        <button
          className={`mode-btn ${studyMode === 'simple' ? 'active' : ''}`}
          onClick={() => setStudyMode('simple')}
        >
          📊 Simple (Total Hours)
        </button>
        <button
          className={`mode-btn ${studyMode === 'custom' ? 'active' : ''}`}
          onClick={() => setStudyMode('custom')}
        >
          ⏰ Custom (Schedule)
        </button>
      </div>

      {/* Simple Mode */}
      {studyMode === 'simple' && (
        <div className="mode-content">
          <div className="input-section">
            <label>Daily Available Study Hours</label>
            <div className="time-input-group">
              <input
                type="number"
                min="0.5"
                max="24"
                step="0.5"
                value={hours}
                onChange={(e) => setHours(Number(e.target.value))}
                className="modern-input"
              />
              <span className="unit">hours/day</span>
            </div>
            <p className="input-hint">
              Examples: 3 (moderate), 4 (average), 5+ (intense)
            </p>
          </div>

          {/* Quick Presets */}
          <div className="preset-buttons">
            <p className="preset-label">Quick Presets:</p>
            {[2, 3, 4, 5, 6].map((preset) => (
              <button
                key={preset}
                className={`preset-btn ${hours === preset ? 'active' : ''}`}
                onClick={() => setHours(preset)}
              >
                {preset}h
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Custom Schedule Mode */}
      {studyMode === 'custom' && (
        <div className="mode-content">
          <p className="schedule-label">Allocate study time across the day:</p>
          <div className="schedule-grid">
            {[
              { key: 'morning', label: '🌅 Morning', hint: '6 AM - 12 PM' },
              { key: 'afternoon', label: '☀️ Afternoon', hint: '12 PM - 5 PM' },
              { key: 'evening', label: '🌙 Evening', hint: '5 PM - 10 PM' },
            ].map(({ key, label, hint }) => (
              <div key={key} className="schedule-input">
                <label>{label}</label>
                <p className="time-hint">{hint}</p>
                <div className="time-input-group">
                  <input
                    type="number"
                    min="0"
                    max="8"
                    step="0.5"
                    value={schedule[key]}
                    onChange={(e) =>
                      setSchedule({
                        ...schedule,
                        [key]: Number(e.target.value),
                      })
                    }
                    className="modern-input"
                  />
                  <span className="unit">h</span>
                </div>
              </div>
            ))}
          </div>

          <div className="schedule-summary">
            <p className="summary-text">
              Total: <strong>{getTotalScheduleHours()}</strong> hours/day
            </p>
          </div>
        </div>
      )}

      {/* Days/Date Selection */}
      <div className="deadline-section premium-card">
        <div className="deadline-tabs">
          <button
            className={`deadline-tab ${!useDate ? 'active' : ''}`}
            onClick={() => setUseDate(false)}
          >
            📅 Days to Complete
          </button>
          <button
            className={`deadline-tab ${useDate ? 'active' : ''}`}
            onClick={() => setUseDate(true)}
          >
            📆 Target Date
          </button>
        </div>

        {!useDate ? (
          <div className="deadline-content">
            <label>Number of Days</label>
            <div className="time-input-group">
              <input
                type="number"
                min="1"
                value={days}
                onChange={(e) => setDays(Number(e.target.value))}
                className="modern-input"
              />
              <span className="unit">days</span>
            </div>
            <p className="input-hint">
              Estimated completion: <strong>{getEstimatedCompletionDate()}</strong>
            </p>
          </div>
        ) : (
          <div className="deadline-content">
            <label>Target Completion Date</label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => {
                setSelectedDate(e.target.value);
                // Calculate days from today
                if (e.target.value) {
                  const today = new Date();
                  const target = new Date(e.target.value);
                  const diffTime = target - today;
                  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                  setDays(Math.max(1, diffDays));
                }
              }}
              className="modern-input date-input"
            />
          </div>
        )}
      </div>

      {/* Timeline Summary */}
      <div className="timeline-summary premium-card">
        <div className="summary-row">
          <span className="label">📚 Total Backlog</span>
          <span className="value">--</span>
        </div>
        <div className="summary-row">
          <span className="label">⏱️ Daily Study Time</span>
          <span className="value">
            {studyMode === 'simple'
              ? `${hours}h`
              : `${getTotalScheduleHours()}h`}
          </span>
        </div>
        <div className="summary-row">
          <span className="label">📅 Timeline</span>
          <span className="value">{days} days</span>
        </div>
        <div className="summary-row target-row">
          <span className="label">🎯 Target Completion</span>
          <span className="value">{getEstimatedCompletionDate()}</span>
        </div>
      </div>

      <button
        className="btn-primary w-100 mt-20 glow-button"
        onClick={handleNext}
      >
        Proceed to Plan Generation
      </button>
    </div>
  );
};

export default StudyTimeStep;
