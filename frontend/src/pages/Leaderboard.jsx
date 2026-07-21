import { useEffect, useState } from "react";
import { api } from "../api/client";
import Sidebar from "../components/Sidebar";

export default function Leaderboard() {
  const [leaders, setLeaders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .getLeaderboard()
      .then(setLeaders)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="app-layout">
      <Sidebar />
      <main className="page-main">
        <div className="page-header">
          <span className="section-eyebrow">Compete with fellow sprinters</span>
          <h1>XP Leaderboard</h1>
        </div>

        {loading ? (
          <p className="spinner-text">Loading leaderboard rankings…</p>
        ) : (
          <div className="card">
            <h2>Weekly Top Studiers</h2>
            {leaders.length === 0 ? (
              <p className="empty-state">No rankings available yet. Start studying to claim your spot!</p>
            ) : (
              <div className="leaderboard-table-wrap">
                <table className="leaderboard-table">
                  <thead>
                    <tr>
                      <th style={{ width: "80px", textAlign: "center" }}>Rank</th>
                      <th>User</th>
                      <th style={{ textAlign: "center" }}>Level</th>
                      <th style={{ textAlign: "right" }}>XP</th>
                      <th style={{ textAlign: "center" }}>Streak</th>
                      <th style={{ textAlign: "center" }}>Days Studied</th>
                    </tr>
                  </thead>
                  <tbody>
                    {leaders.map((leader) => {
                      let rankClass = "rank-cell";
                      if (leader.rank === 1) rankClass += " rank-gold";
                      else if (leader.rank === 2) rankClass += " rank-silver";
                      else if (leader.rank === 3) rankClass += " rank-bronze";

                      return (
                        <tr key={leader.rank}>
                          <td style={{ textAlign: "center" }}>
                            <span className={rankClass}>
                              {leader.rank === 1 ? "🥇" : leader.rank === 2 ? "🥈" : leader.rank === 3 ? "🥉" : leader.rank}
                            </span>
                          </td>
                          <td>
                            <strong>{leader.name}</strong>
                          </td>
                          <td style={{ textAlign: "center" }}>
                            <span className="level-chip">Lv {leader.level}</span>
                          </td>
                          <td style={{ textAlign: "right" }}>
                            <span className="xp-num">{leader.xp.toLocaleString()} XP</span>
                          </td>
                          <td style={{ textAlign: "center" }}>
                            <span className="streak-badge-inline">🔥 {leader.currentStreak}d</span>
                          </td>
                          <td style={{ textAlign: "center" }} className="text-muted">
                            {leader.totalDaysStudied} days
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
