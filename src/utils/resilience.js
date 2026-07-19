/**
 * Resilience helpers: retry with backoff, timeout wrapping, and a lightweight
 * circuit breaker so we stop hammering a failing/rate-limited AI API and
 * fall back faster instead of retrying forever.
 */

const MAX_RETRIES = Number(process.env.AI_MAX_RETRIES ?? 2);
const TIMEOUT_MS = Number(process.env.AI_REQUEST_TIMEOUT_MS ?? 15000);
const BREAKER_THRESHOLD = Number(process.env.AI_CIRCUIT_BREAKER_THRESHOLD ?? 4);
const BREAKER_COOLDOWN_MS = Number(process.env.AI_CIRCUIT_BREAKER_COOLDOWN_MS ?? 60000);

// --- Circuit breaker state (in-memory; fine for a single-instance app/project) ---
const breakerState = {
  consecutiveFailures: 0,
  openUntil: 0, // timestamp; while Date.now() < openUntil, breaker is OPEN (skip AI calls)
};

function isBreakerOpen() {
  return Date.now() < breakerState.openUntil;
}

function recordSuccess() {
  breakerState.consecutiveFailures = 0;
  breakerState.openUntil = 0;
}

function recordFailure() {
  breakerState.consecutiveFailures += 1;
  if (breakerState.consecutiveFailures >= BREAKER_THRESHOLD) {
    breakerState.openUntil = Date.now() + BREAKER_COOLDOWN_MS;
    console.warn(
      `[circuit-breaker] OPEN — ${breakerState.consecutiveFailures} consecutive AI failures. ` +
        `Skipping AI calls for ${BREAKER_COOLDOWN_MS}ms.`
    );
  }
}

function withTimeout(promise, ms) {
  return Promise.race([
    promise,
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error(`AI request timed out after ${ms}ms`)), ms)
    ),
  ]);
}

function isRateLimitError(err) {
  const status = err?.status || err?.response?.status;
  return status === 429;
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Runs fn() with retries + exponential backoff + timeout + circuit breaker.
 * Throws on final failure (caller should catch and fall back to rule-based logic).
 */
async function callWithResilience(fn, { maxRetries = MAX_RETRIES, timeoutMs = TIMEOUT_MS } = {}) {
  if (isBreakerOpen()) {
    throw new Error("Circuit breaker is open — AI provider recently failed repeatedly.");
  }

  let lastError;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const result = await withTimeout(fn(), timeoutMs);
      recordSuccess();
      return result;
    } catch (err) {
      lastError = err;

      if (isRateLimitError(err)) {
        console.warn(`[ai] Rate limited (attempt ${attempt + 1}/${maxRetries + 1}).`);
        // Back off longer for rate limits, then let the caller decide (usually: go to fallback)
        recordFailure();
        throw err;
      }

      const isLastAttempt = attempt === maxRetries;
      if (isLastAttempt) {
        recordFailure();
        throw err;
      }

      const backoffMs = 500 * Math.pow(2, attempt); // 500ms, 1000ms, 2000ms...
      console.warn(
        `[ai] Attempt ${attempt + 1} failed (${err.message}). Retrying in ${backoffMs}ms...`
      );
      await sleep(backoffMs);
    }
  }

  throw lastError;
}

module.exports = { callWithResilience, isRateLimitError };
