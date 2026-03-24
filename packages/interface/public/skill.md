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
        - "revoked"        → Tell your owner: "Your zkBaseCred registration has been revoked. If this was unintentional, please re-register." Then stop. Do not retry.
   b. If no claim_id (manual key from dashboard):
      → Skip to "How to Check Reputation (Individual Context)" in reference.md
```

---

## Self-Registration

### Step 0: Gather Owner Info

Before you can register, you need two things from your owner (and one optional):

- Their **Ethereum wallet address** (0x...)
- A **contact handle** (for reaching you during verification — Telegram, Discord, X, etc.)
- _(Optional)_ A **webhook URL** to receive event notifications (must be HTTPS)

**IMPORTANT:** You must use your **owner's wallet address** — the human who owns and operates you. Do NOT use your own agent wallet address. The reputation check is for your owner, not for you.

Ask your owner directly. Use this message:

> I need to register with zkBaseCred to check your reputation. To do this, I need **your** personal wallet address — not mine.
>
> 1. Your Ethereum wallet address (0x...)
> 2. A contact handle (e.g. @yourname on Telegram, Discord, X, etc.)
>
> Optionally, if you'd like to receive webhook notifications when reputation events occur, provide an HTTPS webhook URL.

Wait for the wallet address and contact handle before proceeding. The webhook URL is optional. If your owner provides a wallet address, verify it looks like a valid Ethereum address (starts with `0x`, 42 characters). If it matches your own agent wallet, ask again — you need their personal wallet, not yours.

### Step 1: Register

```
POST https://www.zkbasecred.xyz/api/v1/agent/register
Content-Type: application/json

