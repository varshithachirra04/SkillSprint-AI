const express = require("express");
const StudySession = require("../models/StudySession");
const Streak = require("../models/Streak");
const requireAuth = require("../middleware/auth");

const router = express.Router();

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

function yesterdayStr() {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return d.toISOString().slice(0, 10);
}

async function markStudied(userId) {
  let streak = await Streak.findOne({ user: userId });
  if (!streak) streak = new Streak({ user: userId });

  const today = todayStr();
  if (streak.studyDates.includes(today)) return streak;

  streak.studyDates.push(today);
  streak.totalDaysStudied += 1;

  const yesterday = yesterdayStr();
  if (streak.studyDates.includes(yesterday) || streak.currentStreak === 0) {
    streak.currentStreak += 1;
  } else {
    streak.currentStreak = 1;
  }
  if (streak.currentStreak > streak.longestStreak) streak.longestStreak = streak.currentStreak;
  streak.lastStudiedDate = today;

  let xpGain = 50;
  if (streak.currentStreak % 7 === 0) xpGain += 100;
  streak.xp += xpGain;
  streak.level = Math.floor(streak.xp / 500) + 1;

  const BADGE_CHECKS = [
    { id: "first-session", condition: streak.totalDaysStudied >= 1 },
    { id: "7-day-streak", condition: streak.currentStreak >= 7 },
    { id: "30-day-streak", condition: streak.currentStreak >= 30 },
    { id: "10-sessions", condition: streak.totalDaysStudied >= 10 },
    { id: "50-sessions", condition: streak.totalDaysStudied >= 50 },
    { id: "100-sessions", condition: streak.totalDaysStudied >= 100 },
  ];
  for (const { id, condition } of BADGE_CHECKS) {
    if (condition && !streak.earnedBadges.includes(id)) streak.earnedBadges.push(id);
  }

  await streak.save();
  return streak;
}

// POST /api/pomodoro
router.post("/", requireAuth, async (req, res) => {
  try {
    const { subject, topic, durationMinutes } = req.body;
    if (!subject || !durationMinutes) {
      return res.status(400).json({ error: "subject and durationMinutes are required" });
    }

    const session = await StudySession.create({
      user: req.userId,
      subject,
      topic: topic || "General",
      durationMinutes,
      type: "pomodoro",
    });

    // Auto-mark streak
    await markStudied(req.userId);

    res.status(201).json(session);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/pomodoro/today
router.get("/today", requireAuth, async (req, res) => {
  try {
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    const sessions = await StudySession.find({
      user: req.userId,
      completedAt: { $gte: start },
    }).sort({ completedAt: -1 });
    res.json(sessions);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/pomodoro/stats
router.get("/stats", requireAuth, async (req, res) => {
  try {
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    const sessions = await StudySession.find({
      user: req.userId,
      completedAt: { $gte: start },
    });
    const totalMinutes = sessions.reduce((s, sess) => s + sess.durationMinutes, 0);
    res.json({ totalSessions: sessions.length, totalMinutes, totalHours: Math.round((totalMinutes / 60) * 10) / 10 });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
