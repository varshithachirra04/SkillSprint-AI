const express = require("express");
const Streak = require("../models/Streak");
const requireAuth = require("../middleware/auth");

const router = express.Router();

const BADGE_DEFINITIONS = [
  { id: "first-session", name: "First Step", emoji: "🌱", description: "Completed your first study session" },
  { id: "7-day-streak", name: "Week Warrior", emoji: "🔥", description: "7-day study streak" },
  { id: "30-day-streak", name: "Monthly Master", emoji: "🏆", description: "30-day study streak" },
  { id: "10-sessions", name: "Consistent", emoji: "⚡", description: "Studied 10 days total" },
  { id: "50-sessions", name: "Scholar", emoji: "🎓", description: "Studied 50 days total" },
  { id: "100-sessions", name: "Legend", emoji: "🌟", description: "Studied 100 days total" },
];

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

function yesterdayStr() {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return d.toISOString().slice(0, 10);
}

// GET /api/streak
router.get("/", requireAuth, async (req, res) => {
  try {
    let streak = await Streak.findOne({ user: req.userId });
    if (!streak) streak = await Streak.create({ user: req.userId });
    res.json({ ...streak.toObject(), badgeDefinitions: BADGE_DEFINITIONS });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/streak/mark-studied
router.post("/mark-studied", requireAuth, async (req, res) => {
  try {
    let streak = await Streak.findOne({ user: req.userId });
    if (!streak) streak = new Streak({ user: req.userId });

    const today = todayStr();

    // Idempotent — don't double-count
    if (streak.studyDates.includes(today)) {
      return res.json({ ...streak.toObject(), badgeDefinitions: BADGE_DEFINITIONS, alreadyMarked: true });
    }

    streak.studyDates.push(today);
    streak.totalDaysStudied += 1;

    // Calculate streak
    const yesterday = yesterdayStr();
    if (streak.studyDates.includes(yesterday) || streak.currentStreak === 0) {
      streak.currentStreak += 1;
    } else {
      streak.currentStreak = 1;
    }

    if (streak.currentStreak > streak.longestStreak) {
      streak.longestStreak = streak.currentStreak;
    }

    streak.lastStudiedDate = today;

    // Award XP
    let xpGain = 50;
    if (streak.currentStreak % 7 === 0) xpGain += 100; // weekly bonus
    streak.xp += xpGain;
    streak.level = Math.floor(streak.xp / 500) + 1;

    // Check badges
    const newBadges = [];
    const checks = [
      { id: "first-session", condition: streak.totalDaysStudied >= 1 },
      { id: "7-day-streak", condition: streak.currentStreak >= 7 },
      { id: "30-day-streak", condition: streak.currentStreak >= 30 },
      { id: "10-sessions", condition: streak.totalDaysStudied >= 10 },
      { id: "50-sessions", condition: streak.totalDaysStudied >= 50 },
      { id: "100-sessions", condition: streak.totalDaysStudied >= 100 },
    ];
    for (const { id, condition } of checks) {
      if (condition && !streak.earnedBadges.includes(id)) {
        streak.earnedBadges.push(id);
        newBadges.push(id);
      }
    }

    await streak.save();
    res.json({ ...streak.toObject(), badgeDefinitions: BADGE_DEFINITIONS, xpGain, newBadges });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = { router, BADGE_DEFINITIONS };
