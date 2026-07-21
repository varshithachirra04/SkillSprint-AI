require("dotenv").config();
const express = require("express");
const cors = require("cors");
const connectDB = require("./config/db");

const authRoutes = require("./routes/authRoutes");
const timetableRoutes = require("./routes/timetableRoutes");
const coachRoutes = require("./routes/coachRoutes");
const chatRoutes = require("./routes/chatRoutes");
const { router: streakRoutes } = require("./routes/streakRoutes");
const quizRoutes = require("./routes/quizRoutes");
const toolsRoutes = require("./routes/toolsRoutes");
const analyticsRoutes = require("./routes/analyticsRoutes");
const pomodoroRoutes = require("./routes/pomodoroRoutes");
const leaderboardRoutes = require("./routes/leaderboardRoutes");

const app = express();
app.use(cors());
app.use(express.json({ limit: "2mb" }));

app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} ${req.method} ${req.path}`);
  next();
});

app.get("/health", (req, res) => {
  res.json({ status: "ok", provider: process.env.AI_PROVIDER || "mock" });
});

app.use("/api/auth", authRoutes);
app.use("/api/timetable", timetableRoutes);
app.use("/api", coachRoutes); // /api/daily-goals, /api/tips
app.use("/api/chat", chatRoutes);
app.use("/api/streak", streakRoutes);
app.use("/api/quiz", quizRoutes);
app.use("/api/tools", toolsRoutes);
app.use("/api/analytics", analyticsRoutes);
app.use("/api/pomodoro", pomodoroRoutes);
app.use("/api/leaderboard", leaderboardRoutes);

// Catch-all 404 for unmatched API routes
app.use("/api", (req, res) => {
  res.status(404).json({ error: "Endpoint not found." });
});

const PORT = process.env.PORT || 4000;

connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`SkillSprint AI backend running on http://localhost:${PORT}`);
    console.log(`Using AI provider: ${process.env.AI_PROVIDER || "mock"}`);
  });
});
