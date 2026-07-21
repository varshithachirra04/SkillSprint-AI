# SkillSprint AI 🚀

An intelligent, gamified study planning platform powered by AI.

## Features

- 📅 **AI Timetable Generator** — Personalized study schedules based on your subjects and exam dates
- 🔄 **Adaptive Rescheduling** — Auto-redistributes missed sessions
- ⏱️ **Pomodoro Timer** — Focus sessions with SVG ring progress
- 🔥 **Streak & XP System** — GitHub-style heatmap, levels, and badges
- 🧠 **AI Quiz Generator** — MCQ quizzes with instant feedback
- 💡 **Concept Simplifier** — Feynman technique AI explanations
- 📝 **Notes Summarizer** — Extract summaries, bullets, and key terms
- 💬 **Study AI Chatbot** — Context-aware study assistant
- 🏆 **Leaderboard** — Compete with other students by XP
- 📊 **Analytics** — Weekly stats, subject performance, heatmap

## Tech Stack

**Frontend:** React 18, Vite, React Router v6, Vanilla CSS  
**Backend:** Node.js, Express, MongoDB, Mongoose, JWT  
**AI:** Google Gemini API (pluggable — supports OpenAI or mock mode)

## Getting Started

### Prerequisites
- Node.js 18+
- MongoDB (local or Atlas)

### Backend Setup
```bash
cd backend
npm install
# Create .env file with:
# MONGODB_URI=mongodb://localhost:27017/skillsprint
# JWT_SECRET=your-secret
# AI_PROVIDER=gemini
# GEMINI_API_KEY=your-key
# GEMINI_MODEL=gemini-2.0-flash
npm run dev
```

### Frontend Setup
```bash
cd frontend
npm install
npm run dev
```

Open `http://localhost:5173` in your browser.

## Environment Variables

| Variable | Description |
|---|---|
| `MONGODB_URI` | MongoDB connection string |
| `JWT_SECRET` | Secret for JWT signing |
| `AI_PROVIDER` | `gemini`, `openai`, or `mock` |
| `GEMINI_API_KEY` | Google Gemini API key |
| `GEMINI_MODEL` | e.g. `gemini-2.0-flash` |

## License

MIT
