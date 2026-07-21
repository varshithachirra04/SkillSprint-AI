const express = require("express");
const Quiz = require("../models/Quiz");
const quizGenerator = require("../generators/quizGenerator");
const requireAuth = require("../middleware/auth");

const router = express.Router();

// POST /api/quiz/generate
router.post("/generate", requireAuth, async (req, res) => {
  try {
    const { subject, topic } = req.body;
    if (!subject || !topic) return res.status(400).json({ error: "subject and topic are required" });

    const generated = await quizGenerator.generate({ subject, topic });

    const quiz = await Quiz.create({
      user: req.userId,
      subject,
      topic,
      questions: generated.questions,
    });

    res.status(201).json(quiz);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/quiz
router.get("/", requireAuth, async (req, res) => {
  try {
    const quizzes = await Quiz.find({ user: req.userId }).sort({ createdAt: -1 }).limit(20);
    res.json(quizzes);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/quiz/:id
router.get("/:id", requireAuth, async (req, res) => {
  try {
    const quiz = await Quiz.findOne({ _id: req.params.id, user: req.userId });
    if (!quiz) return res.status(404).json({ error: "Quiz not found" });
    res.json(quiz);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/quiz/:id/submit
router.post("/:id/submit", requireAuth, async (req, res) => {
  try {
    const { answers } = req.body; // array of selected option indices
    const quiz = await Quiz.findOne({ _id: req.params.id, user: req.userId });
    if (!quiz) return res.status(404).json({ error: "Quiz not found" });

    const correct = quiz.questions.filter((q, i) => answers[i] === q.correctIndex).length;
    quiz.score = Math.round((correct / quiz.questions.length) * 100);
    quiz.attemptedAt = new Date();
    await quiz.save();

    res.json({ score: quiz.score, correct, total: quiz.questions.length, quiz });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
