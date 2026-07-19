const AIProvider = require("./providerInterface");

/**
 * MockProvider — returns canned/deterministic responses instead of calling a real API.
 * Useful for:
 *  - Teammates who don't have an API key yet
 *  - Fast local dev / demos without burning quota
 *  - CI tests
 * Set AI_PROVIDER=mock in .env to use this.
 */
class MockProvider extends AIProvider {
  async complete(prompt, options = {}) {
    if (options.json) {
      // Return a minimal valid timetable-shaped JSON so downstream validation passes.
      return JSON.stringify({
        timetable: [
          {
            date: new Date().toISOString().slice(0, 10),
            sessions: [
              { subject: "Sample Subject", topic: "Sample Topic", duration: 60, priority: "medium" },
            ],
          },
        ],
      });
    }
    return "This is a mock AI response. Set AI_PROVIDER=openai and OPENAI_API_KEY to use a real model.";
  }

  async chat(messages, options = {}) {
    const lastUserMsg = [...messages].reverse().find((m) => m.role === "user");
    return `Mock chatbot reply to: "${lastUserMsg?.content ?? ""}". Configure a real provider for real answers.`;
  }
}

module.exports = MockProvider;
