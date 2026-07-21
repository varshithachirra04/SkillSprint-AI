const { getProvider } = require("../providers/providerFactory");
const { callWithResilience } = require("../utils/resilience");
const { buildMotivationTipPrompt } = require("../utils/promptTemplates");
const { TipOutputSchema } = require("../utils/schemas");

function cleanJsonString(raw) {
  let s = raw
    .replace(/^```(json)?/im, "")
    .replace(/```$/m, "")
    .trim();

  // Auto-repair truncated JSON by closing any open braces/brackets
  try {
    JSON.parse(s);
    return s;
  } catch (_) {
    let opens = 0, arrOpens = 0, inString = false, escape = false;
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
    s = s.replace(/,\s*$/, "");
    for (let i = 0; i < arrOpens; i++) s += "]";
    for (let i = 0; i < opens; i++) s += "}";
    return s;
  }
}


// Static fallback pool — used if the AI call fails. Keep these genuinely useful,
// not generic fortune-cookie filler.
const STATIC_TIPS = [
  "Progress beats perfection — a messy 25-minute session still moves you forward.",
  "You don't need to feel motivated to start. Starting is what creates the motivation.",
  "Break it down: one small topic done today is one less thing standing between you and exam day.",
  "Tired brains retain less. A 10-minute walk can be worth more than another hour of forcing it.",
  "You've prepared for tougher things than this exam. Trust the work you've already put in.",
  "Focus on the next 25 minutes, not the whole syllabus. That's how it actually gets done.",
  "Mistakes in practice now are cheaper than mistakes in the exam. Get them out of the way today.",
  "Your weak topics won't stay weak if you keep showing up for them.",
];

function pickStaticTip() {
  return STATIC_TIPS[Math.floor(Math.random() * STATIC_TIPS.length)];
}

async function generate({ subject, mood } = {}) {
  try {
    const provider = getProvider();
    const prompt = buildMotivationTipPrompt({ subject, mood });

    const rawResponse = await callWithResilience(() =>
      provider.complete(prompt, { json: true, maxTokens: 500, temperature: 0.7 })
    );

    const parsed = JSON.parse(cleanJsonString(rawResponse));
    const validated = TipOutputSchema.parse(parsed);

    return { ...validated, metadata: { generatedBy: "ai" } };
  } catch (err) {
    console.warn(`[motivationTipsGenerator] AI generation failed, using static fallback: ${err.message}`);
    return { tip: pickStaticTip(), metadata: { generatedBy: "static" } };
  }
}

module.exports = { generate };
