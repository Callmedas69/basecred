/**
 * Get Activity Log Use Case
 *
 * Business logic for retrieving agent activity logs.
 * Requires wallet signature verification with timestamp expiry.
 */

import { createActivityRepository } from "@/repositories/activityRepository"
import { verifyWalletSignature } from "@/lib/verifyWalletSignature"
import type { ActivityEntry } from "@/types/apiKeys"

export async function getActivityLog(
  address: string,
  signature: string,
  message: string,
  limit?: number
): Promise<ActivityEntry[]> {
  const isValid = await verifyWalletSignature(address, signature, message)
  if (!isValid) {
    throw new Error("Invalid or expired wallet signature")
  }

  const repo = createActivityRepository()
  return repo.getActivities(address, limit)
}
