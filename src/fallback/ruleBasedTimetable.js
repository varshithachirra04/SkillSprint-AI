/**
 * Rule-based fallback timetable generator.
 * Used when the AI provider fails, times out, is rate-limited, or returns
 * invalid JSON. MUST produce output in the exact same shape as the AI path
 * (see schemas.js) so downstream code never needs to know which one ran.
 *
 * Strategy:
 *  - Subjects with closer exam dates get higher priority + more frequent sessions.
 *  - Subjects with weak topics get those topics scheduled more often, and at higher priority.
 *  - Sessions are round-robin distributed across available study days until
 *    hoursPerDay is filled or every subject has been scheduled at least once.
 */

const DAY_NAME_MAP = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function toDateOnly(d) {
  return d.toISOString().slice(0, 10);
}

function daysBetween(a, b) {
  const MS_PER_DAY = 1000 * 60 * 60 * 24;
  return Math.round((b - a) / MS_PER_DAY);
}

function priorityForDaysLeft(daysLeft) {
  if (daysLeft <= 7) return "high";
  if (daysLeft <= 21) return "medium";
  return "low";
}

/**
 * Weighted "urgency" score — closer exam + more weak topics = higher weight,
 * meaning that subject shows up more often in the round-robin rotation.
 */
function computeWeight(subject, today) {
  const examDate = new Date(subject.examDate);
  const daysLeft = Math.max(1, daysBetween(today, examDate));
  const urgency = 1 / daysLeft; // closer exam -> bigger number
  const weakBoost = 1 + (subject.weakTopics?.length || 0) * 0.5;
  return urgency * weakBoost;
}

function pickTopic(subject, roundIndex) {
  if (subject.weakTopics && subject.weakTopics.length > 0) {
    // Cycle through weak topics more often than a generic "review" slot
    return subject.weakTopics[roundIndex % subject.weakTopics.length];
  }
  return `${subject.name} - General Review`;
}

function generate(input) {
  const { subjects, hoursPerDay, studyDays, startDate } = input;
  const totalMinutesPerDay = hoursPerDay * 60;

  const today = new Date(startDate);
  const latestExamDate = subjects.reduce((latest, s) => {
    const d = new Date(s.examDate);
    return d > latest ? d : latest;
  }, today);

  const totalDays = Math.max(1, daysBetween(today, latestExamDate) + 1);

  // Precompute weights once
  const weightedSubjects = subjects.map((s) => ({
    ...s,
    weight: computeWeight(s, today),
  }));
  const totalWeight = weightedSubjects.reduce((sum, s) => sum + s.weight, 0);

  const timetable = [];
  let globalRound = 0;

  for (let dayOffset = 0; dayOffset < totalDays; dayOffset++) {
    const date = new Date(today);
    date.setDate(date.getDate() + dayOffset);
    const dayName = DAY_NAME_MAP[date.getDay()];

    // Skip days not in the student's available study days
    if (!studyDays.includes(dayName)) continue;

    const daysLeftGlobal = daysBetween(date, latestExamDate);
    const sessions = [];
    let minutesUsed = 0;

    // Allocate session slots proportional to each subject's weight until the day is full
    // (minimum session length: 20 minutes, so we don't create dust-sized sessions)
    const MIN_SESSION_MINUTES = 20;
    let safetyCounter = 0;

    while (minutesUsed < totalMinutesPerDay && safetyCounter < 50) {
      safetyCounter++;
      const remaining = totalMinutesPerDay - minutesUsed;
      if (remaining < MIN_SESSION_MINUTES) break;

      // Pick subject proportional to weight (simple weighted round robin)
      const pick =
        weightedSubjects[globalRound % weightedSubjects.length];
      globalRound++;

      const subjectDaysLeft = Math.max(1, daysBetween(date, new Date(pick.examDate)));
      // Skip scheduling a subject after its own exam has passed
      if (new Date(pick.examDate) < date) continue;

      const sessionMinutes = Math.min(
        remaining,
        Math.max(MIN_SESSION_MINUTES, Math.round((pick.weight / totalWeight) * totalMinutesPerDay))
      );

      sessions.push({
        subject: pick.name,
        topic: pickTopic(pick, dayOffset),
        duration: sessionMinutes,
        priority: priorityForDaysLeft(Math.min(subjectDaysLeft, daysLeftGlobal)),
      });

      minutesUsed += sessionMinutes;
    }

    if (sessions.length > 0) {
      timetable.push({ date: toDateOnly(date), sessions });
    }
  }

  return {
    timetable,
    metadata: {
      generatedBy: "rule-based",
      generatedAt: new Date().toISOString(),
      totalDays: timetable.length,
    },
  };
}

module.exports = { generate };
