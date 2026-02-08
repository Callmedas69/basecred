# BaseCred Reputation Check

Check any human's on-chain and social reputation before granting access, allowing actions, or trusting their input.

## When to Use This Skill

Use this skill whenever you need to:
- Verify a human's reputation before allowing them to perform an action
- Decide whether to trust a human's input or request
- Gate access to features based on reputation signals
- Assess spam risk for a wallet address or Farcaster identity

## Self-Registration (Recommended)

If you don't have a `BASECRED_API_KEY` yet, register autonomously:

### Step 1: Register

```
POST https://basecred.xyz/api/v1/agent/register
Content-Type: application/json

{
  "agentName": "your_agent_name",
  "telegramId": "@your_telegram",
  "ownerAddress": "0x..."
}
```

Response:
```json
{
  "apiKey": "bc_...",
  "claimId": "abc123...",
  "claimUrl": "https://basecred.xyz/agent/claim/abc123...",
  "verificationCode": "BASECRED-XXXX",
  "message": "SAVE YOUR API KEY! It will not be shown again."
}
```

**IMPORTANT:** Save the `apiKey` immediately. It is shown ONCE.

### Step 2: Send Claim URL to Owner

Send the `claimUrl` to your owner (via Telegram, chat, or any channel). They need to:
1. Visit the claim URL
2. Post the verification code on X (Twitter)
3. Submit the tweet URL

### Step 3: Poll for Verification

```
GET https://basecred.xyz/api/v1/agent/register/{claimId}/status
```

Poll every 30 seconds until `status` is `"verified"`.

### Step 4: Check Owner's Full Reputation

Once verified, check your owner's reputation across ALL contexts in one call:

```
POST https://basecred.xyz/api/v1/agent/check-owner
Headers:
  x-api-key: <your-api-key>
```

No body needed — BaseCred knows the owner from registration. Returns:
```json
{
  "ownerAddress": "0x...",
  "agentName": "your_agent_name",
  "summary": "Your reputation is strong. You have high trust on Ethos...",
  "results": {
    "allowlist.general": { "decision": "ALLOW", "confidence": "HIGH" },
    "comment": { "decision": "ALLOW", "confidence": "HIGH" },
    ...
  }
}
```

The `summary` field is a natural language explanation you can forward directly to the owner.

### Step 5: Individual Context Checks

For subsequent checks on any wallet, use the standard decide endpoint (see below).

---

## Configuration

Required environment variables:
- `BASECRED_API_URL` — The BaseCred API base URL (e.g., `https://basecred.xyz`)
- `BASECRED_API_KEY` — Your API key (starts with `bc_`)

## How to Identify the Human

Extract the human's identity from context:
1. **Wallet address** — If you have their Ethereum address (0x...), use it directly as `subject`
2. **Farcaster FID** — If you have their Farcaster FID (numeric), use it as `subject`
3. **Ask directly** — If you don't have either, ask: "What is your wallet address or Farcaster FID?"

## How to Check Reputation

Make a POST request:

```
POST ${BASECRED_API_URL}/api/v1/decide
Headers:
  x-api-key: ${BASECRED_API_KEY}
  Content-Type: application/json

Body:
{
  "subject": "<wallet-address-or-fid>",
  "context": "<context>"
}
```

## Available Contexts

Choose the context based on what the human wants to do:

| Context | When to Use |
|---|---|
| `allowlist.general` | General access or allowlist checks |
| `comment` | Before allowing comments or messages |
| `publish` | Before allowing content publishing |
| `apply` | Before accepting applications or submissions |
| `governance.vote` | Before allowing governance participation |

## Interpreting the Response

The API returns a JSON response:

```json
{
  "decision": "ALLOW",
  "confidence": "HIGH",
  "explain": ["Trust level: HIGH", "Signal coverage: 85%"],
  "signals": {
    "trust": "HIGH",
    "socialTrust": "HIGH",
    "builder": "EXPERT",
    "creator": "MODERATE",
    "spamRisk": "NEUTRAL",
    "recencyDays": 3,
    "signalCoverage": 0.85
  }
}
```

### Decision Values

| Decision | Meaning | Your Action |
|---|---|---|
| `ALLOW` | Human has good reputation | Proceed with the action |
| `ALLOW_WITH_LIMITS` | Reputation is mixed | Proceed with caution, may apply restrictions |
| `DENY` | Reputation is insufficient | Do not allow the action, explain why |

### Confidence Levels

- `VERY_HIGH` — Strong signals from multiple sources
- `HIGH` — Good signal coverage
- `MEDIUM` — Some signals available
- `LOW` — Limited data available

## Error Handling

| Status | Meaning | What to Do |
|---|---|---|
| 401 | Invalid or missing API key | Check your `BASECRED_API_KEY` configuration |
| 429 | Rate limited | Wait and retry after the `Retry-After` header value |
| 5xx | API is down | **Never default to ALLOW.** Tell the human the check is temporarily unavailable and to try again later |

## Example Interaction