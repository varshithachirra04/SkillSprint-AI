const { getProvider } = require("../providers/providerFactory");
const { callWithResilience } = require("../utils/resilience");
const { buildChatbotSystemPrompt } = require("../utils/promptTemplates");
const { ChatRequestSchema } = require("../utils/schemas");

const FRIENDLY_FAILURE_MESSAGE =
  "I'm having trouble connecting right now. Please try again in a moment — " +
  "in the meantime, try breaking your question into smaller parts or checking your notes/textbook.";

/**
 * reply — handles one chatbot turn. Caller (backend/frontend team) is
 * responsible for persisting conversation history and passing the full
 * `messages` array each time (this service is stateless by design so it
 * doesn't need its own DB access).
 */
async function reply(rawInput) {
  const input = ChatRequestSchema.parse(rawInput);

  const systemPrompt = buildChatbotSystemPrompt(input.subjectContext);
  const fullMessages = [{ role: "system", content: systemPrompt }, ...input.messages];

  try {
    const provider = getProvider();
    const text = await callWithResilience(() =>
      provider.chat(fullMessages, { maxTokens: 1500, temperature: 0.5 })
    );

    return { reply: text, metadata: { generatedBy: "ai" } };
  } catch (err) {
    console.warn(`[chatbotService] AI chat failed: ${err.message}`);
    // No rule-based fallback for a conversational chatbot — a canned reply is safer
    // and more honest than the app pretending to answer a doubt it can't.
    return { reply: FRIENDLY_FAILURE_MESSAGE, metadata: { generatedBy: "fallback-message" } };
  }
}

module.exports = { reply };
