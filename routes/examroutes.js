const express = require("express");
const router = express.Router();

const {
  addExam,
  getExams,
  updateExam,
  deleteExam,
} = require("../controllers/examController");

// Add Exam
router.post("/", addExam);

// Get All Exams
router.get("/", getExams);

// Update Exam
router.put("/:id", updateExam);

// Delete Exam
router.delete("/:id", deleteExam);

module.exports = router;