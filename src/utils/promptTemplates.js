/**
 * Centralized prompt templates. Keeping prompts here (instead of inline in
 * generators) makes them easy to tune/version without touching business logic.
 */

function buildTimetablePrompt(input) {
  const { subjects, hoursPerDay, studyDays, startDate } = input;

  const subjectLines = subjects
    .map(
      (s) =>
        `- ${s.name} | exam date: ${s.examDate} | weak topics: ${
          s.weakTopics?.length ? s.weakTopics.join(", ") : "none specified"
        }`
    )
    .join("\n");

  return `You are a study-planning assistant. Generate a study timetable as STRICT JSON matching this exact schema, and return ONLY the JSON, no markdown fences, no commentary:

{
  "timetable": [
    {
      "date": "YYYY-MM-DD",
      "sessions": [
        { "subject": "string", "topic": "string", "duration": number (minutes), "priority": "low"|"medium"|"high" }
      ]
    }
  ]
}

Rules:
- Start date: ${startDate}
- Available study days each week: ${studyDays.join(", ")}
- Available hours per study day: ${hoursPerDay}
- Plan every day up until the LATEST exam date among the subjects below.
- Subjects closer to their exam date should get more/higher-priority sessions as their date approaches.
- Subjects with weak topics listed should have those topics prioritized and appear more frequently.
- Do not exceed ${hoursPerDay} hours (${hoursPerDay * 60} minutes) of total session duration per day.
- Distribute subjects reasonably across the week; avoid cramming a single subject into consecutive days unless the exam is very close.

Subjects:
${subjectLines}

Return ONLY the JSON object described above.`;
}

function buildDailyGoalsPrompt({ date, todaySessions }) {
  const sessionLines = todaySessions
    .map((s) => `- ${s.subject}: ${s.topic} (${s.duration} min, priority: ${s.priority})`)
    .join("\n");

  return `You are a study coach. Based on today's (${date}) scheduled study sessions below, write 2-4 short, specific, actionable daily goals. Return ONLY strict JSON, no markdown:

{
  "date": "${date}",
  "goals": [
    { "subject": "string", "goal": "string (short, actionable, e.g. 'Solve 10 problems on Thermodynamics')", "estimatedMinutes": number }
  ]
}

Today's sessions:
${sessionLines}

Return ONLY the JSON object.`;
}

function buildMotivationTipPrompt({ subject, mood } = {}) {
  const context = subject ? ` The student is currently studying ${subject}.` : "";
  const moodContext = mood ? ` They report feeling ${mood}.` : "";
  return `Give ONE short, genuine, non-cheesy motivational tip (max 2 sentences) for a student studying for exams.${context}${moodContext} Return ONLY strict JSON: {"tip": "string"}`;
}

function buildChatbotSystemPrompt(subjectContext = []) {
  const scope = subjectContext.length
    ? `The student is currently studying: ${subjectContext.join(", ")}. `
    : "";
  return `You are SkillSprint AI's study doubt-solving assistant. ${scope}Help the student understand concepts, work through problems, and clarify doubts related to their studies. Keep answers clear and focused. If asked something unrelated to studying/academics, gently redirect back to study help. Do not discuss unrelated topics like politics, entertainment gossip, etc.`;
}

module.exports = {
  buildTimetablePrompt,
  buildDailyGoalsPrompt,
  buildMotivationTipPrompt,
  buildChatbotSystemPrompt,
};
