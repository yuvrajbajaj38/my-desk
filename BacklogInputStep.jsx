import { useState } from 'react';
import './BacklogInputStep.css';

const BacklogInputStep = ({ selectedChapters, onComplete }) => {
  const [chapters, setChapters] = useState(
    selectedChapters.map((ch) => ({
      ...ch,
      pendingLectures: ch.pendingLectures || 0,
      lectureDuration: ch.lectureDuration || 60,
      notes: ch.notes || '',
    }))
  );

  const handleChapterUpdate = (id, field, value) => {
    setChapters((prev) =>
      prev.map((ch) =>
        ch.id === id
          ? { ...ch, [field]: field === 'lectureDuration' || field === 'pendingLectures' ? Number(value) : value }
          : ch
      )
    );
  };

  const handleNext = () => {
    const hasErrors = chapters.some(
      (ch) => ch.pendingLectures <= 0 || ch.lectureDuration <= 0
    );

    if (hasErrors) {
      alert('Please ensure all chapters have valid lecture counts and durations');
      return;
    }

    onComplete({ chapters });
  };

  const calculateTotalHours = () => {
    return chapters.reduce((total, ch) => {
      return total + (ch.pendingLectures * ch.lectureDuration) / 60;
    }, 0);
  };

  return (
    <div className="step-container backlog-input-step fade-in-anim">
      <div className="step-header">
        <h3>Step 4: Enter Backlog Details</h3>
        <p>Specify pending lectures and duration for each chapter</p>
      </div>

      {/* Summary Card */}
      <div className="total-hours-card premium-card">
        <div className="total-stat">
          <span className="total-label">Total Backlog Hours</span>
          <span className="total-value">{calculateTotalHours().toFixed(1)} hrs</span>
        </div>
        <div className="total-chapters">
          <span>{chapters.length}</span>
          <span>Chapters</span>
        </div>
      </div>

      {/* Chapters Input Table */}
      <div className="chapters-input-container">
        {chapters.map((chapter, index) => (
          <div key={chapter.id} className="chapter-input-row premium-card">
            <div className="row-number">{index + 1}</div>

            <div className="chapter-name-col">
              <p className="chapter-name">{chapter.name}</p>
            </div>

            <div className="input-col">
              <label>Pending Lectures</label>
              <input
                type="number"
                min="0"
                value={chapter.pendingLectures || ''}
                onChange={(e) =>
                  handleChapterUpdate(chapter.id, 'pendingLectures', e.target.value)
                }
                placeholder="e.g. 5"
                className="modern-input"
              />
            </div>

            <div className="input-col">
              <label>Duration per Lecture (min)</label>
              <input
                type="number"
                min="15"
                step="15"
                value={chapter.lectureDuration || ''}
                onChange={(e) =>
                  handleChapterUpdate(chapter.id, 'lectureDuration', e.target.value)
                }
                placeholder="e.g. 60"
                className="modern-input"
              />
            </div>

            <div className="total-time-col">
              <span className="total-time">
                {((chapter.pendingLectures * chapter.lectureDuration) / 60).toFixed(1)}h
              </span>
            </div>

            <div className="notes-col">
              <input
                type="text"
                value={chapter.notes || ''}
                onChange={(e) =>
                  handleChapterUpdate(chapter.id, 'notes', e.target.value)
                }
                placeholder="Optional notes"
                className="modern-input"
              />
            </div>
          </div>
        ))}
      </div>

      {/* Input Help Text */}
      <div className="input-help-text">
        <p>💡 <strong>Tip:</strong> Enter realistic numbers. Common lecture durations are 45, 60, 75, or 90 minutes.</p>
      </div>

      <button
        className="btn-primary w-100 mt-20"
        onClick={handleNext}
      >
        Continue to Study Time Setup
      </button>
    </div>
  );
};

export default BacklogInputStep;
