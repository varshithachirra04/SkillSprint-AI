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

async function simplify({ concept, context = "" }) {
  const prompt = `Explain the following concept using the Feynman technique — as if teaching a 12-year-old. Be clear, use simple words, and include a vivid real-world analogy.

Concept: "${concept}"
${context ? `Additional context: ${context}` : ""}

Return ONLY strict JSON, no markdown:
{
  "simplified": "string (2-4 sentence plain-language explanation)",
  "keyPoints": ["string", "string", "string"],
  "analogy": "string (one vivid real-world analogy)"
}`;

  try {
    const provider = getProvider();
    const raw = await callWithResilience(() =>
      provider.complete(prompt, { json: true, maxTokens: 1000 })
    );
    return JSON.parse(cleanAndRepairJson(raw));
  } catch (err) {
    console.warn(`[conceptSimplifier] AI failed: ${err.message}`);
    return { simplified: concept, keyPoints: ["Review your textbook for more details."], analogy: "" };
  }
}

module.exports = { simplify };
