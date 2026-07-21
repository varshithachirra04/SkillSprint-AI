const MAX_RETRIES = Number(process.env.AI_MAX_RETRIES ?? 3);
const TIMEOUT_MS = Number(process.env.AI_REQUEST_TIMEOUT_MS ?? 30000); // 30 seconds timeout
const BREAKER_THRESHOLD = Number(process.env.AI_CIRCUIT_BREAKER_THRESHOLD ?? 8);
const BREAKER_COOLDOWN_MS = Number(process.env.AI_CIRCUIT_BREAKER_COOLDOWN_MS ?? 30000);

// --- Circuit breaker state ---
const breakerState = {
  consecutiveFailures: 0,
  openUntil: 0,
};

function isBreakerOpen() {
  return Date.now() < breakerState.openUntil;
}

function recordSuccess() {
  breakerState.consecutiveFailures = 0;
  breakerState.openUntil = 0;
}

function recordFailure(err) {
  // CRITICAL: Do NOT count rate limit errors as circuit breaker failures.
  // Rate limits mean the API is active but we are hitting it too fast.
  if (isRateLimitError(err)) {
    return;
  }

  breakerState.consecutiveFailures += 1;
  if (breakerState.consecutiveFailures >= BREAKER_THRESHOLD) {
    breakerState.openUntil = Date.now() + BREAKER_COOLDOWN_MS;
    console.warn(
      `[circuit-breaker] OPEN — ${breakerState.consecutiveFailures} consecutive hard AI failures. ` +
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
  const msg = (err?.message || "").toLowerCase();
  return status === 429 || msg.includes("quota exceeded") || msg.includes("too many requests");
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Runs fn() with retries + backoff + timeout + circuit breaker.
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
        
        if (attempt === maxRetries) {
          recordFailure(err);
          throw err;
        }
        
        // Wait 4 seconds on rate limit, allowing rolling window to shift
        await sleep(4000);
        continue;
      }

      const isLastAttempt = attempt === maxRetries;
      if (isLastAttempt) {
        recordFailure(err);
        throw err;
      }

      const backoffMs = 1000 * Math.pow(2, attempt); // 1s, 2s, 4s...
      console.warn(
        `[ai] Attempt ${attempt + 1} failed (${err.message}). Retrying in ${backoffMs}ms...`
      );
      await sleep(backoffMs);
    }
  }

  throw lastError;
}

module.exports = { callWithResilience, isRateLimitError };
