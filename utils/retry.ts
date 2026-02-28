const DEFAULT_MAX_RETRIES = 3;
const DEFAULT_DELAY_MS = 1000;

export async function withRetry<T>(
  fn: () => Promise<T>,
  options?: { maxRetries?: number; delayMs?: number }
): Promise<T> {
  const maxRetries = options?.maxRetries ?? DEFAULT_MAX_RETRIES;
  const delayMs = options?.delayMs ?? DEFAULT_DELAY_MS;
  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err));
      if (attempt < maxRetries) {
        await new Promise((r) => setTimeout(r, delayMs * attempt));
      }
    }
  }

  throw lastError ?? new Error('Unknown retry failure');
}
