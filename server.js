require("dotenv").config();
const express = require("express");
const cors = require("cors");
const aiService = require("./aiService");

const app = express();
app.use(cors());
app.use(express.json());

// Simple request logger — helpful during team integration/demos
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} ${req.method} ${req.path}`);
  next();
});

app.get("/health", (req, res) => {
  res.json({ status: "ok", provider: process.env.AI_PROVIDER || "mock" });
});

app.post("/api/timetable", async (req, res) => {
  try {
    const result = await aiService.generateTimetable(req.body);
    res.json(result);
  } catch (err) {
    // Only reaches here for INPUT validation errors — AI failures are
    // already handled internally with a fallback.
    res.status(400).json({ error: err.message });
  }
});

app.post("/api/daily-goals", async (req, res) => {
  try {
    const result = await aiService.generateDailyGoals(req.body);
    res.json(result);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.post("/api/tips", async (req, res) => {
  try {
    const result = await aiService.generateTip(req.body || {});
    res.json(result);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.post("/api/chat", async (req, res) => {
  try {
    const result = await aiService.chat(req.body);
    res.json(result);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`SkillSprint AI service running on http://localhost:${PORT}`);
  console.log(`Using provider: ${process.env.AI_PROVIDER || "mock"}`);
});
