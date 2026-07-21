const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:4000";

async function request(path, { method = "GET", body, token } = {}) {
  const headers = { "Content-Type": "application/json" };
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `Request failed (${res.status})`);
  return data;
}

export const api = {
  // Auth
  register: (payload) => request("/api/auth/register", { method: "POST", body: payload }),
  login: (payload) => request("/api/auth/login", { method: "POST", body: payload }),
  me: (token) => request("/api/auth/me", { token }),

  // Timetable
  generateTimetable: (payload, token) => request("/api/timetable", { method: "POST", body: payload, token }),
  getLatestTimetable: (token) => request("/api/timetable/latest", { token }),
  toggleSession: (timetableId, payload, token) =>
    request(`/api/timetable/${timetableId}/session`, { method: "PATCH", body: payload, token }),
  rescheduleMissed: (timetableId, token) =>
    request(`/api/timetable/${timetableId}/reschedule`, { method: "POST", token }),

  // Coach
  getDailyGoals: (date, token) => request(`/api/daily-goals?date=${date}`, { token }),
  getTip: (payload, token) => request("/api/tips", { method: "POST", body: payload, token }),

  // Chat
  sendChatMessage: (payload, token) => request("/api/chat", { method: "POST", body: payload, token }),
  getChatHistory: (token) => request("/api/chat/history", { token }),

  // Streak & XP
  getStreak: (token) => request("/api/streak", { token }),
  markStudied: (token) => request("/api/streak/mark-studied", { method: "POST", token }),

  // Quiz
  generateQuiz: (payload, token) => request("/api/quiz/generate", { method: "POST", body: payload, token }),
  getQuizzes: (token) => request("/api/quiz", { token }),
  getQuiz: (id, token) => request(`/api/quiz/${id}`, { token }),
  submitQuiz: (id, answers, token) => request(`/api/quiz/${id}/submit`, { method: "POST", body: { answers }, token }),

  // AI Tools
  simplify: (payload, token) => request("/api/tools/simplify", { method: "POST", body: payload, token }),
  summarize: (payload, token) => request("/api/tools/summarize", { method: "POST", body: payload, token }),

  // Analytics
  getWeeklyReport: (token) => request("/api/analytics/weekly-report", { token }),
  getSubjectPerformance: (token) => request("/api/analytics/subject-performance", { token }),

  // Pomodoro
  logPomodoro: (payload, token) => request("/api/pomodoro", { method: "POST", body: payload, token }),
  getTodaySessions: (token) => request("/api/pomodoro/today", { token }),
  getPomodoroStats: (token) => request("/api/pomodoro/stats", { token }),

  // Leaderboard
  getLeaderboard: () => request("/api/leaderboard"),
};
