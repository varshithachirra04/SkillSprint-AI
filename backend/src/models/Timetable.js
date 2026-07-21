const mongoose = require("mongoose");

const SessionSchema = new mongoose.Schema(
  {
    subject: { type: String, required: true },
    topic: { type: String, required: true },
    duration: { type: Number, required: true }, // minutes
    priority: { type: String, enum: ["low", "medium", "high"], required: true },
    completed: { type: Boolean, default: false },
  },
  { _id: false }
);

const DaySchema = new mongoose.Schema(
  {
    date: { type: String, required: true }, // YYYY-MM-DD
    sessions: [SessionSchema],
  },
  { _id: false }
);

const TimetableSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    subjects: [
      {
        name: String,
        examDate: String,
        weakTopics: [String],
      },
    ],
    hoursPerDay: Number,
    studyDays: [String],
    startDate: String,
    timetable: [DaySchema],
    generatedBy: { type: String, enum: ["ai", "rule-based"], default: "rule-based" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Timetable", TimetableSchema);
