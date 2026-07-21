import { useState, useEffect, useCallback } from "react";
import { api } from "../api/client";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import Sidebar from "../components/Sidebar";
import PaceTrack from "../components/PaceTrack";
import ExamCountdown from "../components/ExamCountdown";
import PomodoroTimer from "../components/PomodoroTimer";
import XPBar from "../components/XPBar";

const ALL_DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const todayISO = () => new Date().toISOString().slice(0, 10);

function emptySubject() {
  return { name: "", examDate: "", weakTopics: "" };
}

export default function Dashboard() {
  const { token } = useAuth();
  const { addToast } = useToast();

  const [subjects, setSubjects] = useState([emptySubject()]);
  const [hoursPerDay, setHoursPerDay] = useState(3);
  const [studyDays, setStudyDays] = useState(["Mon", "Tue", "Wed", "Thu", "Fri"]);
  const [generating, setGenerating] = useState(false);
  const [rescheduling, setRescheduling] = useState(false);
  const [formError, setFormError] = useState("");

  const [timetable, setTimetable] = useState(null);
  const [loadingTimetable, setLoadingTimetable] = useState(true);

  const [goals, setGoals] = useState(null);
  const [tip, setTip] = useState(null);
  const [streakData, setStreakData] = useState(null);

  // Active session for Pomodoro Timer
  const [activeTimerSession, setActiveTimerSession] = useState(null);

  const loadLatest = useCallback(async () => {
    setLoadingTimetable(true);
    try {
      const data = await api.getLatestTimetable(token);
      setTimetable(data);
    } catch {
      setTimetable(null);
    } finally {
      setLoadingTimetable(false);
    }
  }, [token]);

  const loadStreak = useCallback(async () => {
    try {
      const s = await api.getStreak(token);
      setStreakData(s);
    } catch (_) {}
  }, [token]);

  useEffect(() => {
    loadLatest();
    loadStreak();
    api.getTip({}, token).then(setTip).catch(() => {});
  }, [loadLatest, loadStreak, token]);

  useEffect(() => {
    if (!timetable) return;
    api
      .getDailyGoals(todayISO(), token)
      .then(setGoals)
      .catch(() => setGoals(null));
  }, [timetable, token]);

  function updateSubject(index, field, value) {
    setSubjects((prev) => prev.map((s, i) => (i === index ? { ...s, [field]: value } : s)));
  }

  function addSubject() {
    setSubjects((prev) => [...prev, emptySubject()]);
  }

  function removeSubject(index) {
    setSubjects((prev) => prev.filter((_, i) => i !== index));
  }

  function toggleDay(day) {
    setStudyDays((prev) => (prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]));
  }

  async function handleGenerate(e) {
    e.preventDefault();
    setFormError("");

    if (studyDays.length === 0) {
      setFormError("Pick at least one study day.");
      return;
    }
    if (subjects.some((s) => !s.name || !s.examDate)) {
      setFormError("Every subject needs a name and exam date.");
      return;
    }

    setGenerating(true);
    try {
      const payload = {
        subjects: subjects.map((s) => ({
          name: s.name,
          examDate: s.examDate,
          weakTopics: s.weakTopics
            ? s.weakTopics.split(",").map((t) => t.trim()).filter(Boolean)
            : [],
        })),
        hoursPerDay: Number(hoursPerDay),
        studyDays,
        startDate: todayISO(),
      };

      const saved = await api.generateTimetable(payload, token);
      setTimetable(saved);
      addToast("📅 Timetable generated!", "success");
      loadStreak();
    } catch (err) {
      setFormError(err.message);
    } finally {
      setGenerating(false);
    }
  }

  async function handleToggleSession(date, sessionIndex, currentlyCompleted) {
    try {
      const updated = await api.toggleSession(
        timetable._id,
        { date, sessionIndex, completed: !currentlyCompleted },
        token
      );
      setTimetable(updated);

      if (!currentlyCompleted) {
        // Award XP and update streak via markStudied
        const res = await api.markStudied(token);
        if (res.xpGain) {
          addToast(`⭐ Earned +${res.xpGain} XP!`, "success");
        }
        if (res.newBadges && res.newBadges.length > 0) {
          res.newBadges.forEach((b) => {
            addToast(`🏆 Unlocked Badge: ${b}!`, "badge");
          });
        }
        loadStreak();
      }
    } catch (err) {
      console.error(err);
    }
  }

  async function handleAdaptiveReschedule() {
    if (!timetable) return;
    setRescheduling(true);
    try {
      const res = await api.rescheduleMissed(timetable._id, token);
      setTimetable(res.timetable);
      addToast(res.message, "success");
    } catch (err) {
      addToast(err.message, "error");
    } finally {
      setRescheduling(false);
    }
  }

  const latestExamDate = timetable?.subjects?.length
    ? timetable.subjects.reduce((latest, s) => (s.examDate > latest ? s.examDate : latest), timetable.subjects[0].examDate)
    : null;

  return (
    <div className="app-layout">
      <Sidebar />
      <main className="page-main">
        <div className="dashboard-top-row">
          <div className="page-header" style={{ margin: 0 }}>
            <span className="section-eyebrow">Study planner</span>
            <h1>Plan your sprint to exam day</h1>
          </div>

          {streakData && (
            <div className="header-xp-panel">
              <div className="header-streak-badge">
                <span className="streak-emoji">🔥</span>
                <span><strong>{streakData.currentStreak}</strong> day streak</span>
              </div>
              <div className="header-xp-bar">
                <XPBar xp={streakData.xp} level={streakData.level} />
              </div>
            </div>
          )}
        </div>

        {tip && (
          <div className="card tip-card">
            <p>💡 {tip.tip}</p>
          </div>
        )}

        {/* Countdowns grid */}
        {timetable?.subjects && <ExamCountdown subjects={timetable.subjects} />}

        {/* Dashboard Grid for split view */}
        <div className="dashboard-grid-layout">
          <div className="dashboard-left-col">
            {/* Generate form card */}
            <div className="card">
              <h2>Generate a timetable</h2>

              {formError && <div className="error-banner">{formError}</div>}

              <form onSubmit={handleGenerate}>
                {subjects.map((subject, i) => (
                  <div className="subject-row" key={i}>
                    <div className="field" style={{ margin: 0 }}>
                      <label>Subject</label>
                      <input
                        value={subject.name}
                        onChange={(e) => updateSubject(i, "name", e.target.value)}
                        placeholder="Physics"
                      />
                    </div>
                    <div className="field" style={{ margin: 0 }}>
                      <label>Exam date</label>
                      <input
                        type="date"
                        value={subject.examDate}
                        onChange={(e) => updateSubject(i, "examDate", e.target.value)}
                      />
                    </div>
                    <div className="field" style={{ margin: 0 }}>
                      <label>Weak topics (comma-separated)</label>
                      <input
                        value={subject.weakTopics}
                        onChange={(e) => updateSubject(i, "weakTopics", e.target.value)}
                        placeholder="Thermodynamics, Optics"
                      />
                    </div>
                    <button
                      type="button"
                      className="btn-icon"
                      onClick={() => removeSubject(i)}
                      disabled={subjects.length === 1}
                    >
                      Remove
                    </button>
                  </div>
                ))}

                <button type="button" className="btn-link" onClick={addSubject}>
                  + Add another subject
                </button>

                <div className="form-grid" style={{ marginTop: 20 }}>
                  <div className="field">
                    <label>Hours per study day</label>
                    <input
                      type="number"
                      min="1"
                      max="12"
                      value={hoursPerDay}
                      onChange={(e) => setHoursPerDay(e.target.value)}
                    />
                  </div>
                  <div className="field">
                    <label>Available study days</label>
                    <div className="day-toggle-row">
                      {ALL_DAYS.map((day) => (
                        <button
                          type="button"
                          key={day}
                          className={`day-toggle${studyDays.includes(day) ? " active" : ""}`}
                          onClick={() => toggleDay(day)}
                        >
                          {day}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <button className="btn-primary" type="submit" disabled={generating} style={{ marginTop: 8 }}>
                  {generating ? "Generating…" : "Generate timetable"}
                </button>
              </form>
            </div>

            {/* Timetable view */}
            <div className="card">
              <div className="timetable-header-row">
                <h2>Your timetable</h2>
                {timetable && (
                  <button
                    className="btn-secondary reschedule-btn"
                    onClick={handleAdaptiveReschedule}
                    disabled={rescheduling}
                  >
                    {rescheduling ? "Rescheduling..." : "🔄 Reschedule Missed"}
                  </button>
                )}
              </div>

              {loadingTimetable ? (
                <p className="spinner-text">Loading…</p>
              ) : !timetable ? (
                <div className="empty-state">
                  <h3>No timetable yet</h3>
                  <p>Fill in your subjects above and generate your first study plan.</p>
                </div>
              ) : (
                <div className="timetable-blocks-container">
                  {timetable.timetable.map((day) => (
                    <div className="day-block" key={day.date}>
                      <div className="day-date">{day.date}</div>
                      {day.sessions.map((session, i) => (
                        <div
                          className={`session-item${session.completed ? " completed" : ""}`}
                          key={i}
                          style={{ cursor: "pointer" }}
                        >
                          <input
                            type="checkbox"
                            checked={!!session.completed}
                            onChange={() => handleToggleSession(day.date, i, session.completed)}
                          />
                          <span className={`priority-dot ${session.priority}`} />
                          <span className="session-subject">{session.subject}</span>
                          <span className="session-topic">{session.topic}</span>
                          <span className="session-duration">{session.duration}m</span>
                          <button
                            type="button"
                            className="btn-link pomo-shortcut-btn"
                            onClick={(e) => {
                              e.stopPropagation();
                              setActiveTimerSession({ subject: session.subject, topic: session.topic });
                            }}
                          >
                            ⏱️ Study
                          </button>
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="dashboard-right-col">
            {/* Pomodoro timer */}
            <div className="card">
              <h2>Focus Timer</h2>
              <PomodoroTimer
                subject={activeTimerSession?.subject || ""}
                topic={activeTimerSession?.topic || ""}
              />
            </div>

            {/* Pace track signature */}
            {latestExamDate && timetable && (
              <div className="card">
                <h2>Study Pace</h2>
                <PaceTrack startDate={timetable.startDate} examDate={latestExamDate} label="Next exam" />
              </div>
            )}

            {/* Daily goals */}
            {goals && goals.goals?.length > 0 && (
              <div className="card">
                <h2>Today's Goals</h2>
                {goals.goals.map((g, i) => (
                  <div className="session-item" key={i}>
                    <span className="session-subject">{g.subject}</span>
                    <span className="session-topic">{g.goal}</span>
                    <span className="session-duration">{g.estimatedMinutes}m</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