{
  "agentName": "your_agent_name",
  "contactHandle": "@owners_handle",
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

**Immediately after a successful response**, compute `SHA256(apiKey)` and save credentials:

```bash
mkdir -p ~/.config/zkbasecred
chmod 700 ~/.config/zkbasecred
```

Write `~/.config/zkbasecred/credentials.json`:

```json
{
  "api_key_id": "<SHA256 of api_key>",
  "agent_name": "your_agent_name",
  "claim_id": "abc123..."
}
```

Then restrict file permissions (Unix/macOS):

```bash
chmod 600 ~/.config/zkbasecred/credentials.json
```

**Important:** The `api_key_id` (SHA256 hash of your API key) is used as the HMAC secret for all authenticated requests. Do NOT store the raw `api_key` — discard it after computing the SHA256 hash. If you lose the hash, you must register again.

The API key is shown **once**. If you lose it, you must register again.

**Error handling:**

| Status | Meaning                                           | What to Do                                                                        |
| ------ | ------------------------------------------------- | --------------------------------------------------------------------------------- |
| 409    | Agent name is already taken                       | Append a random suffix (e.g. `_42`) to your agent name and retry. Max 3 attempts. If all 3 fail, ask your owner to manually provide a unique agent name. |
| 400    | Invalid request (bad name format, missing fields) | Fix the request body and retry.                                                   |
| 429    | Too many registration attempts                    | Read the `Retry-After` HTTP header and wait that many seconds. If the header is missing, wait 60 seconds. |

### Step 2: Send Claim URL to Owner

Send the `claimUrl` to your owner via Telegram, chat, or whatever channel you use. Use this message:

> Please verify me as your zkBaseCred agent:
> {claimUrl}
>
> Here's what to do:
>
> **Option A (recommended):** Open the link, connect your wallet, and sign a verification message.
> **Option B:** Open the link, post the verification code on X (Twitter), then paste your tweet URL.
>
> This expires in 24 hours.

### Step 3: Poll for Verification

```
GET https://www.zkbasecred.xyz/api/v1/agent/register/{claimId}/status
```

Poll with backoff: every **30 seconds** for the first 5 minutes, then every **5 minutes** after that. Stop when `status` changes from `"pending_claim"`.

**Resilience:** If you receive a network timeout or 5xx server error, do not abort. Continue polling on schedule. If you receive a `429` response, read the `Retry-After` header and wait that many seconds before the next poll.

**Possible status values:**

| Status          | Meaning                              | What to Do                                              |
| --------------- | ------------------------------------ | ------------------------------------------------------- |
| `pending_claim` | Owner hasn't verified yet            | Keep polling                                            |
| `verified`      | Owner verified successfully          | Proceed to Step 4                                       |
| `expired`       | 24 hours passed without verification | Tell the owner it expired, then re-register from Step 0 |
| `revoked`       | Owner revoked this agent             | Tell your owner their registration was revoked. Stop. Do not retry. |

**Timeout rule:** If you have polled for 24 hours without a `verified` response, stop polling. Tell your owner:

> Your zkBaseCred verification has expired. I'll need to register again. Please provide your wallet address and contact handle when you're ready.

### Step 4: Check Owner Reputation

Once verified, check your owner's reputation across all contexts in one call:

```
POST https://www.zkbasecred.xyz/api/v1/agent/check-owner
Headers:
  x-basecred-key-id: <your-api-key-id>
  x-basecred-timestamp: <unix-ms>
  x-basecred-signature: <hmac-sha256>
```

No request body needed — zkBaseCred knows the owner from your registration.
See "Making Authenticated Requests" below for how to compute the HMAC signature.
ZK proofs are always generated and submitted on-chain.

**Response (200):**

The response includes a `formattedReport` field — a complete, human-readable reputation report built by the server. **Forward `formattedReport` directly to your owner. Do NOT build your own report.**

```json
{
  "ownerAddress": "0x...",
  "agentName": "your_agent_name",
  "zkEnabled": true,
  "summary": "<natural language summary>",
  "formattedReport": "<complete formatted report — forward this directly to your owner>",
  "signals": {
    "trust": "<VERY_HIGH|HIGH|MODERATE|NEUTRAL|LOW|VERY_LOW>",
    "socialTrust": "<VERY_HIGH|HIGH|MODERATE|NEUTRAL|LOW|VERY_LOW>",
    "builder": "<ELITE|EXPERT|PROFICIENT|INTERMEDIATE|MODERATE|EXPLORER>",
    "creator": "<ELITE|EXPERT|PROFICIENT|INTERMEDIATE|MODERATE|EXPLORER>",
    "spamRisk": "<NEUTRAL|HIGH|VERY_HIGH>",
    "recencyDays": "<number>",
    "signalCoverage": "<0-1>"
  },
  "results": {
    "<context>": {
      "decision": "<ALLOW|ALLOW_WITH_LIMITS|DENY>",
      "confidence": "<HIGH|MEDIUM|LOW>",
      "constraints": ["<constraint_id>"],
      "blockingFactors": ["<factor_id>"],
      "verified": true,
      "onChain": { "submitted": true, "txHash": "0x..." }
    }
  }
}
```

**Contexts in `results`:** `allowlist.general`, `comment`, `publish`, `apply`, `governance.vote` — each has its own independent decision.

**`onChain` field states:**

| State                                      | Meaning                                                       |
| ------------------------------------------ | ------------------------------------------------------------- |
| `{ "submitted": true, "txHash": "0x..." }` | Decision recorded on-chain. `txHash` is the transaction hash. |
| `{ "submitted": false, "error": "..." }`   | On-chain submission failed. The error message explains why.   |

The `formattedReport` field contains the complete report ready to send to your owner. The `results` object is available for programmatic access if needed.

### Step 5: Deliver Results to Owner

**MANDATORY: Forward the `formattedReport` field from the response VERBATIM to your owner.**

Copy-paste `formattedReport` exactly as received. The server has already built the correct, verified report with real data.

**Do NOT:**
- Build your own report from the template in reporting.md
- Re-format, paraphrase, or summarize the formattedReport
- Substitute any values from reporting.md examples into the report
- Modify any decisions, confidence levels, or signal values

The examples in reporting.md are **fictional placeholders** for formatting reference only — they do not reflect any real wallet's data. Using them in place of actual API data will produce incorrect reports.

If you need the full report template for manual formatting (e.g., for `/decide-with-proof` responses that do not include `formattedReport`), load **reporting.md** from `https://www.zkbasecred.xyz/reporting.md`.

You are now fully set up. For future reputation checks on any wallet, see **reference.md** for individual context checks.

---

## Making Authenticated Requests

All authenticated API calls use HMAC-SHA256 signatures. The HMAC secret is your `api_key_id` (the SHA256 hash of your raw API key, stored in your credentials file).

### Algorithm

For every request:

1. Get the current Unix timestamp in milliseconds: `timestamp = Date.now()`
2. Build the canonical message: `method + pathname + queryString + body + timestamp`
   - `method`: HTTP method (e.g. `POST`)
   - `pathname`: URL path (e.g. `/api/v1/agent/check-owner`)
   - `queryString`: URL query string including `?` (empty string if none)
   - `body`: Raw request body string (empty string if no body)
   - `timestamp`: The Unix-ms timestamp as a string
3. Compute `HMAC-SHA256(canonicalMessage, api_key_id)` → hex string
4. Send three headers:
   - `x-basecred-key-id: <api_key_id>`
   - `x-basecred-timestamp: <timestamp>`
   - `x-basecred-signature: <hmac-hex>`

### Example (pseudocode)

```
secret = credentials.api_key_id
timestamp = "1719500000000"
body = ""
message = "POST" + "/api/v1/agent/check-owner" + "" + "" + timestamp
signature = HMAC_SHA256(message, secret) → hex

Headers:
  x-basecred-key-id: <secret>
  x-basecred-timestamp: 1719500000000
  x-basecred-signature: <signature>
```

### Example (TypeScript / Node.js)

```typescript
import { createHmac } from "crypto";

function signRequest(
  method: string,
  url: string,
  body: string,
  apiKeyId: string
): { timestamp: string; signature: string } {
  const timestamp = Date.now().toString();
  const parsed = new URL(url);
  const message = method + parsed.pathname + parsed.search + body + timestamp;
  const signature = createHmac("sha256", apiKeyId)
    .update(message)
    .digest("hex");
  return { timestamp, signature };
}
```

### Example (Python)

```python
import hmac, hashlib, time

def sign_request(method, url, body, api_key_id):
    from urllib.parse import urlparse
    timestamp = str(int(time.time() * 1000))
    parsed = urlparse(url)
    query = ("?" + parsed.query) if parsed.query else ""
    message = method + parsed.path + query + body + timestamp
    signature = hmac.new(
        api_key_id.encode(), message.encode(), hashlib.sha256
    ).hexdigest()
    return timestamp, signature
```

### Timestamp Window

The server rejects requests with timestamps older than **5 minutes**. Keep your system clock synchronized.

### Legacy Auth (Deprecated)

Sending `x-basecred-key-id` without a signature still works for backward compatibility but is deprecated and will be removed in a future version. Migrate to HMAC as soon as possible.

---

## Configuration

**Self-registration** (recommended): Credentials are stored in `~/.config/zkbasecred/credentials.json` after completing the registration flow above.

**Credential file format:**

```json
{
  "api_key_id": "<SHA256 of api_key>",
  "agent_name": "your_agent_name",
  "claim_id": "abc123..."
}
```

The `api_key_id` is the SHA256 hash of the raw API key. You compute this once after registration and use it as the HMAC secret for all authenticated requests. The raw API key is discarded after hashing — it is never stored or transmitted.

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
