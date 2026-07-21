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

const FALLBACK_QUIZ = (subject, topic) => ({
  questions: [
    { question: `What is a key concept in ${topic}?`, options: ["Concept A", "Concept B", "Concept C", "Concept D"], correctIndex: 0, explanation: "Review your notes on this topic." },
    { question: `Which statement about ${subject} is correct?`, options: ["Statement A", "Statement B", "Statement C", "Statement D"], correctIndex: 0, explanation: "Check your textbook for details." },
    { question: `${topic} is best described as:`, options: ["Option A", "Option B", "Option C", "Option D"], correctIndex: 0, explanation: "Refer to your study materials." },
  ],
});

async function generate({ subject, topic }) {
  const prompt = `Generate exactly 5 multiple-choice quiz questions about "${topic}" in the subject "${subject}".
Return ONLY strict JSON, no markdown:
{
  "questions": [
    {
      "question": "string",
      "options": ["string", "string", "string", "string"],
      "correctIndex": 0,
      "explanation": "string (1-2 sentences)"
    }
  ]
}
Rules:
- Each question must have exactly 4 options
- correctIndex is 0-3 (index of the correct option)
- Questions should test genuine understanding, not just memorization
- explanations should clarify WHY the answer is correct
Return ONLY the JSON object.`;

  try {
    const provider = getProvider();
    const raw = await callWithResilience(() =>
      provider.complete(prompt, { json: true, maxTokens: 2000 })
    );
    const parsed = JSON.parse(cleanAndRepairJson(raw));
    return parsed;
  } catch (err) {
    console.warn(`[quizGenerator] AI failed, using fallback: ${err.message}`);
    return FALLBACK_QUIZ(subject, topic);
  }
}

module.exports = { generate };
