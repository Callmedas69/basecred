# zkBaseCred — API Reference

Full API specification, webhook details, and example interactions.

> **Companion to:** [skill.md](https://www.zkbasecred.xyz/skill.md) | [reporting.md](https://www.zkbasecred.xyz/reporting.md)

---

## How to Check Reputation (Individual Context)

Use this for checking ANY wallet's reputation in a specific context — not just your owner's. Returns a decision with ZK proof, automatically submitted on-chain.

```
POST https://www.zkbasecred.xyz/api/v1/decide-with-proof
Headers:
  x-basecred-key-id: <your-api-key-id>
  Content-Type: application/json

Body:
{
  "subject": "<wallet-address-or-fid>",
  "context": "<context>"
}
```

### Available Contexts

| Context             | When to Use                                  |
| ------------------- | -------------------------------------------- |
| `allowlist.general` | General access or allowlist checks           |
| `comment`           | Before allowing comments or messages         |
| `publish`           | Before allowing content publishing           |
| `apply`             | Before accepting applications or submissions |
| `governance.vote`   | Before allowing governance participation     |

### Interpreting the `/decide-with-proof` Response

```json
{
  "decision": "ALLOW",
  "confidence": "HIGH",
  "constraints": [],
  "signals": {
    "trust": "HIGH",
    "socialTrust": "HIGH",
    "builder": "EXPERT",
    "creator": "MODERATE",
    "spamRisk": "NEUTRAL",
    "recencyDays": 3,
    "signalCoverage": 0.85
  },
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
  "contextId": 2,
  "explain": [
    "Trust level: HIGH",
    "Social trust: HIGH",
    "Builder capability: EXPERT",
    "Creator capability: MODERATE",
    "Signal coverage: 85%",
    "Eligible for comment based on reputation signals."
  ],
  "onChain": {
    "submitted": true,
    "txHash": "0x..."
  }
}
```

**Key fields:**

- `decision` — The access decision: `ALLOW`, `DENY`, or `ALLOW_WITH_LIMITS`.
- `confidence` — Confidence tier: `VERY_HIGH`, `HIGH`, `MEDIUM`, or `LOW`. ZK-verified decisions are always `HIGH`.
- `constraints` — Array of constraint IDs applied to the decision. Empty for `ALLOW` and `DENY`. Populated for `ALLOW_WITH_LIMITS` (e.g. `["review_queue"]`).
- `blockingFactors` — _(DENY only)_ Array of signal names that caused the denial (e.g. `["trust", "socialTrust"]`). Omitted for non-DENY decisions.
- `signals` — Normalized reputation signals. Map them directly: `signals.trust` -> On-chain Trust, `signals.socialTrust` -> Social Trust, `signals.builder` -> Builder, `signals.creator` -> Creator.
- `proof` — Groth16 ZK proof in contract-ready format.
- `publicSignals` — Public inputs for the proof: `[policyHash, contextId, decision]`.
- `policyHash` — Hash of the policy used for this context.
- `contextId` — Numeric context identifier.
- `explain` — Human-readable explanation of the decision.
- `onChain` — On-chain submission status. See `onChain` field states below.

**`onChain` field states:**

| State                                      | Meaning                                                       |
| ------------------------------------------ | ------------------------------------------------------------- |
| `{ "submitted": true, "txHash": "0x..." }` | Decision recorded on-chain. `txHash` is the transaction hash. |
| `{ "submitted": false, "error": "..." }`   | On-chain submission failed. The error message explains why.   |

---

## Manual On-Chain Submission (Optional)

`/decide-with-proof` auto-submits on-chain. You do **not** need a separate step. However, if you need to re-submit a proof manually (e.g., the auto-submit failed), you can use `/agent/submit`:

```
POST https://www.zkbasecred.xyz/api/v1/agent/submit
Headers:
  x-basecred-key-id: <your-api-key-id>
  Content-Type: application/json

Body:
{
  "subject": "0x...",
  "context": "governance.vote",
  "decision": "ALLOW",
  "policyHash": "sha256:...",
  "proof": {
    "a": ["0x...", "0x..."],
    "b": [["0x...", "0x..."], ["0x...", "0x..."]],
    "c": ["0x...", "0x..."]
  },
  "publicSignals": ["...", "...", "..."]
}
```

**Response (200):**

```json
{
  "success": true,
  "transactionHash": "0x...",
  "subjectHash": "0x...",
  "contextBytes32": "0x...",
  "policyHashBytes32": "0x..."
}
```

---

## Decision Values

| Decision            | Meaning                    | Your Action                                  |
| ------------------- | -------------------------- | -------------------------------------------- |
| `ALLOW`             | Human has good reputation  | Proceed with the action                      |
| `ALLOW_WITH_LIMITS` | Reputation is mixed        | Proceed with caution, may apply restrictions |
| `DENY`              | Reputation is insufficient | Do not allow the action, explain why         |

## Confidence Levels

- `VERY_HIGH` — Strong signals from multiple sources
- `HIGH` — Good signal coverage
- `MEDIUM` — Some signals available
- `LOW` — Limited data available

---

## Owner Management Endpoints

These endpoints allow owners to manage their agent registrations from the dashboard. They require wallet signature authentication.

### List Registrations

```
POST https://www.zkbasecred.xyz/api/v1/agent/registrations
Content-Type: application/json

Body:
{
  "address": "0x...",
  "signature": "0x...",
  "message": "..."
}
```

Returns all agent registrations for the wallet owner.

### Revoke an Agent

```
DELETE https://www.zkbasecred.xyz/api/v1/agent/registrations/{claimId}
Content-Type: application/json

Body:
{
  "address": "0x...",
  "signature": "0x...",
  "message": "..."
}
```

Revokes a specific agent registration. The agent will receive a `agent.revoked` webhook if configured.

---

## Webhook Notifications (Optional)

If you provided a `webhookUrl` during registration, zkBaseCred will POST JSON to that URL when events occur. This is fire-and-forget — no retries, no queue.

### Events

| Event                | When It Fires                   |
| -------------------- | ------------------------------- |
| `agent.verified`     | Owner successfully verifies you |
| `reputation.checked` | You call `check-owner`          |
| `agent.revoked`      | Owner revokes your registration |

### Payload Shape

```json
{
  "event": "reputation.checked",
  "timestamp": 1234567890,
  "agentName": "your_agent_name",
  "ownerAddress": "0x...",
  "data": {
    /* event-specific */
  }
}
```

### Example: `agent.verified`

```json
{
  "event": "agent.verified",
  "timestamp": 1234567890,
  "agentName": "alice_helper",
  "ownerAddress": "0xabc123...def456",
  "data": {
    "claimId": "f9e8d7...",
    "apiKeyPrefix": "bc_a1b..."
  }
}
```

### Example: `reputation.checked`

```json
{
  "event": "reputation.checked",
  "timestamp": 1234567890,
  "agentName": "alice_helper",
  "ownerAddress": "0xabc123...def456",
  "data": {
    "summary": "Your reputation is strong...",
    "results": {
      "allowlist.general": { "decision": "ALLOW", "confidence": "HIGH" }
    }
  }
}
```

### Requirements

- URL must use **HTTPS** (no HTTP)
- URL must not point to private/local addresses (localhost, 10.x, 192.168.x, etc.)
- Maximum 512 characters
- If the webhook endpoint is down or slow (>5s), the event is silently dropped

---

## Error Handling

| Status | Meaning                                      | What to Do                                                                                                     |
| ------ | -------------------------------------------- | -------------------------------------------------------------------------------------------------------------- |
| 401    | Invalid or missing API key                   | Re-check your credentials file or `BASECRED_API_KEY`. If the key was revoked, re-register.                     |
| 409    | Agent name already taken (registration only) | Append a random suffix to your agent name and retry (max 3 attempts).                                          |
| 422    | Tweet verification failed                    | Tell the owner: the tweet must be public and contain the exact verification code.                              |
| 429    | Rate limited                                 | Wait for the number of seconds in the `Retry-After` header, then retry.                                        |
| 503    | ZK circuit files not available               | The ZK proof system is temporarily unavailable. Retry later.                                                   |
| 504    | Request timeout                              | `check-owner` can take up to 90 seconds (proof generation + on-chain submission). If it times out, retry once. |
| 5xx    | API is down                                  | **Never default to ALLOW.** Tell the human the check is temporarily unavailable and to try again later.        |

---

## Example Interaction

Below is a complete conversation showing the full flow from first boot to delivering reputation results, including on-chain proof.

---

**Agent (on first startup, no credentials file found):**

> I'd like to register with zkBaseCred to check your reputation. I need two things:
>
> 1. Your Ethereum wallet address (0x...)
> 2. Your Telegram handle (e.g. @yourname)

**Owner:**

> My wallet is 0xABC123...DEF456 and my Telegram is @alice_dev

**Agent registers:**

```
POST https://www.zkbasecred.xyz/api/v1/agent/register
Content-Type: application/json

{
  "agentName": "alice_helper",
  "telegramId": "@alice_dev",
  "ownerAddress": "0xABC123...DEF456",
  "webhookUrl": "https://alice-bot.example.com/hooks/basecred"
}
```

Response:

```json
{
  "apiKey": "bc_a1b2c3...",
  "claimId": "f9e8d7...",
  "claimUrl": "https://www.zkbasecred.xyz/agent/claim/f9e8d7...",
  "verificationCode": "BASECRED-XK9P",
  "message": "SAVE YOUR API KEY! It will not be shown again."
}
```

**Agent computes SHA256 of `bc_a1b2c3...` and saves credentials to `~/.config/zkbasecred/credentials.json`:**

```json
{
  "api_key": "bc_a1b2c3...",
  "api_key_id": "e3b0c44298fc1c14...",
  "agent_name": "alice_helper",
  "claim_id": "f9e8d7..."
}
```

**Agent sends claim URL to owner:**

> Please verify me as your zkBaseCred agent:
> https://www.zkbasecred.xyz/agent/claim/f9e8d7...
>
> Here's what to do:
>
> 1. Open the link above
> 2. Post the verification code on X (Twitter)
> 3. Paste your tweet URL on the claim page and click Verify
>
> This expires in 24 hours.

**Agent polls for verification:**

```
GET https://www.zkbasecred.xyz/api/v1/agent/register/f9e8d7.../status
```

Response (waiting): `{ "status": "pending_claim", "agentName": "alice_helper" }`

_(Agent continues polling with backoff: every 30s for first 5 minutes, then every 5 minutes...)_

Response (verified): `{ "status": "verified", "agentName": "alice_helper" }`

_(Since the agent registered with a webhookUrl, it also receives an `agent.verified` webhook at `https://alice-bot.example.com/hooks/basecred`.)_

**Agent checks owner reputation (proofs always generated + submitted on-chain):**

```
POST https://www.zkbasecred.xyz/api/v1/agent/check-owner
Headers:
  x-basecred-key-id: e3b0c44298fc1c14...
```

Response:

```json
{
  "ownerAddress": "0xabc123...def456",
  "agentName": "alice_helper",
  "zkEnabled": true,
  "summary": "Your reputation is strong. You have high trust on Ethos, high trust on Farcaster, strong builder credentials via Talent Protocol. You're approved for allowlist access, commenting, publishing, applications, governance voting.",
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
      "onChain": { "submitted": true, "txHash": "0xabc123..." }
    },
    "comment": {
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
      "contextId": 2,
      "onChain": { "submitted": true, "txHash": "0xdef456..." }
    },
    "publish": {
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
      "contextId": 3,
      "onChain": { "submitted": true, "txHash": "0x789abc..." }
    },
    "apply": {
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
      "contextId": 4,
      "onChain": { "submitted": true, "txHash": "0xdef789..." }
    },
    "governance.vote": {
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
      "contextId": 5,
      "onChain": { "submitted": true, "txHash": "0xabc789..." }
    }
  }
}
```

**What DENY and ALLOW_WITH_LIMITS look like in `check-owner` results:**

A `DENY` context entry includes `blockingFactors` — the signals that caused the denial:

```json
"governance.vote": {
  "decision": "DENY",
  "confidence": "HIGH",
  "constraints": [],
  "blockingFactors": ["trust", "socialTrust"],
  "verified": true,
  "proof": { "a": ["0x...", "0x..."], "b": [["0x...","0x..."],["0x...","0x..."]], "c": ["0x...", "0x..."] },
  "publicSignals": ["...", "...", "..."],
  "policyHash": "sha256:...",
  "contextId": 5,
  "onChain": { "submitted": true, "txHash": "0x..." }
}
```

An `ALLOW_WITH_LIMITS` context entry includes `constraints` — the restrictions applied:

```json
"publish": {
  "decision": "ALLOW_WITH_LIMITS",
  "confidence": "HIGH",
  "constraints": ["review_queue"],
  "verified": true,
  "proof": { "a": ["0x...", "0x..."], "b": [["0x...","0x..."],["0x...","0x..."]], "c": ["0x...", "0x..."] },
  "publicSignals": ["...", "...", "..."],
  "policyHash": "sha256:...",
  "contextId": 3,
  "onChain": { "submitted": true, "txHash": "0x..." }
}
```

**Agent delivers results using the standardized report format (see reporting.md):**

> zkBaseCred Reputation Report
> Wallet: 0xabc123...def456
> Date: 2025-06-15
>
> Overall: Strong reputation across all categories.
>
> --- Wallet Score ---
>
> On-chain Trust: High
> Social Trust: High
> Builder: Expert
> Creator: Moderate
>
> --- Access by Context ---
>
> Allowlist: ALLOW (HIGH)
> Comment: ALLOW (HIGH)
> Publish: ALLOW (HIGH)
> Apply: ALLOW (HIGH)
> Governance: ALLOW (HIGH)
>
> --- Constraints ---
> None
>
> --- Blocking Factors ---
> None
>
> --- What This Means ---
> You're well-trusted by the on-chain community, have an active social presence, and a strong track record building projects. You're approved across all categories.
>
> --- On-Chain Proof ---
> Verified with zero-knowledge proof. Transaction: 0xabc123...

---

**Later, owner asks agent to check someone else with on-chain proof:**

**Owner:**

> Can you check the reputation of 0x7890...ABCD before I let them into my DAO? I want it on-chain.

**Agent checks reputation (proof generated + auto-submitted on-chain in one call):**

```
POST https://www.zkbasecred.xyz/api/v1/decide-with-proof
Headers:
  x-basecred-key-id: e3b0c44298fc1c14...
  Content-Type: application/json

{
  "subject": "0x7890...ABCD",
  "context": "governance.vote"
}
```

Response:

```json
{
  "decision": "DENY",
  "confidence": "HIGH",
  "constraints": [],
  "blockingFactors": ["trust", "socialTrust"],
  "signals": {
    "trust": "LOW",
    "socialTrust": "LOW",
    "builder": "EXPLORER",
    "creator": "EXPLORER",
    "spamRisk": "HIGH",
    "recencyDays": 180,
    "signalCoverage": 0.2
  },
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
  "contextId": 5,
  "explain": [
    "Trust level: LOW",
    "Social trust: LOW",
    "Builder capability: EXPLORER",
    "Creator capability: EXPLORER",
    "Spam risk: HIGH",
    "Last activity: 180 days ago",
    "Signal coverage: 20%",
    "High spam risk detected."
  ],
  "onChain": {
    "submitted": true,
    "txHash": "0xfeed42..."
  }
}
```

**Agent delivers results using the standardized report format (see reporting.md):**

> zkBaseCred Reputation Check
> Subject: 0x7890...ABCD
> Context: governance.vote
> Date: 2025-06-15
>
> Decision: DENY (HIGH confidence)
>
> --- Wallet Score ---
>
> On-chain Trust: Low
> Social Trust: Low
> Builder: Explorer
> Creator: Explorer
>
> --- Details ---
> This wallet has low trust signals across the board — limited on-chain trust, no builder or creator credentials, and flagged for spam risk. Not recommended for governance access.
>
> --- Constraints ---
> None
>
> --- Blocking Factors ---
>
> - On-chain trust is too low
> - Social presence is insufficient
>
> --- On-Chain Proof ---
> Recorded on-chain. Transaction: 0xfeed42...
