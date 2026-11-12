import { lazy, Suspense, useState } from "react";
import "./App.css";
import Navbar from "./components/Navbar";
import Features from "./components/Features";
import Testimonials from "./components/Testimonials";
import Pricing from "./components/Pricing";
import Auth from "./components/Auth";
import WorkflowStatus from "./components/WorkflowStatus";
import { useAuth } from "./hooks/useAuth";
import {
  prepareAiMockQuestions,
  prepareCoachingQuestions,
  prepareNotesAiMock,
  prepareNotesExtract,
} from "./services/testPrepService";

const Checkout = lazy(() => import("./components/Checkout"));
const StudentDashboard = lazy(() => import("./components/StudentDashboard"));
const QuestionBank = lazy(() => import("./components/QuestionBank"));
const Leaderboard = lazy(() => import("./components/Leaderboard"));
const BacklogManager = lazy(() => import("./components/BacklogManager"));
const MockTestSelector = lazy(() => import("./components/MockTestSelector"));
const CoachingTestUpload = lazy(() => import("./components/CoachingTestUpload"));
const AiMockTestSetup = lazy(() => import("./components/AiMockTestSetup"));
const NotesAiTestSetup = lazy(() => import("./components/NotesAiTestSetup"));
const CBTTest = lazy(() => import("./components/CBTTest"));
const TestResult = lazy(() => import("./components/TestResult"));
const ExtractedQuestions = lazy(() => import("./components/ExtractedQuestions"));
const AdminPanel = lazy(() => import("./components/AdminPanel"));

const PageFallback = () => (
  <div className="page-transition" style={{ minHeight: "40vh", display: "grid", placeItems: "center", color: "#fff" }}>
    Loading...
  </div>
);

