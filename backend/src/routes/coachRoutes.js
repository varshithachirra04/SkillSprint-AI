const express = require("express");
const aiService = require("../aiService");
const Timetable = require("../models/Timetable");
const requireAuth = require("../middleware/auth");

const router = express.Router();

// Daily goals derived from the user's latest saved timetable
router.get("/daily-goals", requireAuth, async (req, res) => {
  try {
    const date = req.query.date || new Date().toISOString().slice(0, 10);

    const latest = await Timetable.findOne({ user: req.userId }).sort({ createdAt: -1 });
    if (!latest) {
      return res.status(404).json({ error: "No timetable found yet. Generate one first." });
    }

    const result = await aiService.generateDailyGoals({
      date,
      timetable: latest.timetable,
    });

    res.json(result);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Motivational tip
router.post("/tips", requireAuth, async (req, res) => {
  try {
    const result = await aiService.generateTip(req.body || {});
    res.json(result);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

module.exports = router;
