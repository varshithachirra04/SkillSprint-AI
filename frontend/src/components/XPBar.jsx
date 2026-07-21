export default function XPBar({ xp = 0, level = 1 }) {
  const xpForLevel = 500;
  const xpIntoLevel = xp % xpForLevel;
  const pct = Math.min(100, (xpIntoLevel / xpForLevel) * 100);

  return (
    <div className="xp-bar-wrap">
      <div className="xp-bar-header">
        <span className="xp-level-badge">Lv {level}</span>
        <span className="xp-label">{xp} XP total</span>
        <span className="xp-next">{xpForLevel - xpIntoLevel} XP to Lv {level + 1}</span>
      </div>
      <div className="xp-track">
        <div className="xp-fill" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}
