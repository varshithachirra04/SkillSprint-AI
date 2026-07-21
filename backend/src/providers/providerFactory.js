/**
 * providerFactory — the ONE place in the whole codebase that decides which
 * AI provider is actually used. To swap models/vendors later, add a new
 * provider file and add a case here. Nothing else in the app needs to change.
 */
const OpenAIProvider = require("./openaiProvider");
const GeminiProvider = require("./geminiProvider");
const MockProvider = require("./mockProvider");

let cachedProvider = null;

function getProvider() {
  if (cachedProvider) return cachedProvider;

  const providerName = (process.env.AI_PROVIDER || "mock").toLowerCase();

  switch (providerName) {
    case "openai":
      cachedProvider = new OpenAIProvider();
      break;
    case "gemini":
      cachedProvider = new GeminiProvider();
      break;
    case "mock":
      cachedProvider = new MockProvider();
      break;
    // case "claude":
    //   cachedProvider = new ClaudeProvider(); // add this file when you're ready
    //   break;
    default:
      throw new Error(`Unknown AI_PROVIDER "${providerName}". Use "openai", "gemini", or "mock".`);
  }

  return cachedProvider;
}

module.exports = { getProvider };
