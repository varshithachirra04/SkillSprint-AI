/**
 * PaceTrack — signature visual showing progress through the study period
 * relative to an exam date.
 */
export default function PaceTrack({ startDate, examDate, label }) {
  const start = new Date(startDate).getTime();
  const end   = new Date(examDate).getTime();
  const now   = Date.now();

  const totalSpan = Math.max(1, end - start);
  const elapsed   = Math.min(Math.max(now - start, 0), totalSpan);
  const percent   = Math.round((elapsed / totalSpan) * 100);
  const daysLeft  = Math.max(0, Math.ceil((end - now) / 86_400_000));

  return (
    <div className="pace-track-wrap">
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13 }}>
        <span style={{ fontWeight: 600 }}>{label}</span>
        <span style={{ color: "var(--text-muted)", fontFamily: "var(--font-mono)", fontSize: 12 }}>
          {daysLeft} day{daysLeft !== 1 ? "s" : ""} left
        </span>
      </div>
      <div className="pace-bar-outer">
        <div className="pace-bar-inner" style={{ width: `${percent}%` }} />
      </div>
      <div className="pace-meta">
        <span>{startDate}</span>
        <span>{percent}% complete</span>
        <span>{examDate}</span>
      </div>
    </div>
  );
}
