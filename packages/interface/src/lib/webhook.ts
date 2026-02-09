/**
 * Webhook Utility
 *
 * Fire-and-forget POST to external webhook URLs.
 * HTTPS only, SSRF-safe, 5s timeout, no retries.
 */

export interface WebhookPayload {
  event: "reputation.checked" | "agent.verified" | "agent.revoked"
  timestamp: number
  agentName: string
  ownerAddress: string
  data: Record<string, unknown>
}

const WEBHOOK_TIMEOUT_MS = 5_000
const MAX_WEBHOOK_URL_LENGTH = 512

// Private IP ranges (SSRF prevention)
const PRIVATE_HOSTNAMES = [
  "localhost",
  "127.0.0.1",
  "[::1]",
]

const PRIVATE_IP_PREFIXES = [
  "10.",
  "172.16.", "172.17.", "172.18.", "172.19.",
  "172.20.", "172.21.", "172.22.", "172.23.",
  "172.24.", "172.25.", "172.26.", "172.27.",
  "172.28.", "172.29.", "172.30.", "172.31.",
  "192.168.",
  "169.254.",
  "0.",
]

function isPrivateHost(hostname: string): boolean {
  const lower = hostname.toLowerCase()
  if (PRIVATE_HOSTNAMES.includes(lower)) return true
  if (PRIVATE_IP_PREFIXES.some((prefix) => lower.startsWith(prefix))) return true
  if (lower.endsWith(".local") || lower.endsWith(".internal")) return true
  return false
}

/**
 * Validates a webhook URL: must be HTTPS, not pointing to private IPs, max 512 chars.
 * Returns null if valid, error message string if invalid.
 */
export function validateWebhookUrl(url: string): string | null {
  if (url.length > MAX_WEBHOOK_URL_LENGTH) {
    return `webhookUrl must be ${MAX_WEBHOOK_URL_LENGTH} characters or fewer`
  }

  let parsed: URL
  try {
    parsed = new URL(url)
  } catch {
    return "webhookUrl must be a valid URL"
  }

  if (parsed.protocol !== "https:") {
    return "webhookUrl must use HTTPS"
  }

  if (isPrivateHost(parsed.hostname)) {
    return "webhookUrl must not point to a private or local address"
  }

  return null
}

/**
 * Sends a webhook payload to the given URL.
 * Fire-and-forget: 5s timeout, no retries, errors are logged and swallowed.
 */
export async function sendWebhook(url: string, payload: WebhookPayload): Promise<void> {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), WEBHOOK_TIMEOUT_MS)

  try {
    await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      signal: controller.signal,
    })
  } catch (err) {
    // Fire-and-forget: log and swallow
    console.error(`Webhook delivery failed for ${url}:`, err instanceof Error ? err.message : err)
  } finally {
    clearTimeout(timeout)
  }
}
