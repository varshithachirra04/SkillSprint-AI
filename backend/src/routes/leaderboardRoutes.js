const express = require("express");
const Streak = require("../models/Streak");

const router = express.Router();

// GET /api/leaderboard — public, top 10 by XP
router.get("/", async (req, res) => {
  try {
    const leaders = await Streak.find({ xp: { $gt: 0 } })
      .sort({ xp: -1 })
      .limit(10)
      .populate("user", "name");

    const result = leaders.map((s, i) => ({
      rank: i + 1,
      name: s.user?.name || "Anonymous",
      xp: s.xp,
      level: s.level,
      currentStreak: s.currentStreak,
      totalDaysStudied: s.totalDaysStudied,
    }));

    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
