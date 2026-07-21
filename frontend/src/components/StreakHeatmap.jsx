import { useMemo } from "react";

function getColor(count) {
  if (count === 0) return "var(--heatmap-0)";
  if (count === 1) return "var(--heatmap-1)";
  if (count === 2) return "var(--heatmap-2)";
  if (count === 3) return "var(--heatmap-3)";
  return "var(--heatmap-4)";
}

function getLast90Days() {
  const days = [];
  for (let i = 89; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    days.push(d.toISOString().slice(0, 10));
  }
  return days;
}

export default function StreakHeatmap({ studyDates = [] }) {
  const days = useMemo(() => getLast90Days(), []);
  const dateSet = useMemo(() => new Set(studyDates), [studyDates]);

  // Group into weeks
  const weeks = useMemo(() => {
    const result = [];
    let week = [];
    for (const day of days) {
      week.push(day);
      if (week.length === 7) {
        result.push(week);
        week = [];
      }
    }
    if (week.length) result.push(week);
    return result;
  }, [days]);

  const months = useMemo(() => {
    const labels = [];
    let lastMonth = null;
    for (let i = 0; i < days.length; i += 7) {
      const month = new Date(days[i]).toLocaleString("default", { month: "short" });
      if (month !== lastMonth) { labels.push(month); lastMonth = month; }
      else labels.push("");
    }
    return labels;
  }, [days]);

  const totalStudied = useMemo(() => days.filter((d) => dateSet.has(d)).length, [days, dateSet]);

  return (
    <div className="heatmap-wrap">
      <div className="heatmap-header">
        <span className="heatmap-title">Study Activity</span>
        <span className="heatmap-stat">{totalStudied} days in the last 90 days</span>
      </div>
      <div className="heatmap-months">
        {months.map((m, i) => <span key={i} className="heatmap-month">{m}</span>)}
      </div>
      <div className="heatmap-grid">
        {weeks.map((week, wi) => (
          <div key={wi} className="heatmap-week">
            {week.map((day) => (
              <div
                key={day}
                className="heatmap-cell"
                style={{ background: getColor(dateSet.has(day) ? 3 : 0) }}
                title={day}
              />
            ))}
          </div>
        ))}
      </div>
      <div className="heatmap-legend">
        <span className="heatmap-legend-label">Less</span>
        {[0, 1, 2, 3, 4].map((i) => (
          <div key={i} className="heatmap-cell" style={{ background: getColor(i) }} />
        ))}
        <span className="heatmap-legend-label">More</span>
      </div>
    </div>
  );
}
