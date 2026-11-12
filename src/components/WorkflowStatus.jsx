const WorkflowStatus = ({ title, message, onRetry, onBack, loading = false }) => (
  <div className="cbt-prep-screen fade-in-anim">
    <div className="prep-card">
      <div className="prep-badge">{loading ? "Working" : "Needs attention"}</div>
      <h2>{title}</h2>
      <p>{message}</p>
      <div style={{ display: "flex", gap: "12px", justifyContent: "center", flexWrap: "wrap" }}>
        {onBack && (
          <button type="button" className="btn-secondary" onClick={onBack}>
            Go Back
          </button>
        )}
        {onRetry && (
          <button type="button" className="btn-primary cbt-action-btn" onClick={onRetry}>
            Retry
          </button>
        )}
      </div>
    </div>
  </div>
);

export default WorkflowStatus;
