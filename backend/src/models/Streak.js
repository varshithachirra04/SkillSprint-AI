const mongoose = require("mongoose");

const StreakSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, unique: true },
    currentStreak: { type: Number, default: 0 },
    longestStreak: { type: Number, default: 0 },
    totalDaysStudied: { type: Number, default: 0 },
    xp: { type: Number, default: 0 },
    level: { type: Number, default: 1 },
    studyDates: [{ type: String }],
    earnedBadges: [{ type: String }],
    lastStudiedDate: { type: String, default: null },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Streak", StreakSchema);
