/**
 * AIProvider — the contract every provider (OpenAI, Claude, local model, mock, etc.)
 * must implement. Nothing outside /providers should ever import a vendor SDK directly.
 *
 * To add a new provider: create a new file in this folder that implements
 * `complete()` and `chat()`, then register it in providerFactory.js.
 */
class AIProvider {
  /**
   * Single-shot completion (used by timetable/goals/tips generators).
   * @param {string} prompt
   * @param {{ json?: boolean, maxTokens?: number, temperature?: number }} options
   * @returns {Promise<string>} raw text response
   */
  async complete(prompt, options = {}) {
    throw new Error("complete() not implemented by this provider");
  }

  /**
   * Multi-turn chat completion (used by the chatbot endpoint).
   * @param {{role: "system"|"user"|"assistant", content: string}[]} messages
   * @param {{maxTokens?: number, temperature?: number}} options
   * @returns {Promise<string>} raw text response
   */
  async chat(messages, options = {}) {
    throw new Error("chat() not implemented by this provider");
  }
}

module.exports = AIProvider;
