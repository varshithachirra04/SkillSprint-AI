const test = require("node:test");
const assert = require("node:assert");
const ruleBasedTimetable = require("../src/fallback/ruleBasedTimetable");

test("generates a timetable that stays within daily hour limits", () => {
  const input = {
    subjects: [
      { name: "Physics", examDate: "2026-08-05", weakTopics: ["Thermodynamics", "Optics"] },
      { name: "Chemistry", examDate: "2026-08-20", weakTopics: [] },
    ],
    hoursPerDay: 3,
    studyDays: ["Mon", "Tue", "Wed", "Thu", "Fri"],
    startDate: "2026-07-20",
  };

  const result = ruleBasedTimetable.generate(input);

  assert.ok(result.timetable.length > 0, "should generate at least one day");
  assert.strictEqual(result.metadata.generatedBy, "rule-based");

  for (const day of result.timetable) {
    const totalMinutes = day.sessions.reduce((sum, s) => sum + s.duration, 0);
    assert.ok(
      totalMinutes <= input.hoursPerDay * 60,
      `day ${day.date} exceeds hoursPerDay limit: ${totalMinutes} minutes`
    );
  }
});

test("prioritizes subject with closer exam date and weak topics (within its own active window)", () => {
  const input = {
    subjects: [
      { name: "Math", examDate: "2026-07-25", weakTopics: ["Calculus"] },
      { name: "History", examDate: "2026-12-01", weakTopics: [] },
    ],
    hoursPerDay: 2,
    studyDays: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
    startDate: "2026-07-20",
  };

  const result = ruleBasedTimetable.generate(input);

  const beforeMathExam = result.timetable.filter((d) => d.date <= "2026-07-25");
  const mathMinutes = beforeMathExam
    .flatMap((d) => d.sessions)
    .filter((s) => s.subject === "Math")
    .reduce((sum, s) => sum + s.duration, 0);
  const historyMinutes = beforeMathExam
    .flatMap((d) => d.sessions)
    .filter((s) => s.subject === "History")
    .reduce((sum, s) => sum + s.duration, 0);

  assert.ok(
    mathMinutes >= historyMinutes,
    `Math should get at least as much time as History before its own exam. Math=${mathMinutes}min, History=${historyMinutes}min`
  );

  const afterMathExam = result.timetable.filter((d) => d.date > "2026-07-25");
  const mathSessionsAfterExam = afterMathExam.flatMap((d) => d.sessions).filter((s) => s.subject === "Math");
  assert.strictEqual(mathSessionsAfterExam.length, 0, "Math should not be scheduled after its exam date");
});

test("handles a single subject with no weak topics without crashing", () => {
  const input = {
    subjects: [{ name: "Biology", examDate: "2026-07-30", weakTopics: [] }],
    hoursPerDay: 1,
    studyDays: ["Mon", "Wed", "Fri"],
    startDate: "2026-07-20",
  };

  const result = ruleBasedTimetable.generate(input);
  assert.ok(result.timetable.length > 0);
  assert.strictEqual(result.metadata.generatedBy, "rule-based");
});
