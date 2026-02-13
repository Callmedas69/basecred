---
name: "OpenClaw ERC-8004"
version: "2.0.0"
description: "Register and manage AI agent identities, reputation, and validation on-chain via ERC-8004"
chain: "Base (Chain ID: 8453)"
contracts:
  IdentityRegistry: "0x8004A169FB4a3325136EB29fA0ceB6D2e539a432"
  ReputationRegistry: "0x8004BAa17C55a88189AE136b182e5fdA19dE9b63"
  ValidationRegistry: "Not yet deployed on Base mainnet"
standard: "ERC-8004 (ERC-721 based)"
storage: "Fully on-chain (base64 data URI)"
dependencies: "None — library-agnostic, ABI-level"
---

# ERC-8004 Agent Identity Skill

## 1. Overview

ERC-8004 is an on-chain standard for AI agent identity, reputation, and validation built on ERC-721. Each registered agent receives a non-fungible token representing its on-chain identity. The standard defines three registries:

- **IdentityRegistry** — Register agents, store metadata, manage ownership (ERC-721 NFT)
- **ReputationRegistry** — Give, revoke, and query feedback for agents
- **ValidationRegistry** — Request and respond to third-party validation of agents

This skill covers **fully on-chain** registration and management. All agent metadata is stored directly on-chain as base64-encoded data URIs — no external URLs, no IPFS, no HTTP endpoints required. The skill is **library-agnostic**: all instructions are at the ABI level. Use any web3 library (ethers.js, viem, wagmi, web3.js, etc.) to execute these calls.

**This skill does NOT cover:**

- Off-chain metadata storage (IPFS, HTTP URLs)
- SDK wrappers (agent0-sdk or similar)
- Contract deployment or upgrades
- UUPS proxy administration

---

## 2. Quick Reference

| Operation               | Contract           | Function                                           | Gas? |
| ----------------------- | ------------------ | -------------------------------------------------- | ---- |
| Register agent          | IdentityRegistry   | `register(string)`                                 | Yes  |
| Register with metadata  | IdentityRegistry   | `register(string, MetadataEntry[])`                | Yes  |
| Update profile          | IdentityRegistry   | `setAgentURI(uint256, string)`                     | Yes  |
| Set metadata key        | IdentityRegistry   | `setMetadata(uint256, string, bytes)`              | Yes  |
| Read metadata key       | IdentityRegistry   | `getMetadata(uint256, string)`                     | No   |
| Read full profile       | IdentityRegistry   | `tokenURI(uint256)`                                | No   |
| Set agent wallet        | IdentityRegistry   | `setAgentWallet(uint256, address, uint256, bytes)` | Yes  |
| Get agent wallet        | IdentityRegistry   | `getAgentWallet(uint256)`                          | No   |
| Unset agent wallet      | IdentityRegistry   | `unsetAgentWallet(uint256)`                        | Yes  |
| Transfer ownership      | IdentityRegistry   | `transferFrom(address, address, uint256)`          | Yes  |
| Give feedback           | ReputationRegistry | `giveFeedback(...)`                                | Yes  |
| Revoke feedback         | ReputationRegistry | `revokeFeedback(uint256, uint64)`                  | Yes  |
| Respond to feedback     | ReputationRegistry | `appendResponse(...)`                              | Yes  |
| Read feedback summary   | ReputationRegistry | `getSummary(...)`                                  | No   |
| Read all feedback       | ReputationRegistry | `readAllFeedback(...)`                             | No   |
| Request validation      | ValidationRegistry | `validationRequest(...)`                           | Yes  |
| Respond to validation   | ValidationRegistry | `validationResponse(...)`                          | Yes  |
| Check validation status | ValidationRegistry | `getValidationStatus(bytes32)`                     | No   |

---

## 3. Contract Interfaces

> All three contracts are UUPS upgradeable proxies. Only agent-facing functions are documented here. Infrastructure methods (`upgradeToAndCall`, `proxiableUUID`, `getVersion`, `initialize`, ownership) are omitted.

### 3.1 IdentityRegistry

**Address:** `0x8004A169FB4a3325136EB29fA0ceB6D2e539a432` (Base mainnet)

**Struct:**

```
struct MetadataEntry {
    string metadataKey;
    bytes metadataValue;
}
```

