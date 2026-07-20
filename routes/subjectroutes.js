const express = require("express");
const router = express.Router();

const {
  addSubject,
  getSubjects,
  updateSubject,
  deleteSubject,
} = require("../controllers/subjectController");

// Add Subject
router.post("/", addSubject);

// Get All Subjects
router.get("/", getSubjects);

// Update Subject
router.put("/:id", updateSubject);

// Delete Subject
router.delete("/:id", deleteSubject);

module.exports = router;