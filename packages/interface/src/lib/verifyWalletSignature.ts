/**
 * Shared wallet signature verification with timestamp expiry.
 * Used by all dashboard API routes that require wallet authentication.
 */

import { verifyMessage } from "viem"

const SIGNATURE_MAX_AGE_MS = 5 * 60 * 1000 // 5 minutes

/**
 * Verify a wallet signature and check that the embedded timestamp
 * is within the allowed window.
 *
 * Expected message format:
 *   BaseCred Dashboard\nTimestamp: <unix-ms>
 */
export async function verifyWalletSignature(
  address: string,
  signature: string,
  message: string
): Promise<boolean> {
  // Extract and validate timestamp from message
  const timestampMatch = message.match(/Timestamp:\s*(\d+)/)
  if (!timestampMatch) return false

  const messageTimestamp = parseInt(timestampMatch[1], 10)
  if (isNaN(messageTimestamp)) return false

  const age = Date.now() - messageTimestamp
  if (age < 0 || age > SIGNATURE_MAX_AGE_MS) return false

  try {
    return await verifyMessage({
      address: address as `0x${string}`,
      message,
      signature: signature as `0x${string}`,
    })
  } catch {
    return false
  }
}
