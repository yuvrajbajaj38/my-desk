import { useState } from 'react';
import './ChapterSelectionStep.css';
import { getCurriculumForClass } from '../../services/backlogservice';

const ChapterSelectionStep = ({
  selectedClass,
  selectedSubjects,
  selectedChapters,
  onComplete,
}) => {
  const [localChapters, setLocalChapters] = useState(selectedChapters || []);
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedSubject, setExpandedSubject] = useState(selectedSubjects[0]);

  const getChaptersForSubject = (subject) => {
    const classData = getCurriculumForClass(selectedClass);

    if (subject === 'chemistry' && classData.chemistry) {
      return classData.chemistry;
    }

    return classData[subject] || [];
  };

  const handleSelectChapter = (chapter) => {
    setLocalChapters((prev) => {
      const exists = prev.find((c) => c.id === chapter.id);
      if (exists) {
        return prev.filter((c) => c.id !== chapter.id);
      }
      return [
        ...prev,
        {
          ...chapter,
          pendingLectures: 0,
          lectureDuration: 60,
        },
      ];
    });
  };

  const handleSelectAll = (subject) => {
    const chapters = getChaptersForSubject(subject);
    let chaptersList = [];
    if (subject === 'chemistry' && typeof chapters === 'object' && !Array.isArray(chapters)) {
      Object.values(chapters).forEach((branchChapters) => {
        chaptersList = chaptersList.concat(branchChapters);
      });
    } else {
      chaptersList = chapters;
    }

    const allIds = chaptersList.map((c) => c.id);
    const allSelected = allIds.every((id) =>
      localChapters.find((c) => c.id === id)
    );

    if (allSelected) {
      setLocalChapters((prev) =>
        prev.filter((c) => !allIds.includes(c.id))
      );
    } else {
      setLocalChapters((prev) => {
        const newChapters = [...prev];
        chaptersList.forEach((ch) => {
          if (!newChapters.find((c) => c.id === ch.id)) {
            newChapters.push({
              ...ch,
              pendingLectures: 0,
              lectureDuration: 60,
            });
          }
        });
        return newChapters;
      });
    }
  };

  const handleNext = () => {
    if (localChapters.length === 0) {
      alert('Please select at least one chapter');
      return;
    }
    onComplete({ chapters: localChapters });
  };

  return (
    <div className="step-container chapter-selection-step fade-in-anim">
      <div className="step-header">
        <h3>Step 3: Select Chapters & Topics</h3>
        <p>Choose which chapters you have pending lectures in</p>
      </div>

      {/* Search Bar */}
      <div className="search-container">
        <input
          type="text"
          className="search-input"
          placeholder="🔍 Search chapters..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {/* Subject Tabs and Chapters */}
      <div className="chapters-container">
        {/* Subject Tabs */}
        <div className="subject-tabs">
          {selectedSubjects.map((subject) => (
            <button
              key={subject}
              className={`subject-tab ${expandedSubject === subject ? 'active' : ''}`}
              onClick={() => setExpandedSubject(subject)}
            >
              {subject.charAt(0).toUpperCase() + subject.slice(1)}
            </button>
          ))}
        </div>

        {/* Chapters List */}
        <div className="chapters-list-container">
          {selectedSubjects.map((subject) => {
            if (expandedSubject !== subject && !searchTerm) return null;

            const chapters = getChaptersForSubject(subject);
            let chaptersList = [];
            let branches = null;

            if (
              subject === 'chemistry' &&
              typeof chapters === 'object' &&
              !Array.isArray(chapters)
            ) {
              branches = Object.entries(chapters);
            } else {
              chaptersList = chapters;
            }

            return (
              <div key={subject} className="subject-chapters-section">
                {branches ? (
                  // Chemistry with branches
                  <>
                    {branches.map(([branchName, branchChapters]) => {
                      const branchChapterIds = branchChapters.map((c) => c.id);
                      const allBranchSelected = branchChapterIds.every((id) =>
                        localChapters.find((c) => c.id === id)
                      );

                      return (
                        <div key={branchName} className="chemistry-branch">
                          <div className="branch-header">
                            <h4>
                              {branchName
                                .split('-')
                                .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
                                .join(' ')}{' '}
                              Chemistry
                            </h4>
                            <button
                              className="select-all-btn"
                              onClick={() => {
                                const allIds = branchChapters.map((c) => c.id);
                                const allSelected = allIds.every((id) =>
                                  localChapters.find((c) => c.id === id)
                                );

                                if (allSelected) {
                                  setLocalChapters((prev) =>
                                    prev.filter((c) => !allIds.includes(c.id))
                                  );
                                } else {
                                  setLocalChapters((prev) => {
                                    const newChapters = [...prev];
                                    branchChapters.forEach((ch) => {
                                      if (!newChapters.find((c) => c.id === ch.id)) {
                                        newChapters.push({
                                          ...ch,
                                          pendingLectures: 0,
                                          lectureDuration: 60,
                                        });
                                      }
                                    });
                                    return newChapters;
                                  });
                                }
                              }}
                            >
                              {allBranchSelected ? '✓ Deselect All' : '+ Select All'}
                            </button>
                          </div>

                          <div className="chapters-grid">
                            {branchChapters
                              .filter((ch) =>
                                searchTerm === '' ||
                                ch.name.toLowerCase().includes(searchTerm.toLowerCase())
                              )
                              .map((chapter) => {
                                const isSelected = localChapters.find(
                                  (c) => c.id === chapter.id
                                );
                                return (
                                  <div
                                    key={chapter.id}
                                    className={`chapter-card ${isSelected ? 'selected' : ''}`}
                                    onClick={() => handleSelectChapter(chapter)}
                                  >
                                    <div className="chapter-checkbox">
                                      {isSelected && <span>✓</span>}
                                    </div>
                                    <div className="chapter-text">
                                      <p className="chapter-name">{chapter.name}</p>
                                    </div>
                                  </div>
                                );
                              })}
                          </div>
                        </div>
                      );
                    })}
                  </>
                ) : (
                  // Regular subject chapters
                  <>
                    <div className="branch-header">
                      <h4>{subject.charAt(0).toUpperCase() + subject.slice(1)}</h4>
                      <button
                        className="select-all-btn"
                        onClick={() => handleSelectAll(subject)}
                      >
                        + Select All
                      </button>
                    </div>
                    {(subject === 'mathematics'
                      ? [
                        {
                          label: 'Mathematics',
                          chapters: chaptersList.filter((chapter) =>
                            !['Circle', 'Parabola', 'Ellipse', 'Hyperbola'].includes(chapter.name)
                          ),
                        },
                        {
                          label: 'Conic Sections',
                          chapters: chaptersList.filter((chapter) =>
                            ['Circle', 'Parabola', 'Ellipse', 'Hyperbola'].includes(chapter.name)
                          ),
                        },
                      ]
                      : [{ label: subject.charAt(0).toUpperCase() + subject.slice(1), chapters: chaptersList }]
                    ).map(({ label, chapters: groupedChapters }) => {
                      const visibleChapters = groupedChapters.filter((chapter) =>
                        searchTerm === '' ||
                        chapter.name.toLowerCase().includes(searchTerm.toLowerCase())
                      );

                      if (visibleChapters.length === 0) return null;

                      return (
                        <div key={label} className="subject-chapters-section">
                          {subject === 'mathematics' && <div className="branch-header"><h4>{label}</h4></div>}
                          <div className="chapters-grid">
                            {visibleChapters.map((chapter) => {
                              const isSelected = localChapters.find(
                                (c) => c.id === chapter.id
                              );
                              return (
                                <div
                                  key={chapter.id}
                                  className={`chapter-card ${isSelected ? 'selected' : ''}`}
                                  onClick={() => handleSelectChapter(chapter)}
                                >
                                  <div className="chapter-checkbox">
                                    {isSelected && <span>✓</span>}
                                  </div>
                                  <div className="chapter-text">
                                    <p className="chapter-name">{chapter.name}</p>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Selection Summary */}
      <div className="selection-summary">
        <p className="summary-text">
          Selected: <strong>{localChapters.length}</strong> chapter(s)
        </p>
        {localChapters.length > 0 && (
          <div className="selected-chapters-list">
            {localChapters.map((ch) => (
              <span key={ch.id} className="chapter-tag">
                {ch.name}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleSelectChapter(ch);
                  }}
                >
                  ✕
                </button>
              </span>
            ))}
          </div>
        )}
      </div>

      <button
        className="btn-primary w-100 mt-20"
        onClick={handleNext}
        disabled={localChapters.length === 0}
      >
        Continue with {localChapters.length} Chapter{localChapters.length !== 1 ? 's' : ''}
      </button>
    </div>
  );
};

export default ChapterSelectionStep;
