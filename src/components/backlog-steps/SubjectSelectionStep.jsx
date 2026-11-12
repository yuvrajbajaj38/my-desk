import { useState } from 'react';
import './SubjectSelectionStep.css';

const SubjectSelectionStep = ({ selectedSubjects, onComplete }) => {
  const [localSubjects, setLocalSubjects] = useState(selectedSubjects || []);

  const subjectOptions = [
    { id: 'physics', label: 'Physics', emoji: '⚛️' },
    { id: 'chemistry', label: 'Chemistry', emoji: '🧪' },
    { id: 'mathematics', label: 'Mathematics', emoji: '📐' },
  ];

  const handleSubjectToggle = (subjectId) => {
    setLocalSubjects((prev) => {
      const isSelected = prev.includes(subjectId);
      if (isSelected) {
        return prev.filter((s) => s !== subjectId);
      }
      return [...prev, subjectId];
    });
  };

  const handleNext = () => {
    if (localSubjects.length === 0) {
      alert('Please select at least one subject');
      return;
    }
    onComplete({ subjects: localSubjects });
  };

  return (
    <div className="step-container subject-selection-step fade-in-anim">
      <div className="step-header">
        <h3>Step 2: Select Subjects</h3>
        <p>Choose which subjects you have pending backlog in</p>
      </div>

      <div className="subjects-grid">
        {subjectOptions.map((subject) => (
          <div
            key={subject.id}
            className={`subject-card premium-card ${
              localSubjects.includes(subject.id) ? 'selected' : ''
            }`}
            onClick={() => handleSubjectToggle(subject.id)}
          >
            <span className="subject-emoji">{subject.emoji}</span>
            <h4>{subject.label}</h4>
            {subject.id === 'chemistry' && (
              <p className="card-hint">Physical • Organic • Inorganic</p>
            )}
            <div className="selection-checkbox">
              {localSubjects.includes(subject.id) && <span>✓</span>}
            </div>
          </div>
        ))}
      </div>

      <div className="selection-summary">
        <p className="summary-text">
          Selected: <strong>{localSubjects.length}</strong> subject(s)
        </p>
        {localSubjects.length > 0 && (
          <div className="selected-subjects-list">
            {localSubjects.map((s) => (
              <span key={s} className="subject-tag">
                {subjectOptions.find((so) => so.id === s)?.label}
              </span>
            ))}
          </div>
        )}
      </div>

      <button
        className="btn-primary w-100 mt-20"
        onClick={handleNext}
        disabled={localSubjects.length === 0}
      >
        Continue with {localSubjects.length} Subject{localSubjects.length !== 1 ? 's' : ''}
      </button>
    </div>
  );
};

export default SubjectSelectionStep;
