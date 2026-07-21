/**
 * aiService.js
 * ─────────────────────────────────────────────────────────────────────────
 * THE single door into all AI functionality for SkillSprint AI.
 *
 * Rule for the whole team: nothing outside this file (and the folders it
 * imports from) should ever import an AI provider SDK directly. Frontend,
 * backend routes, DB layer — everyone calls the functions exported here.
 *
 * Why: if we swap OpenAI for Claude/Gemini/a local model later, only
 * /src/providers/* changes. This file's exported function signatures never
 * need to change.
 * ─────────────────────────────────────────────────────────────────────────
 */

const timetableGenerator = require("./generators/timetableGenerator");
const dailyGoalsGenerator = require("./generators/dailyGoalsGenerator");
const motivationTipsGenerator = require("./generators/motivationTipsGenerator");
const chatbotService = require("./generators/chatbotService");

module.exports = {
  /**
   * generateTimetable({ subjects, hoursPerDay, studyDays, startDate })
   * → { timetable: [...], metadata: { generatedBy: "ai"|"rule-based", ... } }
   * Never throws for AI-side failures — falls back to rule-based automatically.
   */
  generateTimetable: timetableGenerator.generate,

  /**
   * generateDailyGoals({ date, timetable })
   * → { date, goals: [...], metadata }
   */
  generateDailyGoals: dailyGoalsGenerator.generate,

  /**
   * generateTip({ subject?, mood? })
   * → { tip: "string", metadata }
   */
  generateTip: motivationTipsGenerator.generate,

  /**
   * chat({ messages: [{role, content}], subjectContext?: string[] })
   * → { reply: "string", metadata }
   */
  chat: chatbotService.reply,
};
