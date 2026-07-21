const express = require("express");
const conceptSimplifier = require("../generators/conceptSimplifier");
const notesSummarizer = require("../generators/notesSummarizer");
const requireAuth = require("../middleware/auth");

const router = express.Router();

// POST /api/tools/simplify
router.post("/simplify", requireAuth, async (req, res) => {
  try {
    const { concept, context } = req.body;
    if (!concept) return res.status(400).json({ error: "concept is required" });
    const result = await conceptSimplifier.simplify({ concept, context });
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/tools/summarize
router.post("/summarize", requireAuth, async (req, res) => {
  try {
    const { notes, subject } = req.body;
    if (!notes) return res.status(400).json({ error: "notes are required" });
    const result = await notesSummarizer.summarize({ notes, subject });
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
