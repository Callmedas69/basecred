/**
 * Manage API Keys Use Case
 *
 * Business logic for API key CRUD operations.
 * All operations require wallet signature verification with timestamp expiry.
 */

import { createHash, randomBytes } from "crypto"
import { createApiKeyRepository } from "@/repositories/apiKeyRepository"
import { verifyWalletSignature } from "@/lib/verifyWalletSignature"
import type { ApiKeyInfo } from "@/types/apiKeys"

const KEY_PREFIX = "bc_"

function hashKey(key: string): string {
  return createHash("sha256").update(key).digest("hex")
}

function makeKeyPrefix(key: string): string {
  // Show first 12 and last 4 chars: "bc_abcd1234...ef56"
  return key.slice(0, 12) + "..." + key.slice(-4)
}

export async function generateApiKey(
  address: string,
  signature: string,
  message: string,
  label?: string
): Promise<{ key: string; keyId: string; keyPrefix: string }> {
  const isValid = await verifyWalletSignature(address, signature, message)
  if (!isValid) {
    throw new Error("Invalid or expired wallet signature")
  }

  // Generate random API key: bc_ + 32 random bytes as hex (64 chars)
  const randomPart = randomBytes(32).toString("hex")
  const key = `${KEY_PREFIX}${randomPart}`
  const keyHash = hashKey(key)
  const keyPrefix = makeKeyPrefix(key)

  const repo = createApiKeyRepository()
  await repo.createKey(address, label || "Default", keyHash, keyPrefix)

  return { key, keyId: keyHash, keyPrefix }
}

export async function listApiKeys(
  address: string,
  signature: string,
  message: string
): Promise<ApiKeyInfo[]> {
  const isValid = await verifyWalletSignature(address, signature, message)
  if (!isValid) {
    throw new Error("Invalid or expired wallet signature")
  }

  const repo = createApiKeyRepository()
  return repo.listKeys(address)
}

export async function revokeApiKey(
  keyId: string,
  address: string,
  signature: string,
  message: string
): Promise<boolean> {
  const isValid = await verifyWalletSignature(address, signature, message)
  if (!isValid) {
    throw new Error("Invalid or expired wallet signature")
  }

  const repo = createApiKeyRepository()
  return repo.revokeKey(keyId, address)
}
