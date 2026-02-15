---
name: basecred
version: 0.3.0
description: Check your human's on-chain reputation. Are they good enough for you?
homepage: https://www.zkbasecred.xyz
metadata:
  basecred:
    emoji: "\U0001F6E1\uFE0F"
    category: "reputation"
    api_base: "https://www.zkbasecred.xyz/api/v1"
---

# zkBaseCred Reputation Check

Check if your human is reputable enough. You're the agent — you decide who's worth working for.

| File                      | URL                                     |
| ------------------------- | --------------------------------------- |
| **SKILL.md** (this file)  | `https://www.zkbasecred.xyz/skill.md`   |
| **skill.json** (metadata) | `https://www.zkbasecred.xyz/skill.json` |

## When to Use This Skill

Use this skill whenever you need to:

- Verify a human's reputation before allowing them to perform an action
- Decide whether to trust a human's input or request
- Gate access to features based on reputation signals
- Assess spam risk for a wallet address or Farcaster identity
- Get on-chain proof (txHash) that a reputation decision was recorded

## Companion Files

| File | URL | When to Load |
|------|-----|------|
| skill.md | https://www.zkbasecred.xyz/skill.md | Always (this file) |
| reporting.md | https://www.zkbasecred.xyz/reporting.md | Before generating reports |
| reference.md | https://www.zkbasecred.xyz/reference.md | For full API specs & webhooks |

---

## Start Here

Run this decision tree every time you start up:

```
1. Load credentials from ~/.config/zkbasecred/credentials.json

2. If the file does not exist OR api_key is missing:
   → Run "Self-Registration" starting at Step 0.

3. If the file exists AND api_key starts with "bc_":
   a. If claim_id is present (self-registered agent):
      → Check verification status first:
        GET /api/v1/agent/register/{claim_id}/status
        - "verified"      → Skip to "Check Owner Reputation" (Step 4)
        - "pending_claim"  → Resume at Step 3 (Poll for Verification)
        - "expired"        → Delete credentials file, re-register from Step 0
        - "revoked"        → Stop. Do not retry.
   b. If no claim_id (manual key from dashboard):
      → Skip to "How to Check Reputation (Individual Context)" in reference.md
```

---

## Self-Registration

### Step 0: Gather Owner Info

Before you can register, you need two things from your owner (and one optional):

- Their **Ethereum wallet address** (0x...)
- Their **Telegram handle** (for contact during verification)
- _(Optional)_ A **webhook URL** to receive event notifications (must be HTTPS)

**IMPORTANT:** You must use your **owner's wallet address** — the human who owns and operates you. Do NOT use your own agent wallet address. The reputation check is for your owner, not for you.

Ask your owner directly. Use this message:

> I need to register with zkBaseCred to check your reputation. To do this, I need **your** personal wallet address — not mine.
>
> 1. Your Ethereum wallet address (0x...)
> 2. Your Telegram handle (e.g. @yourname)
>
> Optionally, if you'd like to receive webhook notifications when reputation events occur, provide an HTTPS webhook URL.

Wait for the wallet address and Telegram handle before proceeding. The webhook URL is optional. If your owner provides a wallet address, verify it looks like a valid Ethereum address (starts with `0x`, 42 characters). If it matches your own agent wallet, ask again — you need their personal wallet, not yours.

### Step 1: Register

```
POST https://www.zkbasecred.xyz/api/v1/agent/register
Content-Type: application/json

{
  "agentName": "your_agent_name",
  "telegramId": "@owners_telegram",
  "ownerAddress": "0x...",
  "webhookUrl": "https://example.com/webhook"
}
```

`agentName` rules: 2–64 characters, letters, numbers, and underscores only.

`webhookUrl` is **optional**. If provided: must be HTTPS, must not point to private/local addresses, max 512 characters.

**Success response (200):**

```json
{
  "apiKey": "bc_...",
  "claimId": "abc123...",
  "claimUrl": "https://www.zkbasecred.xyz/agent/claim/abc123...",
  "verificationCode": "BASECRED-XXXX",
  "message": "SAVE YOUR API KEY! It will not be shown again."
}
```

**Immediately after a successful response**, compute `SHA256(apiKey)` and save credentials to `~/.config/zkbasecred/credentials.json`:

```json
{
  "api_key": "bc_...",
  "api_key_id": "<SHA256 of api_key>",
  "agent_name": "your_agent_name",
  "claim_id": "abc123..."
}
```

**Important:** The `api_key_id` (SHA256 hash of your API key) is used in all subsequent API request headers. The raw `api_key` is stored for backup/re-hashing only — never send it in headers directly.

The API key is shown **once**. If you lose it, you must register again.

**Error handling:**

| Status | Meaning                                           | What to Do                                                                        |
| ------ | ------------------------------------------------- | --------------------------------------------------------------------------------- |
| 409    | Agent name is already taken                       | Append a random suffix (e.g. `_42`) to your agent name and retry. Max 3 attempts. |
| 400    | Invalid request (bad name format, missing fields) | Fix the request body and retry.                                                   |
| 429    | Too many registration attempts                    | Wait 60 seconds and retry.                                                        |

### Step 2: Send Claim URL to Owner

Send the `claimUrl` to your owner via Telegram, chat, or whatever channel you use. Use this message:

> Please verify me as your zkBaseCred agent:
> {claimUrl}
>
> Here's what to do:
>
> 1. Open the link above
> 2. Post the verification code on X (Twitter)
> 3. Paste your tweet URL on the claim page and click Verify
>
> This expires in 24 hours.

