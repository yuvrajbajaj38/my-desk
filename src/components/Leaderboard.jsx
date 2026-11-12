import { useEffect, useState } from 'react';
import './Leaderboard.css';
import { getPublicLeaderboard } from '../services/leaderboardservice';

const Leaderboard = ({ onBack, userProfile }) => {
  const [rows, setRows] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        setRows(await getPublicLeaderboard());
      } catch (err) {
        setError(err.message || 'Leaderboard is unavailable.');
      }
    };
    load();
  }, []);

  const top = rows.slice(0, 3);
  const rest = rows.slice(3);

  return (
    <div className="sub-dashboard leaderboard-page fade-in-anim">
      <button className="back-home-tab-btn" onClick={onBack}>← Back to Dashboard</button>

      <div className="leaderboard-header">
        <h2>🌍 Global <span className="highlight-brand">Peer Leaderboard</span></h2>
        <p>Ranks come from stored XP. This list stays empty until the server publishes publicLeaderboard entries.</p>
      </div>

      {error && <p>{error}</p>}

      {!rows.length && (
        <div className="premium-card" style={{ padding: '24px', marginBottom: '24px' }}>
          <h3>No published ranks yet</h3>
          <p>Your current XP: {(userProfile?.totalXP || 0).toLocaleString()}. Complete tests so the backend can assign a global rank.</p>
        </div>
      )}

      {top.length > 0 && (
        <div className="podium-section">
          {top.map((entry) => (
            <div className={`podium-box rank-${entry.rank}`} key={entry.id}>
              <div className="avatar">{entry.displayName?.[0] || 'R'}</div>
              <h4>{entry.displayName || 'Student'}</h4>
              <p className="xp-text">{Number(entry.xp || 0).toLocaleString()} XP</p>
              <div className={`podium-step step-${entry.rank}`}>{entry.rank}</div>
            </div>
          ))}
        </div>
      )}

      <div className="rank-list-container">
        <h3>Your standing</h3>
        <div className="rank-row current-user-row">
          <div className="rank-num">{userProfile?.globalRank || '—'}</div>
          <div className="rank-name">{userProfile?.name || 'You'}</div>
          <div className="rank-xp">{(userProfile?.totalXP || 0).toLocaleString()} XP</div>
        </div>
        {rest.map((entry) => (
          <div className="rank-row" key={entry.id}>
            <div className="rank-num">{entry.rank}</div>
            <div className="rank-name">{entry.displayName}</div>
            <div className="rank-xp">{Number(entry.xp || 0).toLocaleString()} XP</div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Leaderboard;