**Functions:**

```
register() → uint256
register(string agentURI) → uint256
register(string agentURI, MetadataEntry[] metadata) → uint256
setAgentURI(uint256 agentId, string newURI)
setMetadata(uint256 agentId, string metadataKey, bytes metadataValue)
getMetadata(uint256 agentId, string metadataKey) → bytes
setAgentWallet(uint256 agentId, address newWallet, uint256 deadline, bytes signature)
getAgentWallet(uint256 agentId) → address
unsetAgentWallet(uint256 agentId)
tokenURI(uint256 tokenId) → string
```

**Events:**

```
Registered(uint256 indexed agentId, string agentURI, address indexed owner)
URIUpdated(uint256 indexed agentId, string newURI, address indexed updatedBy)
MetadataSet(uint256 indexed agentId, string indexed indexedMetadataKey, string metadataKey, bytes metadataValue)
```

**Notes:**

- `register()` returns the new `agentId` (auto-incrementing uint256).
- `tokenURI()` returns the `agentURI` set during registration or via `setAgentURI()`.
- `setMetadata()` value parameter is `bytes`, not `string` — encode strings to bytes before calling.
- Only the token owner can call `setAgentURI`, `setMetadata`, `setAgentWallet`, `unsetAgentWallet`.
- `agentWallet` is a reserved metadata key with special handling:
  - Set automatically to the owner's address on registration.
  - Can only be updated via `setAgentWallet()` with an EIP-712 / ERC-1271 signature proving control of the new wallet.
  - Cleared on transfer — the new owner must re-verify by calling `setAgentWallet()`.

### 3.2 ReputationRegistry

**Address:** `0x8004BAa17C55a88189AE136b182e5fdA19dE9b63` (Base mainnet)

**Functions:**

```
giveFeedback(uint256 agentId, int128 value, uint8 valueDecimals, string tag1, string tag2, string endpoint, string feedbackURI, bytes32 feedbackHash)
revokeFeedback(uint256 agentId, uint64 feedbackIndex)
appendResponse(uint256 agentId, address clientAddress, uint64 feedbackIndex, string responseURI, bytes32 responseHash)
getSummary(uint256 agentId, address[] clientAddresses, string tag1, string tag2) → (uint64 count, int128 summaryValue, uint8 summaryValueDecimals)
readFeedback(uint256 agentId, address clientAddress, uint64 feedbackIndex) → (int128 value, uint8 valueDecimals, string tag1, string tag2, bool isRevoked)
readAllFeedback(uint256 agentId, address[] clientAddresses, string tag1, string tag2, bool includeRevoked) → (address[], uint64[], int128[], uint8[], string[], string[], bool[])
getClients(uint256 agentId) → address[]
getLastIndex(uint256 agentId, address clientAddress) → uint64
getResponseCount(uint256 agentId, address[] responders, uint64 feedbackIndex, address[] responders) → uint64
getIdentityRegistry() → address
```

**Events:**

```
NewFeedback(uint256 indexed agentId, address indexed clientAddress, uint64 feedbackIndex, int128 value, uint8 valueDecimals, string indexed indexedTag1, string tag1, string tag2, string endpoint, string feedbackURI, bytes32 feedbackHash)
FeedbackRevoked(uint256 indexed agentId, address indexed clientAddress, uint64 indexed feedbackIndex)
ResponseAppended(uint256 indexed agentId, address indexed clientAddress, uint64 feedbackIndex, address indexed responder, string responseURI, bytes32 responseHash)
```

**Notes:**

- `value` is `int128` (signed) — supports positive and negative feedback.
- `valueDecimals` indicates decimal precision (e.g., value=450, decimals=2 → 4.50).
- `tag1` and `tag2` are free-form category strings for filtering.
- `endpoint` records which service endpoint the feedback is about.
- `feedbackURI` and `feedbackHash` can be empty strings / zero bytes for on-chain-only feedback.
- Only the original feedback giver can call `revokeFeedback()`.
- Anyone can call `appendResponse()` — not restricted to the agent owner.
- The contract prevents self-feedback: the agent owner and approved operators cannot give feedback to their own agent (checked via the Identity Registry).
- `getSummary()` and `readAllFeedback()` are view functions (no gas).
- `getSummary()` requires a non-empty `clientAddresses` array (anti-Sybil/spam design). You must supply specific client addresses to query.
- `readAllFeedback()` also accepts `clientAddresses` for filtering. Pass empty strings for `tag1`/`tag2` to skip tag filtering.

