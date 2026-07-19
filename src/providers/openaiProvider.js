const OpenAI = require("openai");
const AIProvider = require("./providerInterface");

class OpenAIProvider extends AIProvider {
  constructor() {
    super();
    this.client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    this.model = process.env.OPENAI_MODEL || "gpt-4o-mini";
  }

  async complete(prompt, options = {}) {
    const response = await this.client.chat.completions.create({
      model: this.model,
      messages: [{ role: "user", content: prompt }],
      temperature: options.temperature ?? 0.7,
      max_tokens: options.maxTokens ?? 1200,
      ...(options.json ? { response_format: { type: "json_object" } } : {}),
    });
    return response.choices[0]?.message?.content ?? "";
  }

  async chat(messages, options = {}) {
    const response = await this.client.chat.completions.create({
      model: this.model,
      messages,
      temperature: options.temperature ?? 0.6,
      max_tokens: options.maxTokens ?? 500,
    });
    return response.choices[0]?.message?.content ?? "";
  }
}

module.exports = OpenAIProvider;
