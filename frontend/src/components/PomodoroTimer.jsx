import { useEffect, useRef, useState } from "react";
import { api } from "../api/client";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";

const WORK_MINS = 25;
const BREAK_MINS = 5;

export default function PomodoroTimer({ subject = "", topic = "" }) {
  const { token } = useAuth();
  const { addToast } = useToast();

  const [mode, setMode] = useState("work"); // 'work' | 'break'
  const [seconds, setSeconds] = useState(WORK_MINS * 60);
  const [running, setRunning] = useState(false);
  const [sessions, setSessions] = useState(0);
  const [subjectVal, setSubjectVal] = useState(subject);
  const [topicVal, setTopicVal] = useState(topic);
  const intervalRef = useRef(null);

  const total = mode === "work" ? WORK_MINS * 60 : BREAK_MINS * 60;
  const pct = ((total - seconds) / total) * 100;
  const mins = String(Math.floor(seconds / 60)).padStart(2, "0");
  const secs = String(seconds % 60).padStart(2, "0");

  useEffect(() => {
    if (running) {
      intervalRef.current = setInterval(() => {
        setSeconds((s) => {
          if (s <= 1) {
            clearInterval(intervalRef.current);
            handleTimerEnd();
            return 0;
          }
          return s - 1;
        });
      }, 1000);
    } else {
      clearInterval(intervalRef.current);
    }
    return () => clearInterval(intervalRef.current);
  }, [running, mode]);

  async function handleTimerEnd() {
    setRunning(false);
    if (mode === "work") {
      setSessions((s) => s + 1);
      addToast("🍅 Pomodoro complete! Great focus session.", "success");
      if (subjectVal) {
        try {
          await api.logPomodoro({ subject: subjectVal, topic: topicVal || "General", durationMinutes: WORK_MINS }, token);
        } catch (_) {}
      }
      setMode("break");
      setSeconds(BREAK_MINS * 60);
    } else {
      addToast("Break over — time to focus again!", "info");
      setMode("work");
      setSeconds(WORK_MINS * 60);
    }
  }

  function reset() {
    setRunning(false);
    setSeconds(mode === "work" ? WORK_MINS * 60 : BREAK_MINS * 60);
  }

  function switchMode(m) {
    setRunning(false);
    setMode(m);
    setSeconds(m === "work" ? WORK_MINS * 60 : BREAK_MINS * 60);
  }

  const circumference = 2 * Math.PI * 54;
  const strokeDash = circumference - (pct / 100) * circumference;

  return (
    <div className="pomodoro-card">
      <div className="pomodoro-mode-tabs">
        <button className={`pomo-tab${mode === "work" ? " active" : ""}`} onClick={() => switchMode("work")}>
          🍅 Focus
        </button>
        <button className={`pomo-tab${mode === "break" ? " active" : ""}`} onClick={() => switchMode("break")}>
          ☕ Break
        </button>
      </div>

      <div className="pomodoro-ring-wrap">
        <svg className="pomodoro-ring" viewBox="0 0 120 120">
          <circle cx="60" cy="60" r="54" className="ring-track" />
          <circle
            cx="60" cy="60" r="54"
            className="ring-fill"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDash}
            style={{ stroke: mode === "work" ? "var(--accent)" : "var(--priority-medium)" }}
          />
        </svg>
        <div className="pomodoro-time">
          <span className="pomo-display">{mins}:{secs}</span>
          <span className="pomo-label">{mode === "work" ? "Focus" : "Break"}</span>
        </div>
      </div>

      <div className="pomodoro-subject-row">
        <input
          className="pomo-input"
          placeholder="Subject (e.g. Physics)"
          value={subjectVal}
          onChange={(e) => setSubjectVal(e.target.value)}
        />
        <input
          className="pomo-input"
          placeholder="Topic (optional)"
          value={topicVal}
          onChange={(e) => setTopicVal(e.target.value)}
        />
      </div>

      <div className="pomodoro-controls">
        <button className="pomo-btn-start" onClick={() => setRunning((r) => !r)}>
          {running ? "⏸ Pause" : "▶ Start"}
        </button>
        <button className="pomo-btn-reset" onClick={reset}>↺ Reset</button>
      </div>

      <div className="pomo-sessions-today">
        🍅 <strong>{sessions}</strong> session{sessions !== 1 ? "s" : ""} this timer
      </div>
    </div>
  );
}
