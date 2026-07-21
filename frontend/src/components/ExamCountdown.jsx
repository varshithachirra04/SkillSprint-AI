import { useEffect, useState } from "react";

export default function ExamCountdown({ subjects = [] }) {
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(t);
  }, []);

  const upcoming = subjects
    .map((s) => {
      const exam = new Date(s.examDate);
      const daysLeft = Math.ceil((exam - now) / (1000 * 60 * 60 * 24));
      return { ...s, daysLeft };
    })
    .filter((s) => s.daysLeft >= 0)
    .sort((a, b) => a.daysLeft - b.daysLeft);

  if (!upcoming.length) return null;

  return (
    <div className="countdown-grid">
      {upcoming.map((s) => {
        const urgency = s.daysLeft <= 3 ? "high" : s.daysLeft <= 7 ? "medium" : "low";
        const ring = Math.min(100, Math.max(0, (1 - s.daysLeft / 60) * 100));
        const circumference = 2 * Math.PI * 26;
        const strokeDash = circumference - (ring / 100) * circumference;

        return (
          <div key={s.name} className={`countdown-card urgency-${urgency}`}>
            <div className="countdown-ring-wrap">
              <svg viewBox="0 0 60 60" className="countdown-svg">
                <circle cx="30" cy="30" r="26" className="countdown-track" />
                <circle
                  cx="30" cy="30" r="26"
                  className="countdown-fill"
                  strokeDasharray={circumference}
                  strokeDashoffset={strokeDash}
                />
              </svg>
              <div className="countdown-days">
                <span className="countdown-num">{s.daysLeft}</span>
                <span className="countdown-unit">days</span>
              </div>
            </div>
            <div className="countdown-subject">{s.name}</div>
            <div className="countdown-date">{s.examDate}</div>
          </div>
        );
      })}
    </div>
  );
}
