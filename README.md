# SkillSprint AI — AI Integration Service

This is the AI integration layer for SkillSprint AI: timetable generation, daily
study goals, motivational tips, and a study-doubts chatbot — with a service
layer so the rest of the app never talks to an AI provider directly, and a
rule-based fallback so the app keeps working even if the AI API fails.

## 1. Setup

```bash
cd skillsprint-ai
npm install
cp .env.example .env
```

Edit `.env`:
- To run WITHOUT any API key (useful for teammates, demos, offline dev):
  `AI_PROVIDER=mock`
- To run with real OpenAI:
  `AI_PROVIDER=openai` and set `OPENAI_API_KEY=...`

Start the server:
```bash
npm start
```
Server runs at `http://localhost:4000`. Check `GET /health` to confirm it's up.

## 2. Architecture

```
src/
  providers/          ← swap AI vendors here, nowhere else
    providerInterface.js   the contract every provider implements
    openaiProvider.js      real OpenAI implementation
    mockProvider.js        canned responses, no API key needed
    providerFactory.js     picks a provider based on AI_PROVIDER env var
  utils/
    resilience.js       retry + backoff + timeout + circuit breaker
    schemas.js           zod schemas = the JSON contract with the rest of the app
    promptTemplates.js   all prompts, centralized for easy tuning
  fallback/
    ruleBasedTimetable.js  zero-AI-dependency timetable generator
  generators/
    timetableGenerator.js       AI timetable + auto fallback
    dailyGoalsGenerator.js      AI daily goals + auto fallback
    motivationTipsGenerator.js  AI tips + static fallback list
    chatbotService.js           multi-turn chatbot, separate from the above
  aiService.js         ← THE ONLY FILE THE REST OF THE APP SHOULD IMPORT
  server.js             Express REST wrapper around aiService.js
tests/
  ruleBasedTimetable.test.js   run with: node --test tests/*.test.js
```

### The one rule for the team
Nothing outside `aiService.js` (and the files it internally imports) should
ever `require("openai")` or call an AI SDK directly. Everyone else — frontend,
backend routes, DB layer — calls:

```js
const aiService = require("./src/aiService");

await aiService.generateTimetable({ subjects, hoursPerDay, studyDays, startDate });
await aiService.generateDailyGoals({ date, timetable });
await aiService.generateTip({ subject, mood });
await aiService.chat({ messages, subjectContext });
```

If we switch from OpenAI to Claude, Gemini, or a local model later, only
`src/providers/` changes — every function signature above stays identical.

## 3. REST API (if another team member's app calls this over HTTP instead of importing it directly)

| Endpoint             | Method | Body                                              |
|-----------------------|--------|----------------------------------------------------|
| `/api/timetable`      | POST   | `{ subjects, hoursPerDay, studyDays, startDate }`   |
| `/api/daily-goals`    | POST   | `{ date, timetable }`                               |
| `/api/tips`           | POST   | `{ subject?, mood? }`                               |
| `/api/chat`           | POST   | `{ messages, subjectContext? }`                     |
| `/health`             | GET    | —                                                    |

See `src/utils/schemas.js` for the exact shape of every input/output.

## 4. How the fallback works

Every AI-backed generator follows the same pattern:
1. Call the AI provider with a timeout + retry (exponential backoff).
2. Validate the JSON response against a zod schema.
3. **Any failure at any step** (timeout, rate limit / 429, invalid JSON, schema
   mismatch, provider error) → automatically fall back:
   - Timetable → `fallback/ruleBasedTimetable.js` (weighted by exam proximity + weak topics)
   - Daily goals → directly slices today's sessions from the existing timetable
   - Tips → random pick from a static list in `motivationTipsGenerator.js`
   - Chatbot → friendly "try again" message (no rule-based chat is realistic)

A circuit breaker (`utils/resilience.js`) also trips after repeated
consecutive failures, so if the AI API is down the whole app doesn't keep
retrying it uselessly — it goes straight to fallback for a cooldown period.

Every response includes `metadata.generatedBy` (`"ai"` or `"rule-based"` /
`"static"`) so the frontend can optionally show a subtle indicator, and so
you can prove during your demo/presentation that the fallback actually works.

## 5. Testing

```bash
node --test tests/*.test.js
```

The fallback tests run with **zero dependencies and no API key** — this is
intentional, since the fallback is your safety net and needs to be provably
solid on its own.

To manually test the AI path failing over to fallback, temporarily set an
invalid `OPENAI_API_KEY` in `.env` and hit `/api/timetable` — you should get
a valid response with `metadata.generatedBy: "rule-based"`.

## 6. Example request

```bash
curl -X POST http://localhost:4000/api/timetable \
  -H "Content-Type: application/json" \
  -d '{
    "subjects": [
      { "name": "Physics", "examDate": "2026-08-15", "weakTopics": ["Thermodynamics", "Optics"] },
      { "name": "Chemistry", "examDate": "2026-08-20", "weakTopics": [] }
    ],
    "hoursPerDay": 3,
    "studyDays": ["Mon","Tue","Wed","Thu","Fri","Sat"],
    "startDate": "2026-07-20"
  }'
```

## 7. Next steps / things to extend

- Add a `claudeProvider.js` or `geminiProvider.js` under `src/providers/` if you
  want to compare models — register it in `providerFactory.js`.
- Add streaming to `/api/chat` for a better chatbot UX (swap `chat()` in the
  provider to a streaming call, and switch the Express route to SSE).
- Persist chat history server-side (currently the caller passes the full
  `messages` array each time — fine for a project, but a DB-backed session
  would scale better).
