const { getProvider } = require("../providers/providerFactory");
const { callWithResilience } = require("../utils/resilience");
const { buildTimetablePrompt } = require("../utils/promptTemplates");
const { TimetableInputSchema, TimetableOutputSchema } = require("../utils/schemas");
const ruleBasedTimetable = require("../fallback/ruleBasedTimetable");

/**
 * Strips accidental markdown code fences some models add despite instructions.
 */
function cleanJsonString(raw) {
  return raw.replace(/^```(json)?/i, "").replace(/```$/, "").trim();
}

async function generate(rawInput) {
  // 1. Validate input first — if this fails, it's a caller bug, not an AI issue, so throw.
  const input = TimetableInputSchema.parse(rawInput);

  try {
    const provider = getProvider();
    const prompt = buildTimetablePrompt(input);

    const rawResponse = await callWithResilience(() =>
      provider.complete(prompt, { json: true, maxTokens: 3000 })
    );

    const parsedJson = JSON.parse(cleanJsonString(rawResponse));
    const validated = TimetableOutputSchema.parse(parsedJson);

    return {
      ...validated,
      metadata: {
        ...validated.metadata,
        generatedBy: "ai",
        generatedAt: new Date().toISOString(),
        totalDays: validated.timetable.length,
      },
    };
  } catch (err) {
    console.warn(`[timetableGenerator] AI generation failed, using rule-based fallback: ${err.message}`);
    return ruleBasedTimetable.generate(input);
  }
}

module.exports = { generate };
