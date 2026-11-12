import { useState, useEffect } from "react";
import "./BacklogPlanner.css";
import { useAuth } from "../hooks/useAuth";
import {
  calculateBacklogPlan,
  saveBacklogPlan,
  getBacklogPlan,
  recalculateAfterMissedDays,
} from "../services/backlogservice";

// Step Components
import ClassSelectionStep from "./backlog-steps/ClassSelectionStep";
import SubjectSelectionStep from "./backlog-steps/SubjectSelectionStep";
import ChapterSelectionStep from "./backlog-steps/ChapterSelectionStep";
import BacklogInputStep from "./backlog-steps/BacklogInputStep";
import StudyTimeStep from "./backlog-steps/StudyTimeStep";
import BacklogDashboard from "./backlog-steps/BacklogDashboard";

const BacklogPlanner = ({ onBack }) => {
  const { user } = useAuth();
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(true);

  // Backlog data state
  const [backlogData, setBacklogData] = useState({
    id: "current",
    selectedClass: null, // "11", "12", or "11+12"
    subjects: [], // Array of selected subjects
    chapters: [], // Array of selected chapters with lecture count
    dailyStudyHours: 4,
    studySchedule: null, // { morning, afternoon, evening } or null for simple hours
    targetDays: 30,
    targetDate: null,
    dailyPlan: [],
    createdAt: null,
  });

  // Load existing plan on mount
  useEffect(() => {
    const loadExistingPlan = async () => {
      if (!user?.uid) return;
      setLoading(true);
      try {
        const result = await getBacklogPlan(user.uid);
        if (result.success && result.data) {
          setBacklogData(result.data);
          setCurrentStep(6); // Jump to dashboard if plan exists
        }
      } catch (error) {
        console.error("Error loading existing plan:", error);
      } finally {
        setLoading(false);
      }
    };

    loadExistingPlan();
  }, [user?.uid]);

  if (loading) {
    return (
      <div className="sub-dashboard backlog-page fade-in-anim">
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Loading Backlog Planner...</p>
        </div>
      </div>
    );
  }

  const handleStepComplete = (stepData) => {
    const updatedData = { ...backlogData, ...stepData };
    setBacklogData(updatedData);

    if (currentStep < 6) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleGeneratePlan = async () => {
    if (!backlogData.chapters || backlogData.chapters.length === 0) {
      alert("Please add chapters to your backlog!");
      return;
    }

    const result = calculateBacklogPlan({
      chapters: backlogData.chapters,
      dailyStudyHours: backlogData.dailyStudyHours,
      targetDays: backlogData.targetDays,
      selectedClass: backlogData.selectedClass,
    });

    if (result.error) {
      alert(`Error: ${result.error}`);
      return;
    }

    if (result.warning) {
      const proceed = window.confirm(
        `⚠️ ${result.message}\n\nWould you like to proceed anyway or adjust your plan?`
      );
      if (!proceed) return;
    }

    const planWithData = {
      ...backlogData,
      dailyPlan: result.dailyPlan,
      createdAt: new Date().toISOString(),
    };

    setBacklogData(planWithData);

    // Save to Firebase
    if (user?.uid) {
      try {
        await saveBacklogPlan(user.uid, planWithData);
      } catch (error) {
        console.error("Error saving plan:", error);
      }
    }

    setCurrentStep(6);
  };

  const handleNavigateToStep = (step) => {
    if (step < currentStep || (step === 6 && backlogData.dailyPlan?.length > 0)) {
      setCurrentStep(step);
    }
  };

  const handleStartOver = () => {
    if (
      window.confirm(
        "Are you sure? This will clear your current backlog plan and start fresh."
      )
    ) {
      setBacklogData({
        id: "current",
        selectedClass: null,
        subjects: [],
        chapters: [],
        dailyStudyHours: 4,
        studySchedule: null,
        targetDays: 30,
        targetDate: null,
        dailyPlan: [],
        createdAt: null,
      });
      setCurrentStep(1);
    }
  };

  return (
    <div className="sub-dashboard backlog-planner-page fade-in-anim">
      <button className="back-home-tab-btn" onClick={onBack}>
        ← Back to Dashboard
      </button>

      <div className="backlog-planner-header">
        <h2>
          📅 AI <span className="highlight-green">Backlog Planner</span>
        </h2>
        <p>Build your personalized daily backlog completion plan</p>
      </div>

      {/* Progress Indicator */}
      {currentStep < 6 && (
        <div className="step-progress">
          {[1, 2, 3, 4, 5].map((step) => (
            <div
              key={step}
              className={`step-indicator ${
                step <= currentStep ? "active" : ""
              } ${step === currentStep ? "current" : ""}`}
              onClick={() => handleNavigateToStep(step)}
            >
              <span className="step-number">{step}</span>
              <span className="step-label">
                {[
                  "Class",
                  "Subjects",
                  "Chapters",
                  "Backlog",
                  "Study Time",
                ][step - 1]}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Step Content */}
      <div className="step-content">
        {currentStep === 1 && (
          <ClassSelectionStep
            selectedClass={backlogData.selectedClass}
            onComplete={handleStepComplete}
          />
        )}

        {currentStep === 2 && (
          <SubjectSelectionStep
            selectedClass={backlogData.selectedClass}
            selectedSubjects={backlogData.subjects}
            onComplete={handleStepComplete}
          />
        )}

        {currentStep === 3 && (
          <ChapterSelectionStep
            selectedClass={backlogData.selectedClass}
            selectedSubjects={backlogData.subjects}
            selectedChapters={backlogData.chapters}
            onComplete={handleStepComplete}
          />
        )}

        {currentStep === 4 && (
          <BacklogInputStep
            selectedChapters={backlogData.chapters}
            onComplete={handleStepComplete}
          />
        )}

        {currentStep === 5 && (
          <StudyTimeStep
            dailyStudyHours={backlogData.dailyStudyHours}
            studySchedule={backlogData.studySchedule}
            targetDays={backlogData.targetDays}
            targetDate={backlogData.targetDate}
            onComplete={handleStepComplete}
            onGeneratePlan={handleGeneratePlan}
          />
        )}

        {currentStep === 6 && (
          <BacklogDashboard
            backlogData={backlogData}
            onStartOver={handleStartOver}
            onEditStep={(step) => handleNavigateToStep(step)}
            onReschedule={async (missedDays) => {
              const result = recalculateAfterMissedDays(
                backlogData.dailyPlan || [],
                Number(missedDays) || 1,
                backlogData.dailyStudyHours
              );
              if (result.error) {
                alert(result.error);
                return;
              }
              if (!result.newPlan) {
                alert(result.message || "Nothing to reschedule.");
                return;
              }
              const next = { ...backlogData, dailyPlan: result.newPlan };
              setBacklogData(next);
              if (user?.uid) await saveBacklogPlan(user.uid, next);
            }}
          />
        )}
      </div>

      {/* Action Buttons */}
      {currentStep < 6 && (
        <div className="step-actions">
          {currentStep > 1 && (
            <button
              className="btn-secondary"
              onClick={() => setCurrentStep(currentStep - 1)}
            >
              ← Previous
            </button>
          )}
          {currentStep < 5 && (
            <button
              className="btn-primary"
              onClick={() => setCurrentStep(currentStep + 1)}
            >
              Next →
            </button>
          )}
          {currentStep === 5 && (
            <button className="btn-primary glow-button" onClick={handleGeneratePlan}>
              Generate AI Plan 🪄
            </button>
          )}
        </div>
      )}

      {currentStep === 6 && (
        <div className="step-actions">
          <button className="btn-secondary" onClick={handleStartOver}>
            ↺ Start Over
          </button>
          <button className="btn-primary" onClick={() => setCurrentStep(4)}>
            ✎ Edit Backlog
          </button>
        </div>
      )}
    </div>
  );
};

export default BacklogPlanner;
