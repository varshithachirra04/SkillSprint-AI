const { z } = require("zod");

/* ---------- INPUT SCHEMAS (what the rest of the app sends us) ---------- */

const SubjectInputSchema = z.object({
  name: z.string().min(1),
  examDate: z.string().min(1), // ISO date string, e.g. "2026-08-15"
  weakTopics: z.array(z.string()).default([]),
});

const TimetableInputSchema = z.object({
  subjects: z.array(SubjectInputSchema).min(1),
  hoursPerDay: z.number().positive(),
  studyDays: z.array(z.string()).min(1), // e.g. ["Mon","Tue","Wed"]
  startDate: z.string().min(1),
});

/* ---------- OUTPUT SCHEMAS (what we promise to return) ---------- */

const SessionSchema = z.object({
  subject: z.string(),
  topic: z.string(),
  duration: z.number().positive(), // minutes
  priority: z.enum(["low", "medium", "high"]),
});

const DaySchema = z.object({
  date: z.string(),
  sessions: z.array(SessionSchema),
});

const TimetableOutputSchema = z.object({
  timetable: z.array(DaySchema),
  metadata: z
    .object({
      generatedBy: z.enum(["ai", "rule-based"]),
      generatedAt: z.string().optional(),
      totalDays: z.number().optional(),
    })
    .optional(),
});

const DailyGoalsOutputSchema = z.object({
  date: z.string(),
  goals: z.array(
    z.object({
      subject: z.string(),
      goal: z.string(),
      estimatedMinutes: z.number().positive(),
    })
  ),
  metadata: z.object({ generatedBy: z.enum(["ai", "rule-based"]) }).optional(),
});

const TipOutputSchema = z.object({
  tip: z.string().min(1),
  metadata: z.object({ generatedBy: z.enum(["ai", "static"]) }).optional(),
});

const ChatMessageSchema = z.object({
  role: z.enum(["system", "user", "assistant"]),
  content: z.string(),
});

const ChatRequestSchema = z.object({
  messages: z.array(ChatMessageSchema).min(1),
  subjectContext: z.array(z.string()).optional(), // e.g. ["Physics","Chemistry"] to scope the bot
});

module.exports = {
  TimetableInputSchema,
  TimetableOutputSchema,
  DailyGoalsOutputSchema,
  TipOutputSchema,
  ChatRequestSchema,
};
