const { getProvider } = require("../providers/providerFactory");
const { callWithResilience } = require("../utils/resilience");
const { buildTimetablePrompt } = require("../utils/promptTemplates");
const { TimetableInputSchema } = require("../utils/schemas");
const ruleBasedTimetable = require("../fallback/ruleBasedTimetable");

const DAY_NAME_MAP = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function toDateOnly(d) {
  return d.toISOString().slice(0, 10);
}

function daysBetween(a, b) {
  const MS_PER_DAY = 1000 * 60 * 60 * 24;
  return Math.round((b - a) / MS_PER_DAY);
}

/**
 * Strips accidental markdown code fences and attempts to repair
 * truncated JSON by closing any open structures.
 */
function cleanAndRepairJson(raw) {
  let s = raw
    .replace(/^```(json)?/im, "")
    .replace(/```$/m, "")
    .trim();

  // Attempt to auto-close a truncated JSON object/array
  try {
    JSON.parse(s);
    return s; // already valid
  } catch (_) {
    // Count open braces/brackets and close them
    let opens = 0;
    let arrOpens = 0;
    let inString = false;
    let escape = false;
    for (const ch of s) {
      if (escape) { escape = false; continue; }
      if (ch === "\\" && inString) { escape = true; continue; }
      if (ch === '"') { inString = !inString; continue; }
      if (inString) continue;
      if (ch === "{") opens++;
      else if (ch === "}") opens--;
      else if (ch === "[") arrOpens++;
      else if (ch === "]") arrOpens--;
    }
    // Trim trailing comma before we close
    s = s.replace(/,\s*$/, "");
    for (let i = 0; i < arrOpens; i++) s += "]";
    for (let i = 0; i < opens; i++) s += "}";
    return s;
  }
}

/**
 * Expands a weeklyPlan (7-day pattern from AI) into a full dated timetable
 * from startDate up to (and including) the latest exam date.
 */
function expandWeeklyPlan(weeklyPlan, input) {
  const { subjects, startDate } = input;

  const today = new Date(startDate);
  const latestExamDate = subjects.reduce((latest, s) => {
    const d = new Date(s.examDate);
    return d > latest ? d : latest;
  }, today);

  const totalDays = Math.max(1, daysBetween(today, latestExamDate) + 1);

  // Index the weeklyPlan by dayOfWeek for fast lookup
  const planByDay = {};
  for (const entry of weeklyPlan) {
    planByDay[entry.dayOfWeek] = entry.sessions || [];
  }

  const timetable = [];
  for (let offset = 0; offset < totalDays; offset++) {
    const date = new Date(today);
    date.setDate(date.getDate() + offset);
    const dayName = DAY_NAME_MAP[date.getDay()];

    const sessions = planByDay[dayName];
    if (!sessions || sessions.length === 0) continue;

    // Filter out sessions for subjects whose exam has already passed
    const validSessions = sessions.filter((sess) => {
      const subj = subjects.find((s) => s.name === sess.subject);
      if (!subj) return true;
      return new Date(subj.examDate) >= date;
    });

    if (validSessions.length > 0) {
      timetable.push({ date: toDateOnly(date), sessions: validSessions });
    }
  }

  return timetable;
}

async function generate(rawInput) {
  // 1. Validate input
  const input = TimetableInputSchema.parse(rawInput);

  try {
    const provider = getProvider();
    const prompt = buildTimetablePrompt(input);

    const rawResponse = await callWithResilience(() =>
      provider.complete(prompt, { json: true, maxTokens: 1500 })
    );

    const repaired = cleanAndRepairJson(rawResponse);
    const parsedJson = JSON.parse(repaired);

    // Accept either the new compact weeklyPlan OR legacy full timetable format
    let timetable;
    if (parsedJson.weeklyPlan && Array.isArray(parsedJson.weeklyPlan)) {
      timetable = expandWeeklyPlan(parsedJson.weeklyPlan, input);
    } else if (parsedJson.timetable && Array.isArray(parsedJson.timetable)) {
      timetable = parsedJson.timetable;
    } else {
      throw new Error("Unexpected AI response shape");
    }

    if (!timetable || timetable.length === 0) {
      throw new Error("AI returned empty timetable");
    }

    return {
      timetable,
      metadata: {
        generatedBy: "ai",
        generatedAt: new Date().toISOString(),
        totalDays: timetable.length,
      },
    };
  } catch (err) {
    console.warn(
      `[timetableGenerator] AI generation failed, using rule-based fallback: ${err.message}`
    );
    return ruleBasedTimetable.generate(input);
  }
}

module.exports = { generate };