function App() {
  const { user, userProfile, loading, profileLoading, profileError, logout, refreshProfile } = useAuth();
  const [showAuth, setShowAuth] = useState(false);
  const [activeTab, setActiveTab] = useState("home");
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [coachingConfig, setCoachingConfig] = useState({
    testFile: null,
    examPattern: null,
    advancedPaper: null,
    testDurationMinutes: null,
    verificationMethod: null,
    answerKeyFile: null,
  });
  const [aiMockConfig, setAiMockConfig] = useState({
    examPattern: "jee-main",
    advancedPaper: null,
    testDurationMinutes: 90,
    difficulty: "moderate",
    totalQuestions: 30,
    verificationMethod: "ai-generated",
    questionSource: "ai-mock",
  });
  const [notesConfig, setNotesConfig] = useState({
    noteFiles: [],
    examPattern: "jee-main",
    advancedPaper: null,
    testDurationMinutes: 90,
    verificationMethod: "notes-ai",
    questionSource: "notes-ai",
    extractMode: "practice-questions",
  });
  const [currentCbtConfig, setCurrentCbtConfig] = useState({});
  const [activeQuestions, setActiveQuestions] = useState([]);
  const [extractedQuestions, setExtractedQuestions] = useState([]);
  const [activeTestJourney, setActiveTestJourney] = useState("coaching");
  const [cbtResult, setCbtResult] = useState(null);
  const [prepState, setPrepState] = useState({ loading: false, error: "", retry: null });

  const [liveProgress] = useState("-- %");
  const [predictedRank] = useState("Not Tested");
  const [aiRec] = useState("Take a mock test to unlock");

  const runPrep = async (label, job, onSuccess) => {
    setPrepState({ loading: true, error: "", retry: null });
    try {
      const result = await job();
      setPrepState({ loading: false, error: "", retry: null });
      onSuccess(result);
    } catch (error) {
      setPrepState({
        loading: false,
        error: error.message || `${label} failed.`,
        retry: () => runPrep(label, job, onSuccess),
      });
    }
  };

  if (loading) {
    return (
      <div className="page-transition" style={{ minHeight: "100vh", display: "grid", placeItems: "center", color: "#fff" }}>
        Loading RankWorld AI...
      </div>
    );
  }

  if (!user && showAuth) {
    return (
      <div className="page-transition">
        <button className="go-back-btn" onClick={() => setShowAuth(false)}>
          ← Back
        </button>
        <Auth
          onLoginSuccess={() => {
            setShowAuth(false);
            setActiveTab("student-dashboard");
          }}
        />
      </div>
    );
  }

  const handleCheckout = (planType) => {
    setSelectedPlan(planType);
    setActiveTab("checkout");
  };

  const launchCbt = (journey, config, questions) => {
    setActiveTestJourney(journey);
    setCurrentCbtConfig(config);
    setActiveQuestions(questions);
    setActiveTab("cbt-test");
  };

  const renderDashboardContent = () => {
    if (prepState.loading) {
      return (
        <WorkflowStatus
          loading
          title="Preparing your questions"
          message="Validating files, checking cache, and generating or extracting questions."
        />
      );
    }

    if (prepState.error) {
      return (
        <WorkflowStatus
          title="This step could not be completed"
          message={prepState.error}
          onBack={() => setPrepState({ loading: false, error: "", retry: null })}
          onRetry={prepState.retry}
        />
      );
    }

    const tab = user && activeTab === "home" ? "student-dashboard" : activeTab;

    switch (tab) {
      case "admin":
        return userProfile?.role === "admin" ? <AdminPanel onBack={() => setActiveTab("student-dashboard")} /> : <div className="sub-dashboard"><h2>Access denied</h2><p>Administrator permissions are required.</p><button onClick={() => setActiveTab("student-dashboard")}>Back</button></div>;
      case "student-dashboard":
        return (
          <StudentDashboard
            onLogout={async () => {
              try {
                await logout();
                setActiveTab("home");
              } catch (error) {
                console.error("Logout failed:", error);
              }
            }}
            onNavigate={setActiveTab}
            userProfile={userProfile}
            profileLoading={profileLoading}
            profileError={profileError}
          />
        );
      case "qbank":
        return <QuestionBank onBack={() => setActiveTab("student-dashboard")} onLaunchPractice={(questions, config) => launchCbt("question-bank", config, questions)} />;
      case "leaderboard":
        return <Leaderboard onBack={() => setActiveTab("student-dashboard")} userProfile={userProfile} />;
      case "backlog-manager":
        return <BacklogManager onBack={() => setActiveTab("student-dashboard")} />;
      case "ai-notes":
      case "notes-ai-test":
        return (
          <NotesAiTestSetup
            onBack={() => setActiveTab("student-dashboard")}
            notesConfig={notesConfig}
            setNotesConfig={setNotesConfig}
            onProceedToTest={(config) => {
              setNotesConfig(config);
              if (config.extractMode === "practice-questions") {
                runPrep("Notes extraction", () => prepareNotesExtract(config, user?.uid), ({ questions, artifactId }) => {
                  setExtractedQuestions(questions);
                  setNotesConfig((prev) => ({ ...prev, artifactId }));
                  setActiveTab("extracted-questions");
                });
                return;
              }

              runPrep("Notes AI mock", () => prepareNotesAiMock(config, user?.uid), ({ questions, artifactId }) => {
                launchCbt("notes-ai", { ...config, artifactId }, questions);
              });
            }}
          />
        );
      case "extracted-questions":
        return (
          <ExtractedQuestions
            questions={extractedQuestions}
            onBack={() => setActiveTab("notes-ai-test")}
            onStartTest={() => launchCbt("notes-extract", { ...notesConfig, testDurationMinutes: notesConfig.testDurationMinutes || 30 }, extractedQuestions)}
          />
        );
      case "mock-tests":
        return (
          <MockTestSelector
            onBack={() => setActiveTab("student-dashboard")}
            onSelectMode={(mode) => {
              if (mode === "coaching") setActiveTab("coaching-test");
              else if (mode === "ai-mock") setActiveTab("ai-mock-test");
            }}
          />
        );
      case "coaching-test":
        return (
          <CoachingTestUpload
            onBack={() => setActiveTab("mock-tests")}
            onProceedToTest={(mode, config) => {
              setCoachingConfig(config);
              runPrep("Coaching PDF parse", () => prepareCoachingQuestions(config, user?.uid), ({ questions, artifactId }) => {
                launchCbt(mode || "coaching", { ...config, artifactId }, questions);
              });
            }}
            coachingConfig={coachingConfig}
            setCoachingConfig={setCoachingConfig}
          />
        );
      case "ai-mock-test":
        return (
          <AiMockTestSetup
            onBack={() => setActiveTab("mock-tests")}
            mockConfig={aiMockConfig}
            setMockConfig={setAiMockConfig}
            onProceedToTest={(config) => {
              setAiMockConfig(config);
              runPrep("AI mock generation", () => prepareAiMockQuestions(config, user?.uid), ({ questions, artifactId }) => {
                launchCbt("ai-mock", { ...config, artifactId }, questions);
              });
            }}
          />
        );
      case "cbt-test":
        return (
          <CBTTest
            testConfig={currentCbtConfig}
            questions={activeQuestions}
            onBack={() => {
              if (activeTestJourney === "coaching") setActiveTab("coaching-test");
              else if (activeTestJourney === "ai-mock") setActiveTab("ai-mock-test");
              else if (activeTestJourney === "question-bank") setActiveTab("qbank");
              else setActiveTab("notes-ai-test");
            }}
            onFinish={(result) => {
              setCbtResult({
                ...result,
                testType: activeTestJourney,
                studyClass: currentCbtConfig.studyClass,
                subject: currentCbtConfig.subject,
                selectedChapters: currentCbtConfig.selectedChapters,
                artifactId: currentCbtConfig.artifactId || null,
              });
              setActiveTab("test-result");
            }}
          />
        );
      case "test-result":
        return (
          <TestResult
            result={cbtResult}
            userId={user?.uid}
            onBack={() => setActiveTab("student-dashboard")}
          />
        );
      case "analytics":
        return (
          <TestResult
            result={cbtResult}
            userId={user?.uid}
            onBack={() => setActiveTab("student-dashboard")}
          />
        );
      case "checkout":
        return <Checkout plan={selectedPlan} onBack={() => setActiveTab("pricing")} />;
      case "pricing":
        return (
          <div style={{ paddingTop: "20px" }}>
            <button className="back-home-tab-btn" style={{ margin: "0 auto 20px auto", display: "block" }} onClick={() => setActiveTab("home")}>← Back to Home</button>
            <Pricing onCheckout={handleCheckout} onOpenAuth={() => setShowAuth(true)} />
          </div>
        );
      case "about":
        return (
          <div className="sub-dashboard">
            <button className="back-home-tab-btn" onClick={() => setActiveTab("home")}>← Back to Home</button>
            <h2>👑 About RankWorld AI</h2>
            <p>Founded by passionate developers to build the ultimate AI-powered ecosystem for JEE & NEET aspirants.</p>
          </div>
        );
      case "contact":
        return (
          <div className="sub-dashboard">
            <button className="back-home-tab-btn" onClick={() => setActiveTab("home")}>← Back to Home</button>
            <h2>📞 Contact Us & Book Promotions</h2>
            <p>For student support, technical queries, or book publisher promotions, reach out to our team.</p>
          </div>
        );
      case "features":
        return (
          <div style={{ paddingTop: "20px" }}>
            <button className="back-home-tab-btn" style={{ margin: "0 auto 20px auto", display: "block" }} onClick={() => setActiveTab("home")}>← Back to Home</button>
            <Features />
          </div>
        );
      default:
        return (
          <>
            <div className="hero-section">
              <div className="hero-left">
                <div className="hero-badge pulse-anim">
                  <span className="sparkle">✨</span> India's Most Advanced AI Study Platform
                </div>
                <h1 className="hero-title">
                  Crack <span className="highlight-blue">JEE</span> & <span className="highlight-purple">NEET</span><br />
                  with <span className="highlight-brand">RankWorld AI</span>
                </h1>
                <p className="hero-subtitle">
                  AI Mock Tests • AI Notes • Weak Topic Analysis <br />
                  Personalized Study Planner • Rank Prediction
                </p>
                <div className="hero-buttons">
                  <button className="btn-primary glow-button" onClick={() => setShowAuth(true)}>
                    Start Free Trial
                  </button>
                  <button className="btn-secondary float-anim-subtle" onClick={() => setShowAuth(true)}>
                    Login / Signup
                  </button>
                </div>
              </div>
              <div className="hero-right">
                <div className="glow-circle breathe-anim"></div>
                <div className="dashboard-wrapper">
                  <div className="strike-container">
                    <div className="laser-beam"></div>
                    <div className="impact-flash"></div>
                  </div>
                  <div className="dashboard-platform">
                    <div className="platform-top"></div>
                    <div className="platform-base"></div>
                  </div>
                  <div className="dashboard-card cinematic-dashboard">
                    <div className="dash-header">AI Dashboard</div>
                    <div className="dash-box">
                      <p style={{ fontSize: "0.75rem", color: "#94a3b8" }}>AI Accuracy of Test Making by RankVault</p>
                      <h3>98.6%</h3>
                      <div className="progress-bar"><div className="fill fill-anim"></div></div>
                    </div>
                    <div className="dash-stats">
                      <div className="stat card-hover-anim">
                        <p style={{ fontSize: "0.7rem", color: "#94a3b8" }}>Live Progress of Student</p>
                        <h4>{liveProgress}</h4>
                      </div>
                      <div className="stat card-hover-anim">
                        <p style={{ fontSize: "0.7rem", color: "#94a3b8" }}>Predicted Rank of Last Test</p>
                        <h4>{predictedRank}</h4>
                      </div>
                    </div>
                    <div className="ai-recommendation card-hover-anim">
                      <div className="rec-icon pulse-anim">⚛️</div>
                      <div className="rec-text">
                        <p>AI Recommendation</p>
                        <h5>{aiRec}</h5>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <Features />
            <Testimonials />
            <Pricing onCheckout={handleCheckout} onOpenAuth={() => setShowAuth(true)} />
          </>
        );
    }
  };

  return (
    <div className="app-container page-transition">
      <Navbar setActiveTab={setActiveTab} onOpenAuth={() => setShowAuth(true)} isAdmin={userProfile?.role === "admin"} />
      <div className="main-content-area">
        <Suspense fallback={<PageFallback />}>
          {renderDashboardContent()}
        </Suspense>
      </div>
      <footer className="footer">
        <p>© 2026 RankWorld AI. All rights reserved.</p>
      </footer>
    </div>
  );
}

export default App;
