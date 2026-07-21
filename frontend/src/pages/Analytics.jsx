import { useEffect, useState } from "react";
import { api } from "../api/client";
import { useAuth } from "../context/AuthContext";
import Sidebar from "../components/Sidebar";
import StreakHeatmap from "../components/StreakHeatmap";
import BadgeShelf from "../components/BadgeShelf";
import XPBar from "../components/XPBar";

export default function Analytics() {
  const { token } = useAuth();
  const [report, setReport] = useState(null);
  const [performance, setPerformance] = useState([]);
  const [streak, setStreak] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.getWeeklyReport(token),
      api.getSubjectPerformance(token),
      api.getStreak(token),
    ]).then(([r, p, s]) => {
      setReport(r);
      setPerformance(p);
      setStreak(s);
    }).catch(console.error)
      .finally(() => setLoading(false));
  }, [token]);

  const maxRate = performance.length ? Math.max(...performance.map((p) => p.rate), 1) : 1;

  return (
    <div className="app-layout">
      <Sidebar />
      <main className="page-main">
        <div className="page-header">
          <span className="section-eyebrow">Your progress</span>
          <h1>Analytics</h1>
        </div>

        {loading ? (
          <p className="spinner-text">Loading analytics…</p>
        ) : (
          <>
            {/* XP + Level */}
            {streak && (
              <div className="card" style={{ marginBottom: 20 }}>
                <h2>Level & XP</h2>
                <XPBar xp={streak.xp} level={streak.level} />
              </div>
            )}

            {/* Weekly Stats */}
            {report && (
              <div className="stats-grid">
                <div className="stat-card">
                  <span className="stat-value">{report.totalHours}h</span>
                  <span className="stat-label">Studied this week</span>
                </div>
                <div className="stat-card">
                  <span className="stat-value">{report.completionRate}%</span>
                  <span className="stat-label">Timetable completion</span>
                </div>
                <div className="stat-card">
                  <span className="stat-value">{report.currentStreak}</span>
                  <span className="stat-label">Day streak 🔥</span>
                </div>
                <div className="stat-card">
                  <span className="stat-value">{report.totalSessions}</span>
                  <span className="stat-label">Pomodoros this week</span>
                </div>
              </div>
            )}

            {/* Heatmap */}
            {streak && (
              <div className="card" style={{ marginBottom: 20 }}>
                <StreakHeatmap studyDates={streak.studyDates} />
              </div>
            )}

            {/* Subject Performance */}
            {performance.length > 0 && (
              <div className="card" style={{ marginBottom: 20 }}>
                <h2>Subject Performance</h2>
                <div className="subject-bars">
                  {performance.map((s) => (
                    <div key={s.subject} className="subject-bar-row">
                      <span className="subject-bar-label">{s.subject}</span>
                      <div className="subject-bar-track">
                        <div
                          className="subject-bar-fill"
                          style={{ width: `${(s.rate / maxRate) * 100}%` }}
                        />
                      </div>
                      <span className="subject-bar-pct">{s.rate}%</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Badges */}
            {streak && (
              <div className="card">
                <h2>Badges</h2>
                <BadgeShelf earnedBadges={streak.earnedBadges} />
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
