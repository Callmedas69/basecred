/**
 * Retry helper for SDK repository fetch calls.
 *
 * Inspired by retrySimulate() in decisionRegistryRepository.ts.
 * Retries once on transient HTTP errors (429, 5xx) with Retry-After respect.
 */
const TRANSIENT_STATUS_CODES = new Set([429, 500, 502, 503, 504]);
const MAX_RETRY_AFTER_MS = 5_000;
/**
 * Execute a fetch function with one retry on transient failures.
 *
 * @param fn - Function that performs the fetch and returns a Response
 * @param maxAttempts - Total attempts (default: 2 = 1 original + 1 retry)
 */
export async function retryFetch(fn, maxAttempts = 2) {
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
        const response = await fn();
        // If success or non-transient error, return immediately
        if (response.ok || !TRANSIENT_STATUS_CODES.has(response.status)) {
            return response;
        }
        // On last attempt, return the error response as-is
        if (attempt >= maxAttempts - 1) {
            return response;
        }
        // Respect Retry-After header, capped at 5s
        const retryAfterHeader = response.headers.get('Retry-After');
        let delayMs = 1_000; // default 1s
        if (retryAfterHeader) {
            const parsed = parseInt(retryAfterHeader, 10);
            if (!Number.isNaN(parsed) && parsed > 0) {
                delayMs = Math.min(parsed * 1_000, MAX_RETRY_AFTER_MS);
            }
        }
        await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
    // Unreachable, but TypeScript needs this
    throw new Error('retryFetch: unreachable');
}
