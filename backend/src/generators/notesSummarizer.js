const { getProvider } = require("../providers/providerFactory");
const { callWithResilience } = require("../utils/resilience");

function cleanAndRepairJson(raw) {
  let s = raw.replace(/^```(json)?/im, "").replace(/```$/m, "").trim();
  try { JSON.parse(s); return s; } catch (_) {
    let opens = 0, arrOpens = 0, inString = false, escape = false;
    for (const ch of s) {
      if (escape) { escape = false; continue; }
      if (ch === "\\" && inString) { escape = true; continue; }
      if (ch === '"') { inString = !inString; continue; }
      if (inString) continue;
      if (ch === "{") opens++; else if (ch === "}") opens--;
      else if (ch === "[") arrOpens++; else if (ch === "]") arrOpens--;
    }
    s = s.replace(/,\s*$/, "");
    for (let i = 0; i < arrOpens; i++) s += "]";
    for (let i = 0; i < opens; i++) s += "}";
    return s;
  }
}

async function summarize({ notes, subject = "" }) {
  const prompt = `Summarize the following study notes${subject ? ` for ${subject}` : ""} into concise bullet points. Extract key terms and write a 2-sentence overview.

Notes:
"""
${notes.slice(0, 3000)}
"""

Return ONLY strict JSON, no markdown:
{
  "summary": "string (2-sentence overview)",
  "bulletPoints": ["string", "string", ...],
  "keyTerms": ["term1", "term2", ...]
}
- bulletPoints: 5-10 items, each a short actionable/important fact
- keyTerms: 5-8 important vocabulary words or concepts`;

  try {
    const provider = getProvider();
    const raw = await callWithResilience(() =>
      provider.complete(prompt, { json: true, maxTokens: 1500 })
    );
    return JSON.parse(cleanAndRepairJson(raw));
  } catch (err) {
    console.warn(`[notesSummarizer] AI failed: ${err.message}`);
    return { summary: "Could not summarize notes.", bulletPoints: [], keyTerms: [] };
  }
}

module.exports = { summarize };
