const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../../.env") });

const User = require("../models/User");
const Streak = require("../models/Streak");
const StudySession = require("../models/StudySession");
const Quiz = require("../models/Quiz");
const Timetable = require("../models/Timetable");
const connectDB = require("../config/db");

// Helper to calculate relative ISO dates
function daysAgo(n) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().slice(0, 10);
}

async function seed() {
  console.log("Connecting to MongoDB...");
  await connectDB();

  console.log("Cleaning existing test user data...");
  const email = "test@skillsprint.app";
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    await Streak.deleteMany({ user: existingUser._id });
    await StudySession.deleteMany({ user: existingUser._id });
    await Quiz.deleteMany({ user: existingUser._id });
    await Timetable.deleteMany({ user: existingUser._id });
    await User.deleteOne({ _id: existingUser._id });
    console.log("Deleted old test user data.");
  }

  console.log("Creating test user account...");
  const passwordHash = await bcrypt.hash("password123", 10);
  const user = await User.create({
    name: "Alex Sprinter",
    email,
    passwordHash,
  });

  console.log("Creating study streak, level, XP, and badges...");
  // Simulate active study dates in the last 15 days
  const studyDates = [];
  for (let i = 14; i >= 0; i--) {
    // Leave a gap at day 6 to test streak breaks/resets
    if (i === 6) continue;
    studyDates.push(daysAgo(i));
  }

  await Streak.create({
    user: user._id,
    currentStreak: 6, // Studied today, yesterday, 2, 3, 4, 5 days ago
    longestStreak: 8,
    totalDaysStudied: studyDates.length,
    xp: 850,
    level: 2,
    studyDates,
    earnedBadges: ["first-session", "first-pomodoro"],
    lastStudiedDate: daysAgo(0),
  });

  console.log("Logging Pomodoro study sessions in the last 7 days...");
  const subjects = ["Computer Science", "Physics", "Chemistry"];
  const topics = {
    "Computer Science": ["Stack & Queues", "Binary Trees", "Sorting Algorithms"],
    "Physics": ["Thermodynamics", "Electromagnetism", "Optics"],
    "Chemistry": ["Organic Synthesis", "Chemical Kinetics", "Equilibrium"],
  };

  // Add 12 completed sessions over the last 7 days
  for (let i = 6; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);

    // 1 or 2 sessions per day
    const count = i % 2 === 0 ? 2 : 1;
    for (let c = 0; c < count; c++) {
      const subject = subjects[(i + c) % subjects.length];
      const topicList = topics[subject];
      const topic = topicList[(i + c) % topicList.length];
      const duration = 25; // 25-minute Pomodoro

      await StudySession.create({
        user: user._id,
        subject,
        topic,
        durationMinutes: duration,
        type: "pomodoro",
        completedAt: date,
      });
    }
  }

  console.log("Generating sample study timetable...");
  // Create a 14-day study timetable
  const timetableDays = [];
  const studyDays = ["Mon", "Tue", "Wed", "Thu", "Fri"];
  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  for (let i = 0; i < 14; i++) {
    const d = new Date();
    d.setDate(d.getDate() - 3 + i); // Starts 3 days ago, extends 11 days forward
    const dayName = dayNames[d.getDay()];

    if (studyDays.includes(dayName)) {
      const isPast = i < 3;
      const dateStr = d.toISOString().slice(0, 10);
      const daySubjects = [subjects[i % subjects.length], subjects[(i + 1) % subjects.length]];

      timetableDays.push({
        date: dateStr,
        sessions: daySubjects.map((sub, sIdx) => ({
          subject: sub,
          topic: topics[sub][(i + sIdx) % topics[sub].length],
          duration: 45,
          priority: sIdx === 0 ? "high" : "medium",
          // Mark past sessions as completed, future as incomplete
          completed: isPast,
        })),
      });
    }
  }

  await Timetable.create({
    user: user._id,
    subjects: [
      { name: "Computer Science", examDate: daysAgo(-10), weakTopics: ["Binary Trees"] },
      { name: "Physics", examDate: daysAgo(-15), weakTopics: ["Thermodynamics"] },
    ],
    hoursPerDay: 3,
    studyDays,
    startDate: daysAgo(3),
    timetable: timetableDays,
    generatedBy: "ai",
  });

  console.log("Seeding sample MCQ quizzes...");
  // Create 1 completed quiz and 1 unattempted quiz
  await Quiz.create({
    user: user._id,
    subject: "Computer Science",
    topic: "Stack Operations",
    questions: [
      { question: "What is the primary operational principle of a stack?", options: ["LIFO", "FIFO", "LILO", "None"], correctIndex: 0, explanation: "Stacks operate on Last-In, First-Out principle." },
      { question: "Which operation adds an element to the stack?", options: ["Pop", "Push", "Peek", "Enqueue"], correctIndex: 1, explanation: "Push inserts an element, Pop removes it." },
      { question: "Where is memory allocated for static variables?", options: ["Stack", "Heap", "Data Segment", "Register"], correctIndex: 0, explanation: "Local/static variables are allocated on the Stack." },
    ],
    score: 100,
    attemptedAt: new Date(Date.now() - 3600000 * 2), // 2 hours ago
  });

  await Quiz.create({
    user: user._id,
    subject: "Physics",
    topic: "Laws of Thermodynamics",
    questions: [
      { question: "Which law states that energy cannot be created or destroyed?", options: ["First Law", "Second Law", "Third Law", "Zeroth Law"], correctIndex: 0, explanation: "The First Law is the conservation of energy." },
      { question: "What is entropy a measure of?", options: ["Heat transfer", "Temperature", "Disorder", "Work done"], correctIndex: 2, explanation: "Second law states entropy/disorder always increases." },
      { question: "Absolute zero is associated with which law?", options: ["Zeroth Law", "First Law", "Second Law", "Third Law"], correctIndex: 3, explanation: "The Third Law states entropy approaches a constant minimum at absolute zero." },
    ],
    score: null,
    attemptedAt: null,
  });

  console.log("Seeding completed successfully!");
  mongoose.connection.close();
}

seed().catch((err) => {
  console.error("Seeding failed:", err);
  mongoose.connection.close();
});
