const { getProvider } = require("../providers/providerFactory");
const { callWithResilience } = require("../utils/resilience");
const { buildDailyGoalsPrompt } = require("../utils/promptTemplates");
const { DailyGoalsOutputSchema } = require("../utils/schemas");
const { z } = require("zod");

function cleanJsonString(raw) {
  return raw.replace(/^```(json)?/i, "").replace(/```$/, "").trim();
}

const InputSchema = z.object({
  date: z.string(),
  timetable: z.array(
    z.object({
      date: z.string(),
      sessions: z.array(
        z.object({
          subject: z.string(),
          topic: z.string(),
          duration: z.number(),
          priority: z.enum(["low", "medium", "high"]),
        })
      ),
    })
  ),
});

/** Rule-based fallback: today's sessions become goals directly, no rephrasing. */
function ruleBasedGoals(date, todaySessions) {
  return {
    date,
    goals: todaySessions.map((s) => ({
      subject: s.subject,
      goal: `Study ${s.topic} for ${s.duration} minutes`,
      estimatedMinutes: s.duration,
    })),
    metadata: { generatedBy: "rule-based" },
  };
}

async function generate(rawInput) {
  const input = InputSchema.parse(rawInput);
  const dayEntry = input.timetable.find((d) => d.date === input.date);
  const todaySessions = dayEntry?.sessions ?? [];

  if (todaySessions.length === 0) {
    return { date: input.date, goals: [], metadata: { generatedBy: "rule-based" } };
  }

  try {
    const provider = getProvider();
    const prompt = buildDailyGoalsPrompt({ date: input.date, todaySessions });

    const rawResponse = await callWithResilience(() =>
      provider.complete(prompt, { json: true, maxTokens: 500 })
    );

    const parsed = JSON.parse(cleanJsonString(rawResponse));
    const validated = DailyGoalsOutputSchema.parse(parsed);

    return { ...validated, metadata: { generatedBy: "ai" } };
  } catch (err) {
    console.warn(`[dailyGoalsGenerator] AI generation failed, using fallback: ${err.message}`);
    return ruleBasedGoals(input.date, todaySessions);
  }
}

module.exports = { generate };
