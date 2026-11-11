import './ClassSelectionStep.css';

const ClassSelectionStep = ({ selectedClass, onComplete }) => {
  const classOptions = [
    { id: '11', label: 'Class 11', emoji: '📚' },
    { id: '12', label: 'Class 12', emoji: '📖' },
    { id: '11+12', label: 'Class 11 + 12', emoji: '📚📖' },
  ];

  const handleSelect = (classId) => {
    onComplete({ selectedClass: classId });
  };

  return (
    <div className="step-container class-selection-step fade-in-anim">
      <div className="step-header">
        <h3>Step 1: What class is your backlog from?</h3>
        <p>Select the class(es) your pending lectures belong to</p>
      </div>

      <div className="class-options-grid">
        {classOptions.map((option) => (
          <div
            key={option.id}
            className={`class-option-card premium-card ${
              selectedClass === option.id ? 'selected' : ''
            }`}
            onClick={() => handleSelect(option.id)}
          >
            <span className="class-emoji">{option.emoji}</span>
            <h4>{option.label}</h4>
            {option.id === '11+12' && (
              <p className="card-hint">Maintain separate backlogs for each class</p>
            )}
          </div>
        ))}
      </div>

      {selectedClass && (
        <div className="selection-summary">
          <p className="summary-text">
            ✓ Selected: <strong>{classOptions.find(o => o.id === selectedClass)?.label}</strong>
          </p>
        </div>
      )}
    </div>
  );
};

export default ClassSelectionStep;
