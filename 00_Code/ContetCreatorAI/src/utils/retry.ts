const RETRYABLE_MESSAGES = ["rate limit", "timeout", "network", "fetch", "503", "429"];

function isRetryable(err: unknown): boolean {
  const msg = err instanceof Error ? err.message.toLowerCase() : String(err).toLowerCase();
  return RETRYABLE_MESSAGES.some((keyword) => msg.includes(keyword));
}

export async function withRetry<T>(
  fn: () => Promise<T>,
  maxAttempts = 3,
  delayMs = 1000
): Promise<T> {
  let lastError: unknown;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastError = err;

      const shouldRetry = attempt < maxAttempts && isRetryable(err);
      if (!shouldRetry) throw err;

      await new Promise((resolve) => setTimeout(resolve, delayMs * attempt));
    }
  }

  throw lastError;
}
