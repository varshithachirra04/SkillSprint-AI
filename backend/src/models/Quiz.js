const mongoose = require("mongoose");

const QuestionSchema = new mongoose.Schema({
  question: String,
  options: [String],
  correctIndex: Number,
  explanation: String,
});

const QuizSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    subject: { type: String, required: true },
    topic: { type: String, required: true },
    questions: [QuestionSchema],
    score: { type: Number, default: null },
    attemptedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Quiz", QuizSchema);
