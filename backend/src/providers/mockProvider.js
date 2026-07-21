const AIProvider = require("./providerInterface");

/**
 * MockProvider — returns canned/deterministic responses instead of calling a real API.
 * Dynamically returns appropriate shapes depending on the prompt type.
 */
class MockProvider extends AIProvider {
  async complete(prompt, options = {}) {
    if (options.json) {
      const p = (prompt || "").toLowerCase();

      // 1. Quiz Generator Prompt
      if (p.includes("quiz") || p.includes("mcq")) {
        return JSON.stringify({
          questions: [
            {
              question: "What does HTML stand for?",
              options: [
                "HyperText Markup Language",
                "HighText Machine Language",
                "HyperTabular Markup Language",
                "None of the above",
              ],
              correctIndex: 0,
              explanation: "HTML is the standard markup language for creating web pages.",
            },
            {
              question: "Which of the following is a CSS framework?",
              options: ["React", "Django", "Tailwind", "Node.js"],
              correctIndex: 2,
              explanation: "Tailwind CSS is a utility-first CSS framework.",
            },
            {
              question: "What is the primary function of a database?",
              options: ["Compile code", "Store and manage data", "Style web pages", "None"],
              correctIndex: 1,
              explanation: "Databases are designed to systematically store, retrieve, and manage data.",
            },
          ],
        });
      }

      // 2. Concept Simplifier Prompt
      if (p.includes("simplify") || p.includes("feynman")) {
        // Extract concept if possible
        const match = prompt.match(/Concept: "([^"]+)"/i);
        const conceptName = match ? match[1] : "Concept";
        return JSON.stringify({
          simplified: `Imagine ${conceptName} is like a giant library where books are organized on specific shelves. Instead of searching everywhere, you just go to the correct shelf directly.`,
          keyPoints: [
            "It groups related things together for easy access.",
            "It saves time by avoiding random searches.",
            "It provides a clear system for organization.",
          ],
          analogy: "It is like organizing clothes in drawers instead of throwing them all in a pile on the floor.",
        });
      }

      // 3. Notes Summarizer Prompt
      if (p.includes("summarize") || p.includes("notes")) {
        return JSON.stringify({
          summary: "These notes outline the fundamental concepts of study organization, highlighting key components of consistent habits.",
          bulletPoints: [
            "Break study sessions into 25-minute Pomodoro intervals.",
            "Prioritize subjects based on exam closeness and topic complexity.",
            "Active recall and testing are highly effective memory techniques.",
            "Schedule regular breaks to prevent brain fatigue.",
          ],
          keyTerms: ["Pomodoro", "Active Recall", "Fatigue", "Consistency"],
        });
      }

      // 4. Motivation Tips Prompt
      if (p.includes("motivation") || p.includes("tip")) {
        return JSON.stringify({
          tip: "Focus on the next 25 minutes, not the whole syllabus. That is how it actually gets done.",
        });
      }

      // 5. Daily Goals Prompt
      if (p.includes("daily") || p.includes("goals")) {
        return JSON.stringify({
          date: new Date().toISOString().slice(0, 10),
          goals: [
            { subject: "Computer Science", goal: "Understand Stack Operations", estimatedMinutes: 45 },
            { subject: "Physics", goal: "Read Laws of Thermodynamics", estimatedMinutes: 45 },
          ],
        });
      }

      // 6. Default: Timetable / Weekly Plan Prompt
      if (p.includes("weeklyplan") || p.includes("weekly plan")) {
        return JSON.stringify({
          weeklyPlan: [
            {
              dayOfWeek: "Mon",
              sessions: [
                { subject: "Computer Science", topic: "Stack Operations", duration: 45, priority: "high" },
                { subject: "Physics", topic: "First Law of Thermodynamics", duration: 45, priority: "medium" },
              ],
            },
            {
              dayOfWeek: "Wed",
              sessions: [
                { subject: "Computer Science", topic: "Queue Operations", duration: 45, priority: "high" },
              ],
            },
          ],
        });
      }

      // Legacy fallback timetable
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
    const query = lastUserMsg?.content || "";

    if (query.toLowerCase().includes("thermodynamics")) {
      return "Thermodynamics is the branch of physics that deals with the relationships between heat, work, temperature, and energy. In simple terms, it explains how thermal energy is converted to and from other forms of energy and how it affects matter.";
    }

    return `Mock chatbot reply to: "${query}". Configure a real provider for real answers.`;
  }
}

module.exports = MockProvider;
