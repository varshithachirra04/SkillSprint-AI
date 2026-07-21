const AIProvider = require("./providerInterface");

/**
 * GeminiProvider — uses Google Gemini API via direct REST fetch.
 * Compatible with express-mode AQ. keys using v1beta endpoint.
 */
class GeminiProvider extends AIProvider {
  constructor() {
    super();
    this.apiKey = process.env.GEMINI_API_KEY;
    this.modelName = process.env.GEMINI_MODEL || "gemini-flash-latest";
    this.baseUrl = "https://generativelanguage.googleapis.com/v1beta";
  }

  _buildUrl(endpoint) {
    return (
      this.baseUrl +
      "/models/" +
      this.modelName +
      ":" +
      endpoint +
      "?key=" +
      this.apiKey
    );
  }

  async _post(endpoint, body) {
    const url = this._buildUrl(endpoint);
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    const data = await res.json();

    if (!res.ok) {
      const msg =
        data?.error?.message || "HTTP " + res.status;
      const err = new Error("[GoogleGenerativeAI Error]: " + msg);
      if (res.status === 429) err.status = 429;
      throw err;
    }

    const text =
      data?.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
    return text;
  }

  async complete(prompt, options = {}) {
    // Build generation config
    const generationConfig = {
      temperature: options.temperature != null ? options.temperature : 0.7,
      maxOutputTokens: options.maxTokens != null ? options.maxTokens : 1200,
      ...(options.json ? { responseMimeType: "application/json" } : {}),
    };

    const body = {
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig,
    };

    return this._post("generateContent", body);
  }

  async chat(messages, options = {}) {
    const systemMessage = messages.find(function (m) {
      return m.role === "system";
    });
    const conversation = messages.filter(function (m) {
      return m.role !== "system";
    });

    const contents = conversation.map(function (m) {
      return {
        role: m.role === "assistant" ? "model" : "user",
        parts: [{ text: m.content }],
      };
    });

    const generationConfig = {
      temperature: options.temperature != null ? options.temperature : 0.6,
      maxOutputTokens: options.maxTokens != null ? options.maxTokens : 500,
    };

    const body = { contents, generationConfig };

    // systemInstruction is supported in v1beta but with a specific structure
    if (systemMessage && systemMessage.content) {
      body.systemInstruction = {
        role: "user",
        parts: [{ text: systemMessage.content }],
      };
    }

    return this._post("generateContent", body);
  }
}

module.exports = GeminiProvider;