### 3.3 ValidationRegistry

> **Status: NOT deployed on Base mainnet.** The ABI exists in the [erc-8004-contracts](https://github.com/erc-8004/erc-8004-contracts) repo but no contract address is published for any chain. This section documents the interface for reference — it will be ready when the contract goes live.

**Functions:**

```
validationRequest(address validatorAddress, uint256 agentId, string requestURI, bytes32 requestHash)
validationResponse(bytes32 requestHash, uint8 response, string responseURI, bytes32 responseHash, string tag)
getValidationStatus(bytes32 requestHash) → (address validatorAddress, uint256 agentId, uint8 response, bytes32 responseHash, string tag, uint256 lastUpdate)
getSummary(uint256 agentId, address[] validatorAddresses, string tag) → (uint64 count, uint8 avgResponse)
getAgentValidations(uint256 agentId) → bytes32[]
getValidatorRequests(address validatorAddress) → bytes32[]
getIdentityRegistry() → address
```

**Events:**

```
ValidationRequest(address indexed validatorAddress, uint256 indexed agentId, string requestURI, bytes32 indexed requestHash)
ValidationResponse(address indexed validatorAddress, uint256 indexed agentId, bytes32 indexed requestHash, uint8 response, string responseURI, bytes32 responseHash, string tag)
```

**Notes:**

- Anyone can request validation of an agent from a specific validator address.
- Only the designated `validatorAddress` can respond to a validation request.
- `response` is a `uint8` representing the validation outcome.
- `requestHash` is the unique identifier linking requests to responses.

---

## 4. On-Chain Data Model

### 4.1 Primary Method: Base64 Data URI as agentURI

All agent metadata is stored fully on-chain by encoding the registration JSON as a base64 data URI and passing it as the `agentURI` parameter:

```
register("data:application/json;base64,{base64-encoded-JSON}")
```

When `tokenURI(agentId)` is called, it returns this data URI directly. Any consumer decodes the base64 payload to get the full agent profile.

This is the **proven production approach** — for example, Mr. Tee (agent ID 14482) on Base mainnet uses this exact pattern.

### 4.2 Registration JSON Schema

The registration JSON follows the ERC-8004 specification:

```json
{
  "type": "https://eips.ethereum.org/EIPS/eip-8004#registration-v1",
  "name": "Agent Name",
  "description": "What the agent does",
  "image": "https://example.com/avatar.png",
  "services": [
    { "name": "web", "endpoint": "https://agent.example.com" },
    {
      "name": "A2A",
      "endpoint": "https://agent.example.com/.well-known/agent-card.json",
      "version": "0.3.0"
    },
    {
      "name": "OASF",
      "endpoint": "...",
      "version": "0.8",
      "skills": [],
      "domains": []
    },
    { "name": "ENS", "endpoint": "name.eth", "version": "v1" },
    { "name": "agentWallet", "endpoint": "eip155:8453:0x..." },
    { "name": "twitter", "endpoint": "https://twitter.com/handle" },
    { "name": "farcaster", "endpoint": "https://farcaster.xyz/handle" },
    { "name": "telegram", "endpoint": "https://t.me/handle" },
    { "name": "github", "endpoint": "https://github.com/handle" }
  ],
  "x402Support": false,
  "active": true,
  "registrations": [
    {
      "agentId": 42,
      "agentRegistry": "eip155:8453:0x8004A169FB4a3325136EB29fA0ceB6D2e539a432"
    }
  ],
  "supportedTrust": ["reputation", "crypto-economic", "tee-attestation"]
}
```

**Field reference:**

| Field            | Required | Description                                                        |
| ---------------- | -------- | ------------------------------------------------------------------ |
| `type`           | Yes      | Always `"https://eips.ethereum.org/EIPS/eip-8004#registration-v1"` |
| `name`           | Yes      | Human-readable agent name                                          |
| `description`    | Yes      | What the agent does                                                |
| `image`          | No       | Avatar/logo URL                                                    |
| `services`       | No       | Array of service endpoints (see service types below)               |
| `x402Support`    | No       | Whether the agent supports x402 payments                           |
| `active`         | No       | Whether the agent is currently active                              |
| `registrations`  | No       | Array of on-chain registrations (agentId + registry address)       |
| `supportedTrust` | No       | Trust models the agent supports                                    |

**Service types:** `web`, `A2A`, `OASF`, `ENS`, `agentWallet`, `twitter`, `farcaster`, `telegram`, `github`, or any custom string.

### 4.3 Updating Profiles

To update an agent's profile:

1. Read current profile: call `tokenURI(agentId)` → decode base64 → parse JSON
2. Modify the JSON with desired changes
3. Re-encode: JSON → base64 → construct `data:application/json;base64,{encoded}`
4. Call `setAgentURI(agentId, newDataURI)`

This replaces the entire profile atomically.

### 4.4 Supplementary: Key-Value Metadata

`setMetadata()` stores individual key-value pairs on-chain alongside the agentURI:

- Keys are strings, values are `bytes` (encode strings to bytes before calling)
- Useful for fields that other contracts need to query without decoding the full JSON
- Read with `getMetadata(agentId, key)` (view, no gas)

The `MetadataEntry[]` parameter in `register(string, MetadataEntry[])` sets multiple key-value pairs during registration in a single transaction.

---

## 5. Decision Tree

```
START
  │
  ├── Load .env
  │
  ├── WALLET_PRIVATE_KEY exists?
  │     ├── No  → Go to Section 6: First-Time Setup
  │     └── Yes ↓
  │
  ├── AGENT0_AGENT_ID exists?
  │     ├── No  → Go to Section 7: Register Agent
  │     └── Yes ↓
  │
  └── Agent is registered → Show Action Menu:
        ├── Update Profile       → Section 8
        ├── Search Feedback      → Section 9
        ├── Give Feedback        → Section 10
        ├── Revoke Feedback      → Section 11
        ├── Respond to Feedback  → Section 12
        ├── Request Validation   → Section 13
        ├── Respond to Validation → Section 14
        ├── Check Validation     → Section 15
        └── Transfer Ownership   → Section 16
```

---

## 6. First-Time Setup

### 6.1 Gather Credentials

Ask the owner for:

1. **Wallet private key** — the EOA that will own the agent NFT
2. **RPC URL** — a Base mainnet RPC endpoint (default: `https://mainnet.base.org`)

### 6.2 Save to Environment

Create or update `.env`:

```
WALLET_PRIVATE_KEY=0x...
BASE_RPC_URL=https://mainnet.base.org
```

### 6.3 Verify .gitignore

Ensure `.env` is listed in `.gitignore`. If not, add it. **Never commit private keys.**

### 6.4 Verify Connection

- Connect to the RPC
- Confirm the wallet address resolves correctly
- Check the wallet has ETH on Base for gas

---

## 7. Register Agent

### 7.1 Pre-fill from Project Files

Scan for existing project context:

- `IDENTITY.md` — previous agent identity card
- `README.md` — project description
- `package.json` — name, description, repository

Use found values as defaults. The owner can override any field.

### 7.2 Gather Agent Information

Collect from the owner:

- **name** (required) — agent display name
- **description** (required) — what the agent does
- **image** (optional) — avatar/logo URL
- **services** (optional) — array of service endpoints
- **x402Support** (optional) — boolean, default false
- **active** (optional) — boolean, default true
- **supportedTrust** (optional) — array of trust model strings

### 7.3 Build Registration JSON

Construct the JSON object following the schema in Section 4.2.

Set `registrations` to an empty array initially — the `agentId` isn't known until after the transaction confirms.

### 7.4 Encode as Data URI

```
1. JSON.stringify(registrationJSON)
2. Base64 encode the JSON string
3. Prepend "data:application/json;base64,"
```

### 7.5 Preview and Approve

**Transaction Safety (Section 17 applies)**

Display to the owner:

- The full JSON (human-readable)
- The target contract address
- The function being called: `register(string agentURI)`
- Estimated gas

**Owner must explicitly approve before proceeding.**

### 7.6 Submit Registration

Call:

```
IdentityRegistry.register("data:application/json;base64,{encoded}")
```

Wait for transaction confirmation. Extract `agentId` from the `Registered` event.

### 7.7 Update Registration with agentId

Now that the `agentId` is known:

1. Update the `registrations` array in the JSON:
   ```json
   "registrations": [
     {
       "agentId": <returned-agentId>,
       "agentRegistry": "eip155:8453:0x8004A169FB4a3325136EB29fA0ceB6D2e539a432"
     }
   ]
   ```
2. Re-encode the updated JSON as a data URI
3. **Transaction Safety (Section 17 applies)** — preview and obtain owner approval before submitting.
4. Call `setAgentURI(agentId, updatedDataURI)` — this is a second transaction

### 7.8 Save Agent ID

Update `.env`:

```
AGENT0_AGENT_ID=<agentId>
```

### 7.9 Confirm and Offer IDENTITY.md

- Confirm registration success with agentId and transaction hash
- Offer to create/update `IDENTITY.md` (see Section 20)

---

## 8. Update Agent Profile

### 8.1 Read Current Profile

Call `tokenURI(agentId)` (view, no gas).

Parse the returned data URI:

1. Strip `data:application/json;base64,` prefix
2. Base64 decode
3. JSON parse

### 8.2 Identify Changes

Ask the owner which fields to update. Show current values for context.

### 8.3 Modify JSON

Apply the requested changes to the parsed JSON object.

### 8.4 Re-encode

```
1. JSON.stringify(updatedJSON)
2. Base64 encode
3. Prepend "data:application/json;base64,"
```

### 8.5 Preview and Approve

**Transaction Safety (Section 17 applies)**

Show the owner:

- A diff of old vs new JSON
- The target contract and function: `setAgentURI(uint256, string)`
- Estimated gas

**Owner must explicitly approve.**

### 8.6 Submit Update

Call:

```
IdentityRegistry.setAgentURI(agentId, "data:application/json;base64,{new-encoded}")
```

Wait for confirmation.

### 8.7 Confirm

- Confirm update success with transaction hash
- Offer to update `IDENTITY.md`

---

## 9. Search Feedback

### 9.1 Identify Target

Get the target `agentId` from the owner. This can be their own agent or any other registered agent.

### 9.2 Get Summary

Call (view, no gas):

```
ReputationRegistry.getSummary(agentId, clientAddresses, tag1, tag2)
```

- `clientAddresses` must be non-empty — supply the specific client addresses to include in the summary (anti-Sybil/spam design)
- Use `getClients(agentId)` first to discover which addresses have given feedback, then pass those to `getSummary()`
- Pass empty strings for `tag1` and `tag2` for all categories

Returns: `(count, summaryValue, summaryValueDecimals)`

### 9.3 Get Detailed Feedback (Optional)

If the owner wants details, call (view, no gas):

```
ReputationRegistry.readAllFeedback(agentId, clientAddresses, tag1, tag2, includeRevoked)
```

Returns arrays of: addresses, feedback indices, values, decimals, tag1s, tag2s, revocation status.

### 9.4 Present Results

Display:

- Total feedback count
- Summary score (value / 10^decimals)
- Individual feedback entries if detailed view was requested
- Filter by tags or client addresses if specified

---

## 10. Give Feedback

### 10.1 Gather Feedback Details

Collect from the owner:

- **agentId** (required) — the agent to give feedback for
- **value** (required) — int128, the feedback score (positive or negative)
- **valueDecimals** (required) — uint8, decimal precision
- **tag1** (optional) — category tag, default empty string
- **tag2** (optional) — subcategory tag, default empty string
- **endpoint** (optional) — which service endpoint the feedback is about, default empty string

**Note:** The contract prevents self-feedback. The agent owner and approved operators cannot give feedback to their own agent.

### 10.2 Preview and Approve

**Transaction Safety (Section 17 applies)**

Show:

- Target agent and feedback value
- Tags and endpoint
- Function: `giveFeedback(uint256, int128, uint8, string, string, string, string, bytes32)`

**Owner must explicitly approve.**

### 10.3 Submit Feedback

Call:

```
ReputationRegistry.giveFeedback(
    agentId,
    value,
    valueDecimals,
    tag1,
    tag2,
    endpoint,
    "",           // feedbackURI — empty for on-chain-only
    bytes32(0)    // feedbackHash — zero for on-chain-only
)
```

### 10.4 Confirm

Confirm with transaction hash and the `NewFeedback` event details.

---

## 11. Revoke Feedback

### 11.1 Identify Feedback

The owner needs:

- **agentId** — the agent the feedback was given to
- **feedbackIndex** — the index of the specific feedback entry (uint64)

To find the index, use `readAllFeedback()` or `getLastIndex()` from Section 9.

### 11.2 Preview and Approve

**Transaction Safety (Section 17 applies)**

Show the feedback being revoked (value, tags, timestamp). **Owner must approve.**

### 11.3 Submit Revocation

Call:

```
ReputationRegistry.revokeFeedback(agentId, feedbackIndex)
```

Only the original feedback giver can revoke.

### 11.4 Confirm

Confirm with transaction hash.

---

## 12. Respond to Feedback

### 12.1 Context

Anyone can append a response to feedback on-chain. This is not restricted to the agent owner — the original feedback giver, the agent owner, or any third party can respond.

### 12.2 Gather Response Details

- **agentId** — the owner's agent
- **clientAddress** — the address that gave the feedback
- **feedbackIndex** — which feedback entry to respond to
- **responseURI** — optional URI with detailed response (empty string for on-chain-only)
- **responseHash** — optional hash of the response content (bytes32(0) for on-chain-only)

### 12.3 Preview and Approve

**Transaction Safety (Section 17 applies)**

### 12.4 Submit Response

Call:

```
ReputationRegistry.appendResponse(agentId, clientAddress, feedbackIndex, responseURI, responseHash)
```

### 12.5 Confirm

Confirm with transaction hash.

---

## 13. Request Validation

> **Requires ValidationRegistry deployment.** This section documents the expected flow for when the contract goes live.

### 13.1 Gather Request Details

- **validatorAddress** — the address of the validator being asked
- **agentId** — the agent to be validated
- **requestURI** — optional URI with validation request details (empty string for on-chain-only)
- **requestHash** — hash identifying this request (bytes32)

### 13.2 Preview and Approve

**Transaction Safety (Section 17 applies)**

### 13.3 Submit Request

Call:

```
ValidationRegistry.validationRequest(validatorAddress, agentId, requestURI, requestHash)
```

### 13.4 Confirm

Confirm with transaction hash and `requestHash` for tracking.

---

## 14. Respond to Validation

> **Requires ValidationRegistry deployment.**

### 14.1 Context

Only the designated `validatorAddress` from the original request can respond.

### 14.2 Gather Response Details

- **requestHash** — the hash from the original request
- **response** — uint8 validation outcome
- **responseURI** — optional URI with response details
- **responseHash** — optional hash of the response content
- **tag** — category tag for the validation

### 14.3 Preview and Approve

**Transaction Safety (Section 17 applies)**

### 14.4 Submit Response

Call:

```
ValidationRegistry.validationResponse(requestHash, response, responseURI, responseHash, tag)
```

### 14.5 Confirm

Confirm with transaction hash.

---

## 15. Check Validation Status

> **Requires ValidationRegistry deployment.**

### 15.1 By Request Hash

Call (view, no gas):

```
ValidationRegistry.getValidationStatus(requestHash)
```

Returns: `(validatorAddress, agentId, response, responseHash, tag, lastUpdate)`

### 15.2 By Agent

Call (view, no gas):

```
ValidationRegistry.getAgentValidations(agentId)
```

Returns array of `requestHash` values. Query each for details.

### 15.3 Summary

Call (view, no gas):

```
ValidationRegistry.getSummary(agentId, validatorAddresses, tag)
```

Returns: `(count, avgResponse)`

### 15.4 Present Results

Display validation status, validator addresses, responses, and summary statistics.

---

## 16. Transfer Ownership

### 16.1 Verify Current Owner

Confirm the connected wallet is the current owner of the agent NFT by checking `ownerOf(agentId)`.

### 16.2 Preview and Approve

**Transaction Safety (Section 17 applies)**

Display:

- Current owner address
- New owner address
- Agent ID and name

**WARNING: This action is irreversible. The current owner will lose all control of this agent identity.**

**Note:** The `agentWallet` metadata is automatically cleared on transfer. The new owner must call `setAgentWallet()` to re-verify a wallet.

**Owner must explicitly approve.**

### 16.3 Submit Transfer

Call:

```
IdentityRegistry.transferFrom(currentOwner, newOwner, agentId)
```

### 16.4 Verify

After confirmation, call `ownerOf(agentId)` to verify the new owner.

### 16.5 Confirm

Confirm with transaction hash and verified new owner address.

---

## 17. Transaction Safety (Non-Negotiable)

Every on-chain transaction **MUST** follow this protocol:

1. **Preview** — Show the owner exactly what will be submitted:
   - Target contract address
   - Function name and parameters
   - Human-readable summary of the action
   - Estimated gas cost

2. **Explicit Approval** — The owner must actively confirm. Never auto-submit.

3. **Confirmation** — After the transaction is mined:
   - Show the transaction hash
   - Show relevant event data
   - Confirm the state change

**Never skip the preview step. Never auto-approve transactions.**

---

## 18. Error Handling

| Error                               | Cause                            | Recovery                                     |
| ----------------------------------- | -------------------------------- | -------------------------------------------- |
| `insufficient funds`                | Wallet lacks ETH for gas         | Fund the wallet on Base                      |
| `execution reverted`                | Contract rejected the call       | Check function parameters and permissions    |
| `not the owner`                     | Caller doesn't own the agent NFT | Verify correct wallet and agentId            |
| `agent not found` / `invalid token` | agentId doesn't exist            | Verify agentId on-chain                      |
| `nonce too low`                     | Pending transaction conflict     | Wait for pending tx or reset nonce           |
| `gas estimation failed`             | Transaction would revert         | Check all parameters match ABI types exactly |
| `user rejected`                     | Owner declined in wallet         | No action needed — this is expected behavior |

**General rules:**

- Never swallow errors — always surface them to the owner
- Include the raw error message for debugging
- Suggest specific recovery actions
- If a transaction fails, do NOT retry automatically — ask the owner

---

## 19. Security Rules

### Private Keys

- **Never** log, display, or transmit private keys
- Store only in `.env` files
- Verify `.env` is in `.gitignore` before any operation

### Address Verification

- Before any transfer: confirm the destination address with the owner
- Display addresses in full — never truncate for verification steps

### Transaction Safety

- Section 17 applies to ALL on-chain operations without exception
- Preview every transaction before signing
- Never batch transactions without individual approval

### RPC Security

- Use trusted RPC endpoints only
- Never send private keys over unencrypted connections

---

## 20. IDENTITY.md

After registration or updates, offer to create/update a local `IDENTITY.md` file as a quick-reference card:

```markdown
# Agent Identity Card

| Field      | Value                                      |
| ---------- | ------------------------------------------ |
| Name       | {name}                                     |
| Agent ID   | {agentId}                                  |
| Owner      | {ownerAddress}                             |
| Registry   | 0x8004A169FB4a3325136EB29fA0ceB6D2e539a432 |
| Chain      | Base (8453)                                |
| Registered | {timestamp or block number}                |

## Description

{description}

## Services

| Service | Endpoint   |
| ------- | ---------- |
| {name}  | {endpoint} |
| ...     | ...        |

## Trust Models

{supportedTrust array, comma-separated}

## On-Chain Profile

tokenURI({agentId}) → data:application/json;base64,...

## Links

- Registry: https://basescan.org/address/0x8004A169FB4a3325136EB29fA0ceB6D2e539a432
- Agent NFT: https://basescan.org/token/0x8004A169FB4a3325136EB29fA0ceB6D2e539a432?a={agentId}
```

---

## 21. References

- **EIP-8004 Specification:** [https://eips.ethereum.org/EIPS/eip-8004](https://eips.ethereum.org/EIPS/eip-8004)
- **Contract Source:** [https://github.com/erc-8004/erc-8004-contracts](https://github.com/erc-8004/erc-8004-contracts)
- **ABIs:** [https://github.com/erc-8004/erc-8004-contracts/tree/master/abis](https://github.com/erc-8004/erc-8004-contracts/tree/master/abis)
- **Deployed Addresses:** [https://github.com/erc-8004/erc-8004-contracts/blob/master/README.md](https://github.com/erc-8004/erc-8004-contracts/blob/master/README.md)
- **Base Documentation:** [https://docs.base.org](https://docs.base.org)
