const express = require("express");
const aiService = require("../aiService");
const ChatMessage = require("../models/ChatMessage");
const requireAuth = require("../middleware/auth");

const router = express.Router();

// Send a message, get a reply, persist both to history
router.post("/", requireAuth, async (req, res) => {
  try {
    const { message, subjectContext } = req.body;
    if (!message || typeof message !== "string") {
      return res.status(400).json({ error: "message (string) is required." });
    }

    // Pull recent history for context (last 20 messages)
    const history = await ChatMessage.find({ user: req.userId }).sort({ createdAt: 1 }).limit(20);

    const messages = [
      ...history.map((m) => ({ role: m.role, content: m.content })),
      { role: "user", content: message },
    ];

    const result = await aiService.chat({ messages, subjectContext });

    await ChatMessage.create({ user: req.userId, role: "user", content: message });
    await ChatMessage.create({ user: req.userId, role: "assistant", content: result.reply });

    res.json(result);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Fetch chat history
router.get("/history", requireAuth, async (req, res) => {
  const history = await ChatMessage.find({ user: req.userId }).sort({ createdAt: 1 });
  res.json(history);
});

module.exports = router;
