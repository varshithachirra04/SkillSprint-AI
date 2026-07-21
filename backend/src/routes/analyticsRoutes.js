const express = require("express");
const StudySession = require("../models/StudySession");
const Streak = require("../models/Streak");
const Timetable = require("../models/Timetable");
const requireAuth = require("../middleware/auth");

const router = express.Router();

function todayStart() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

function weekStart() {
  const d = new Date();
  d.setDate(d.getDate() - 7);
  d.setHours(0, 0, 0, 0);
  return d;
}

// GET /api/analytics/weekly-report
router.get("/weekly-report", requireAuth, async (req, res) => {
  try {
    const since = weekStart();

    const sessions = await StudySession.find({
      user: req.userId,
      completedAt: { $gte: since },
    });

    const totalSessions = sessions.length;
    const totalMinutes = sessions.reduce((s, sess) => s + sess.durationMinutes, 0);
    const totalHours = Math.round((totalMinutes / 60) * 10) / 10;

    // Subject breakdown
    const bySubject = {};
    for (const sess of sessions) {
      bySubject[sess.subject] = (bySubject[sess.subject] || 0) + sess.durationMinutes;
    }
    const subjectBreakdown = Object.entries(bySubject).map(([subject, minutes]) => ({
      subject,
      minutes,
      hours: Math.round((minutes / 60) * 10) / 10,
    }));

    // Completed from timetable
    const tt = await Timetable.findOne({ user: req.userId }).sort({ createdAt: -1 });
    let completedSessions = 0;
    let totalTimetableSessions = 0;
    if (tt) {
      const sinceStr = since.toISOString().slice(0, 10);
      tt.timetable.forEach((day) => {
        if (day.date >= sinceStr) {
          totalTimetableSessions += day.sessions.length;
          completedSessions += day.sessions.filter((s) => s.completed).length;
        }
      });
    }

    const streak = await Streak.findOne({ user: req.userId });

    res.json({
      totalSessions,
      totalHours,
      totalMinutes,
      completedSessions,
      totalTimetableSessions,
      completionRate: totalTimetableSessions > 0
        ? Math.round((completedSessions / totalTimetableSessions) * 100)
        : 0,
      subjectBreakdown,
      currentStreak: streak?.currentStreak || 0,
      xp: streak?.xp || 0,
      level: streak?.level || 1,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/analytics/subject-performance
router.get("/subject-performance", requireAuth, async (req, res) => {
  try {
    const tt = await Timetable.findOne({ user: req.userId }).sort({ createdAt: -1 });
    if (!tt) return res.json([]);

    const subjectMap = {};
    tt.timetable.forEach((day) => {
      day.sessions.forEach((sess) => {
        if (!subjectMap[sess.subject]) {
          subjectMap[sess.subject] = { subject: sess.subject, total: 0, completed: 0, totalMinutes: 0 };
        }
        subjectMap[sess.subject].total += 1;
        subjectMap[sess.subject].totalMinutes += sess.duration || 0;
        if (sess.completed) subjectMap[sess.subject].completed += 1;
      });
    });

    const result = Object.values(subjectMap).map((s) => ({
      ...s,
      rate: s.total > 0 ? Math.round((s.completed / s.total) * 100) : 0,
    }));

    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