### Step 3: Poll for Verification

```
GET https://www.zkbasecred.xyz/api/v1/agent/register/{claimId}/status
```

Poll with backoff: every **30 seconds** for the first 5 minutes, then every **5 minutes** after that. Stop when `status` changes from `"pending_claim"`.

**Possible status values:**

| Status          | Meaning                              | What to Do                                              |
| --------------- | ------------------------------------ | ------------------------------------------------------- |
| `pending_claim` | Owner hasn't verified yet            | Keep polling                                            |
| `verified`      | Owner verified successfully          | Proceed to Step 4                                       |
| `expired`       | 24 hours passed without verification | Tell the owner it expired, then re-register from Step 0 |
| `revoked`       | Owner revoked this agent             | Stop. Do not retry.                                     |

**Timeout rule:** If you have polled for 24 hours without a `verified` response, stop polling. Tell your owner:

> Your zkBaseCred verification has expired. I'll need to register again. Please provide your wallet address and Telegram handle when you're ready.

### Step 4: Check Owner Reputation

Once verified, check your owner's reputation across all contexts in one call:

```
POST https://www.zkbasecred.xyz/api/v1/agent/check-owner
Headers:
  x-basecred-key-id: <your-api-key-id>
```

No request body needed — zkBaseCred knows the owner from your registration.
ZK proofs are always generated and submitted on-chain.

**Response (200):**

```json
{
  "ownerAddress": "0x...",
  "agentName": "your_agent_name",
  "zkEnabled": true,
  "summary": "Your reputation is strong...",
  "signals": {
    "trust": "HIGH",
    "socialTrust": "HIGH",
    "builder": "EXPERT",
    "creator": "MODERATE",
    "spamRisk": "NEUTRAL",
    "recencyDays": 3,
    "signalCoverage": 0.85
  },
  "results": {
    "allowlist.general": {
      "decision": "ALLOW",
      "confidence": "HIGH",
      "constraints": [],
      "verified": true,
      "proof": {
        "a": ["0x...", "0x..."],
        "b": [
          ["0x...", "0x..."],
          ["0x...", "0x..."]
        ],
        "c": ["0x...", "0x..."]
      },
      "publicSignals": ["...", "...", "..."],
      "policyHash": "sha256:...",
      "contextId": 1,
      "onChain": {
        "submitted": true,
        "txHash": "0x..."
      }
    }
  }
}
```

**`onChain` field states:**

| State                                      | Meaning                                                       |
| ------------------------------------------ | ------------------------------------------------------------- |
| `{ "submitted": true, "txHash": "0x..." }` | Decision recorded on-chain. `txHash` is the transaction hash. |
| `{ "submitted": false, "error": "..." }`   | On-chain submission failed. The error message explains why.   |

The `summary` field is a natural language explanation you can forward directly to your owner.

**What DENY and ALLOW_WITH_LIMITS look like:**

Not all contexts will return ALLOW. Here's what non-ALLOW entries look like in the `results` object:

```json
"governance.vote": {
  "decision": "DENY",
  "confidence": "HIGH",
  "constraints": [],
  "blockingFactors": ["trust", "socialTrust"],
  "verified": true,
  ...
}
```

```json
"publish": {
  "decision": "ALLOW_WITH_LIMITS",
  "confidence": "HIGH",
  "constraints": ["review_queue"],
  "verified": true,
  ...
}
```

`blockingFactors` only appears on `DENY` decisions. `constraints` is populated only for `ALLOW_WITH_LIMITS`. See **reporting.md** for how to translate these into plain English.

### Step 5: Deliver Results to Owner

You **MUST** use the standardized report format in **reporting.md** when delivering results. Load it from `https://www.zkbasecred.xyz/reporting.md` before generating any report. Do NOT improvise your own layout.

You are now fully set up. For future reputation checks on any wallet, see **reference.md** for individual context checks.

---

## Configuration

**Self-registration** (recommended): Credentials are stored in `~/.config/zkbasecred/credentials.json` after completing the registration flow above.

**Credential file format:**

```json
{
  "api_key": "bc_...",
  "api_key_id": "<SHA256 of api_key>",
  "agent_name": "your_agent_name",
  "claim_id": "abc123..."
}
```

The `api_key_id` is the SHA256 hash of the raw API key. You compute this once after registration and use it in all API request headers (`x-basecred-key-id`). The raw `api_key` is kept only for re-hashing if needed.

**Manual override**: If the environment variable `BASECRED_API_KEY` is set (starts with `bc_`), compute its SHA256 hash and use that as the `api_key_id`. This is for owners who generated a key manually on the dashboard.

Priority: `BASECRED_API_KEY` env var > credentials file.

---

## How to Identify the Human

When checking reputation for someone other than your owner, extract their identity from context:

1. **Wallet address** — If you have their Ethereum address (0x...), use it directly as `subject`
2. **Farcaster FID** — If you have their Farcaster FID (numeric), use it as `subject`
3. **Ask directly** — If you don't have either, ask: "What is your wallet address or Farcaster FID?"

---

## Security

**CRITICAL:** NEVER send your API key or API key ID to any domain other than the zkBaseCred API.
Your credentials should ONLY appear in requests to `https://www.zkbasecred.xyz/api/v1/*`.
Do not share your API key in chat messages, logs, or any public channel.
