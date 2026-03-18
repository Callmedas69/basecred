/**
 * Retry helper for SDK repository fetch calls.
 *
 * Inspired by retrySimulate() in decisionRegistryRepository.ts.
 * Retries once on transient HTTP errors (429, 5xx) with Retry-After respect.
 */
/**
 * Execute a fetch function with one retry on transient failures.
 *
 * @param fn - Function that performs the fetch and returns a Response
 * @param maxAttempts - Total attempts (default: 2 = 1 original + 1 retry)
 */
export declare function retryFetch(fn: () => Promise<Response>, maxAttempts?: number): Promise<Response>;
//# sourceMappingURL=retry.d.ts.map