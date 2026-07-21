const express = require("express");
const aiService = require("../aiService");
const Timetable = require("../models/Timetable");
const requireAuth = require("../middleware/auth");

const router = express.Router();

// Generate a new timetable (AI or fallback) and save it for this user
router.post("/", requireAuth, async (req, res) => {
  try {
    const result = await aiService.generateTimetable(req.body);

    const saved = await Timetable.create({
      user: req.userId,
      subjects: req.body.subjects,
      hoursPerDay: req.body.hoursPerDay,
      studyDays: req.body.studyDays,
      startDate: req.body.startDate,
      timetable: result.timetable,
      generatedBy: result.metadata?.generatedBy || "rule-based",
    });

    res.status(201).json(saved);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Get this user's most recent timetable
router.get("/latest", requireAuth, async (req, res) => {
  const latest = await Timetable.findOne({ user: req.userId }).sort({ createdAt: -1 });
  if (!latest) return res.status(404).json({ error: "No timetable found yet. Generate one first." });
  res.json(latest);
});

// Get all of this user's saved timetables
router.get("/", requireAuth, async (req, res) => {
  const all = await Timetable.find({ user: req.userId }).sort({ createdAt: -1 });
  res.json(all);
});

// Mark a specific session as completed/uncompleted
router.patch("/:timetableId/session", requireAuth, async (req, res) => {
  const { date, sessionIndex, completed } = req.body;

  const tt = await Timetable.findOne({ _id: req.params.timetableId, user: req.userId });
  if (!tt) return res.status(404).json({ error: "Timetable not found." });

  const day = tt.timetable.find((d) => d.date === date);
  if (!day || !day.sessions[sessionIndex]) {
    return res.status(404).json({ error: "Session not found for that date/index." });
  }

  day.sessions[sessionIndex].completed = Boolean(completed);
  await tt.save();
  res.json(tt);
});

// Adaptive reschedule — redistribute incomplete past sessions to future dates
router.post("/:timetableId/reschedule", requireAuth, async (req, res) => {
  try {
    const tt = await Timetable.findOne({ _id: req.params.timetableId, user: req.userId });
    if (!tt) return res.status(404).json({ error: "Timetable not found." });

    const today = new Date().toISOString().slice(0, 10);
    const missed = [];

    tt.timetable.forEach((day) => {
      if (day.date < today) {
        day.sessions.forEach((sess) => {
          if (!sess.completed) missed.push({ ...sess.toObject(), fromDate: day.date });
        });
      }
    });

    if (missed.length === 0) {
      return res.json({ message: "No missed sessions to reschedule.", timetable: tt });
    }

    const maxMinutes = (tt.hoursPerDay || 3) * 60;
    let queue = [...missed];

    for (const day of tt.timetable) {
      if (queue.length === 0) break;
      if (day.date < today) continue;
      const used = day.sessions.reduce((sum, s) => sum + (s.duration || 0), 0);
      if (used < maxMinutes - 30) {
        const s = queue.shift();
        day.sessions.push({
          subject: s.subject,
          topic: `[Catch-up] ${s.topic}`,
          duration: s.duration,
          priority: "high",
          completed: false,
        });
      }
    }

    tt.markModified("timetable");
    await tt.save();
    const rescheduled = missed.length - queue.length;
    res.json({ message: `Rescheduled ${rescheduled} missed session(s).`, timetable: tt });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;

