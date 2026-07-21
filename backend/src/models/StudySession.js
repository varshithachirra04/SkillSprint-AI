const mongoose = require("mongoose");

const StudySessionSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    subject: { type: String, required: true },
    topic: { type: String, default: "General" },
    durationMinutes: { type: Number, required: true },
    type: { type: String, enum: ["pomodoro", "custom"], default: "pomodoro" },
    completedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

module.exports = mongoose.model("StudySession", StudySessionSchema);
