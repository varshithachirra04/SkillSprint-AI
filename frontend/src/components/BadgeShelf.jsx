const ALL_BADGES = [
  { id: "first-session", name: "First Step", emoji: "🌱", description: "Completed your first study session" },
  { id: "7-day-streak", name: "Week Warrior", emoji: "🔥", description: "7-day study streak" },
  { id: "30-day-streak", name: "Monthly Master", emoji: "🏆", description: "30-day study streak" },
  { id: "10-sessions", name: "Consistent", emoji: "⚡", description: "Studied 10 days total" },
  { id: "50-sessions", name: "Scholar", emoji: "🎓", description: "Studied 50 days total" },
  { id: "100-sessions", name: "Legend", emoji: "🌟", description: "Studied 100 days total" },
];

export default function BadgeShelf({ earnedBadges = [] }) {
  const earnedSet = new Set(earnedBadges);

  return (
    <div className="badge-shelf">
      {ALL_BADGES.map((badge) => {
        const earned = earnedSet.has(badge.id);
        return (
          <div key={badge.id} className={`badge-chip${earned ? " earned" : " locked"}`} title={badge.description}>
            <span className="badge-emoji">{badge.emoji}</span>
            <span className="badge-name">{badge.name}</span>
            {!earned && <span className="badge-lock">🔒</span>}
          </div>
        );
      })}
    </div>
  );
}
