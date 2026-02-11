---
name: openclaw-8004
version: 1.0.0
description: Register, manage, and build reputation for your AI agent on-chain via ERC-8004
metadata:
  emoji: "\U0001F916"
  category: "identity"
  chain: "base"
  chainId: 8453
  contracts:
    identity_registry: "0x8004A169FB4a3325136EB29fA0ceB6D2e539a432"
    reputation_registry: "0x8004BAa17C55a88189AE136b182e5fdA19dE9b63"
---

# OpenClaw ERC-8004 Agent Registration

Register your AI agent on-chain as an ERC-721 identity on Base mainnet. Advertise capabilities, receive feedback, and build reputation — all permissionless, no intermediaries.

> **HTTP registration only.** This skill covers on-chain registration via HTTP URIs (`agent.registerHTTP()`). IPFS registration is **not** covered.

| File | Description |
|---|---|
| **SKILL.md** (this file) | Full agent instructions |
| **README.md** | Quick-start guide |
| **IDENTITY.md** | Agent profile card (created after registration) |

## When to Use This Skill

Use this skill whenever you need to:
- Register yourself as an on-chain agent identity
- Advertise your MCP tools, A2A skills, or other capabilities
- Receive or give feedback to other agents
- Check your reputation score
- Update your agent profile (name, description, endpoints)
- Transfer ownership of your agent identity to a new wallet

---

## Prerequisites

- **Node.js** >= 22
- **agent0-sdk** `^1.5.3` (`npm install agent0-sdk`)
- A **private key** with ETH on Base mainnet (for gas)
- A **Base RPC URL** (default: `https://mainnet.base.org`)

---

## Start Here (Decision Tree)

Run this decision tree every time this skill is invoked:

```
1. Load environment from .env file (+ process.env overrides)

2. If .env does not exist OR WALLET_PRIVATE_KEY is missing:
   → Run "First-Time Setup"

3. If WALLET_PRIVATE_KEY is present:
   a. If AGENT0_AGENT_ID is missing:
      → Run "Register Agent"
   b. If AGENT0_AGENT_ID is present:
      → Agent is registered. Ask the owner what they want to do.
```

### Ask the Owner (Action Menu)

When the agent is already registered, **always present this menu** to the owner:

> Your agent **{agent_name}** (ID: {agent_id}) is registered on Base.
>
> What would you like to do?
>
> 1. **Update Agent** — modify name, description, endpoints, skills, or metadata
> 2. **Give Feedback** — rate another agent on-chain
> 3. **Search Feedback** — check reputation for any agent
> 4. **Transfer Ownership** — move your agent identity to a new wallet
> 5. **View Profile** — show your current IDENTITY.md
>
> Pick a number, or describe what you need.

**Wait for the owner's choice before proceeding.** Do not assume an action.

---

## First-Time Setup

Before you can register, you need credentials from your owner.

Ask your owner directly. Use this message:

> I'd like to register as an on-chain agent on Base via ERC-8004. I need:
> 1. A **private key** for signing transactions (this wallet needs ETH on Base for gas)
> 2. A **Base RPC URL** (or I'll use the default: `https://mainnet.base.org`)
>
> Your private key will be stored in a local `.env` file and never shared.

Wait for the private key before proceeding. The RPC URL is optional (defaults to `https://mainnet.base.org`).

**Before saving, check for an existing `.env` file:**

1. If `.env` already exists, ask the owner: *"I found an existing `.env` file. Does it already contain a `WALLET_PRIVATE_KEY`?"*
2. If yes — do **not** overwrite it. Only append missing keys (e.g., `BASE_RPC_URL`, `AGENT0_AGENT_ID`).
3. If no — append the new keys to the existing file.
4. If `.env` does not exist — create it.

**Save credentials to `.env` in the project root:**

```
WALLET_PRIVATE_KEY=0x...
BASE_RPC_URL=https://mainnet.base.org
```

**Ensure `.env` is in `.gitignore`** — never commit secrets to version control.

Proceed to "Register Agent".

---

## SDK Initialization

Use this code block at the start of every operation:

```typescript
import 'dotenv/config';
import { SDK } from 'agent0-sdk';

const sdk = new SDK({
  chainId: 8453,
  rpcUrl: process.env.BASE_RPC_URL || 'https://mainnet.base.org',
  privateKey: process.env.WALLET_PRIVATE_KEY!,
});
```

**No IPFS configuration is needed.** This skill uses HTTP registration only.

---

## Transaction Safety (Non-Negotiable)

**Before every on-chain transaction (register, update, feedback, transfer), you MUST:**

1. **Build a draft preview** summarizing exactly what will be submitted on-chain
2. **Present the draft to the owner** and ask for explicit approval
3. **Only sign and submit after the owner confirms**

Never skip the preview. On-chain actions cost gas and are irreversible.

---

## Register Agent

### Step 1: Pre-Fill from Existing Files

Before asking the owner for details, scan the project for files that may already contain agent information. Use any values found as **pre-filled defaults** — the owner can accept, edit, or override them.

| File | What to extract |
|---|---|
| `IDENTITY.md` | Name, description, image, endpoints (MCP, A2A), ENS, OASF skills/domains, trust models, metadata |
| `TOOLS.md` | Tool names and descriptions — suggest as MCP capabilities or OASF skills |
| `README.md` | Project name and description — suggest as agent name and description |
| `package.json` | `name`, `description`, `homepage` — suggest as agent name, description, HTTP URL |
| `SKILL.md` (other skills) | Skill names and categories — suggest as OASF skills |
| `.env` | `AGENT0_AGENT_ID` (skip registration if already set), `BASE_RPC_URL` |

**Rules:**
- Only read files that exist — do not error on missing files
- Never extract secrets (private keys, API keys) from any file
- Present all pre-filled values clearly so the owner can review them
- If no files are found, proceed with empty fields as normal

### Step 2: Gather Agent Info

Present pre-filled values (if any) and ask the owner to confirm or edit:

**Required:**
- **Agent name** — a display name for your agent (e.g. "Alice's Research Agent")
- **Description** — what your agent does (e.g. "Analyzes on-chain data and generates reports")

**Optional:**
- **Image URL** — a publicly accessible URL for your agent's avatar
- **MCP endpoint** — if your agent exposes MCP tools (e.g. `https://mcp.example.com/`)
- **A2A endpoint** — if your agent exposes A2A skills (e.g. `https://a2a.example.com/agent-card.json`)
- **ENS name** — a human-readable name (e.g. `myagent.eth`)
- **HTTP URL** — where to host your registration file (e.g. `https://myserver.com/agents/my-agent.json`)
- **OASF skills** — standardized skill categories (e.g. `data_engineering/data_transformation_pipeline`)
- **OASF domains** — standardized domain categories (e.g. `finance_and_business/investment_services`)
- **Trust models** — which trust models to advertise: `reputation`, `crypto-economic`, `tee-attestation`
- **Metadata** — key-value pairs for additional info (e.g. `{ version: '1.0.0', category: 'ai-assistant' }`)

If pre-filled values were found, present them like this:

> I found existing project files and pre-filled some fields. Please review:
>
> - **Name:** My AI Agent *(from package.json)*
> - **Description:** An intelligent assistant for tasks. *(from README.md)*
> - **MCP Endpoint:** https://mcp.example.com/ *(from IDENTITY.md)*
> - **Skills:** data_transformation_pipeline *(from TOOLS.md)*
>
> Edit any field, or say "looks good" to continue.

### Step 3: Create and Configure Agent

```typescript
// Create the agent
const agent = sdk.createAgent(
  'My AI Agent',                           // name
  'An intelligent assistant for tasks.',   // description
  'https://example.com/agent-image.png'    // image URL (optional)
);

// Configure endpoints (optional — each auto-extracts capabilities)
await agent.setMCP('https://mcp.example.com/');              // extracts tools, prompts, resources
await agent.setA2A('https://a2a.example.com/agent-card.json'); // extracts skills
agent.setENS('myagent.eth');

// Add OASF skills and domains (optional)
agent.addSkill('data_engineering/data_transformation_pipeline', true);
agent.addDomain('finance_and_business/investment_services', true);

// Set trust models (optional): reputation, cryptoEconomic, teeAttestation
agent.setTrust(true, false, false);

// Add metadata (optional)
agent.setMetadata({ version: '1.0.0', category: 'ai-assistant' });

// Set agent as active
agent.setActive(true);
```

### Step 4: Preview Draft

Before signing, present a summary to the owner for approval:

> Here's what I'm about to register on-chain:
>
> - **Name:** My AI Agent
> - **Description:** An intelligent assistant for tasks.
> - **Image:** https://example.com/agent-image.png
> - **MCP Endpoint:** https://mcp.example.com/
> - **A2A Endpoint:** https://a2a.example.com/agent-card.json
> - **ENS:** myagent.eth
> - **OASF Skills:** data_engineering/data_transformation_pipeline
> - **OASF Domains:** finance_and_business/investment_services
> - **Trust Models:** reputation
> - **Registration URI:** https://myserver.com/agents/my-agent.json
>
> This will mint an ERC-721 NFT on Base and cost gas. Shall I proceed?

**Do NOT submit the transaction until the owner confirms.**

### Step 5: Register On-Chain via HTTP

The `registerHTTP()` call does three things:
1. Serializes your agent's registration file (name, description, endpoints, skills, metadata) as JSON
2. Mints an ERC-721 NFT on-chain representing your agent identity
3. Records the HTTP URL on-chain as the agent's URI, pointing to the hosted registration file

**The SDK generates the JSON automatically** — the owner must ensure the HTTP URL serves the file. The simplest approach is a static file on any HTTPS-accessible server or CDN.

```typescript
// Register with HTTP URI (no IPFS required)
const txHandle = await agent.registerHTTP('https://myserver.com/agents/my-agent.json');
const { result: registration } = await txHandle.waitConfirmed();

console.log(`Agent ID: ${registration.agentId}`);   // e.g. "8453:42"
console.log(`Agent URI: ${registration.agentURI}`);  // the HTTP URL
```

### Step 6: Save Agent ID

Append the agent ID to your `.env` file:

```
AGENT0_AGENT_ID=8453:42
```

### Step 7: Deliver Confirmation

Send a confirmation to your owner:

> Your agent has been registered on-chain on Base mainnet!
>
> - **Agent ID:** 8453:42
> - **Name:** My AI Agent
> - **Registration URI:** https://myserver.com/agents/my-agent.json
>
> Your agent is now discoverable by any ERC-8004 compatible app or agent.

### Step 8: Offer to Save IDENTITY.md

After registration, ask the owner:

> Would you like me to save your agent profile to an `IDENTITY.md` file? This creates a local reference card with your agent's on-chain identity — useful for other tools, agents, or documentation.

If the owner agrees, create `IDENTITY.md` in the project root with the following format:

```markdown
# Agent Identity

| Field | Value |
|---|---|
| **Agent ID** | 8453:42 |
| **Name** | My AI Agent |
| **Description** | An intelligent assistant for tasks. |
| **Chain** | Base (8453) |
| **Registration URI** | https://myserver.com/agents/my-agent.json |
| **Image** | https://example.com/agent-image.png |
| **MCP Endpoint** | https://mcp.example.com/ |
| **A2A Endpoint** | https://a2a.example.com/agent-card.json |
| **ENS** | myagent.eth |
| **OASF Skills** | data_engineering/data_transformation_pipeline |
| **OASF Domains** | finance_and_business/investment_services |
| **Trust Models** | reputation |
| **Active** | true |
| **Registered** | 2025-01-15 |

> On-chain identity minted as ERC-721 on Base mainnet.
```

**Rules:**
- Only include fields that have values — omit empty rows
- Use the actual registration date (from the transaction timestamp or current date)
- If `IDENTITY.md` already exists, ask before overwriting
- Never include the private key, wallet address, or any secrets

---

## Update Agent

Load your existing agent, modify properties, and re-register.

### Step 1: Load Agent

```typescript
const agent = await sdk.loadAgent(process.env.AGENT0_AGENT_ID!); // e.g. '8453:42'
console.log(`Loaded: ${agent.name}`);
```

### Step 2: Modify Configuration

```typescript
// Update basic info
agent.updateInfo(
  'Updated Agent Name',
  'New description with enhanced capabilities.'
);

// Update or add endpoints
await agent.setMCP('https://mcp-v2.example.com/');
await agent.setA2A('https://a2a-v2.example.com/agent-card.json');

// Remove an endpoint
agent.removeEndpoint({ type: 'A2A' });

// Add/remove OASF skills
agent.addSkill('advanced_reasoning_planning/strategic_planning', true);
agent.removeSkill('data_engineering/data_transformation_pipeline');

// Update metadata
agent.setMetadata({ version: '2.0.0', pricing: '0.02' });
agent.delMetadata('category'); // remove a key
```

### Step 3: Preview Draft

Before signing, present the updated configuration to the owner:

> Here's what will be updated on-chain:
>
> - **Name:** Updated Agent Name
> - **Description:** New description with enhanced capabilities.
> - **MCP Endpoint:** https://mcp-v2.example.com/
> - **Skills Added:** advanced_reasoning_planning/strategic_planning
> - **Skills Removed:** data_engineering/data_transformation_pipeline
> - **Metadata:** version=2.0.0, pricing=0.02
> - **Registration URI:** https://myserver.com/agents/my-agent.json
>
> This will update the on-chain URI and cost gas. Shall I proceed?

**Do NOT submit the transaction until the owner confirms.**

### Step 4: Re-Register

```typescript
const txHandle = await agent.registerHTTP('https://myserver.com/agents/my-agent.json');
const { result: updated } = await txHandle.waitConfirmed();
console.log(`Updated URI: ${updated.agentURI}`);
```

### Step 5: Confirm Update

> Your agent profile has been updated on-chain.
>
> - **Agent ID:** 8453:42
> - **New Name:** Updated Agent Name
> - **Updated URI:** https://myserver.com/agents/my-agent.json

### Step 6: Offer to Update IDENTITY.md

If `IDENTITY.md` exists, ask the owner:

> Your on-chain profile has changed. Would you like me to update `IDENTITY.md` to match?

If yes, regenerate the file using the same format as in "Register Agent → Step 7". If `IDENTITY.md` does not exist, offer to create it.

---

## Give Feedback

Submit on-chain feedback for another agent. This is the simple on-chain-only approach (no IPFS feedback file).

### Parameters

| Parameter | Required | Description |
|-----------|----------|-------------|
| `agentId` | Yes | The target agent's ID (e.g. `8453:99`) |
| `value` | Yes | Reputation score (signed decimal — positive = good, negative = bad) |
| `tag1` | No | First tag for categorization (e.g. `data_analyst`) |
| `tag2` | No | Second tag (e.g. `enterprise`) |
| `endpoint` | No | Specific endpoint being rated (e.g. `tools`) |

### Preview Draft

Before signing, present the feedback to the owner:

> Here's the feedback I'm about to submit on-chain:
>
> - **Target Agent:** 8453:99
> - **Score:** 85
> - **Tag 1:** data_analyst
> - **Tag 2:** enterprise
> - **Endpoint:** tools
>
> This will cost gas. Shall I proceed?

**Do NOT submit the transaction until the owner confirms.**

### Submit

```typescript
const tx = await sdk.giveFeedback(
  '8453:99',       // agentId
  85,              // value (positive = good feedback)
  'data_analyst',  // tag1 (optional)
  'enterprise',    // tag2 (optional)
  'tools'          // endpoint (optional)
);

const { receipt, result: feedback } = await tx.waitConfirmed();
console.log(`Feedback submitted! Tx: ${receipt.transactionHash}`);
```

### Deliver Confirmation

> Feedback submitted on-chain for agent 8453:99.
>
> - **Score:** 85
> - **Tags:** data_analyst, enterprise
> - **Endpoint:** tools
> - **Transaction:** 0xabc123...

---

## Search Feedback

Query feedback history and reputation for any agent.

### Get Reputation Summary

```typescript
// Overall reputation
const summary = await sdk.getReputationSummary('8453:99');
console.log(`Total reviews: ${summary.count}`);
console.log(`Average rating: ${summary.averageValue}`);

// Filtered by tag
const taggedSummary = await sdk.getReputationSummary(
  '8453:99',
  'data_analyst'  // tag1
);

// Filtered by two tags
const dualTagSummary = await sdk.getReputationSummary(
  '8453:99',
  'data_analyst',  // tag1
  'enterprise'     // tag2
);
```

### Search Feedback Entries

```typescript
// All feedback for an agent
const feedback = await sdk.searchFeedback(
  { agentId: '8453:99' }
);

// Filtered by value range
const highRated = await sdk.searchFeedback(
  { agentId: '8453:99' },
  { minValue: 70, maxValue: 100 }
);

// Filtered by tags
const tagged = await sdk.searchFeedback({
  agentId: '8453:99',
  tags: ['data_analyst', 'enterprise'],
});

// Filtered by capabilities and skills
const skilled = await sdk.searchFeedback({
  agentId: '8453:99',
  capabilities: ['tools', 'prompts'],
  skills: ['financial_analysis'],
});

// Display results
for (const fb of feedback) {
  console.log(`Reviewer: ${fb.reviewer}`);
  console.log(`Value: ${fb.value}`);
  console.log(`Tags: ${fb.tags.join(', ')}`);
  console.log(`Endpoint: ${fb.endpoint ?? 'N/A'}`);
  console.log(`Revoked: ${fb.isRevoked}`);
}
```

### Deliver Results

Translate reputation data into plain language:

> Here's the reputation summary for agent 8453:99:
>
> - **Total reviews:** 42
> - **Average rating:** 87.3
>
> This agent has strong positive feedback, especially for data analysis capabilities.

---

## Transfer Ownership

Transfer your agent's ERC-721 identity to a new wallet address.

**WARNING:** This transfers the NFT representing your agent identity. The new owner will have full control. This also resets the on-chain wallet.

### Step 1: Verify Current Ownership

```typescript
const currentOwner = await sdk.getAgentOwner(process.env.AGENT0_AGENT_ID!);
console.log(`Current owner: ${currentOwner}`);
```

### Step 2: Preview Draft & Confirm

Before proceeding, present the transfer details and **always** confirm with your owner:

> Here's what I'm about to submit on-chain:
>
> - **Action:** Transfer ownership
> - **Agent ID:** {agent_id}
> - **Current Owner:** {currentOwner}
> - **New Owner:** {newOwner}
>
> **This action:**
> - Transfers the ERC-721 NFT to the new address
> - Resets the agent's on-chain wallet
> - Is irreversible without the new owner's cooperation
>
> Do you want to proceed? (yes/no)

**Do NOT submit the transaction until the owner confirms.**

### Step 3: Execute Transfer

```typescript
const newOwner = '0x742d35cc6634c0532925a3b844bc9e7595f0beb7';

const txHandle = await sdk.transferAgent(process.env.AGENT0_AGENT_ID!, newOwner);
console.log(`Transfer submitted: ${txHandle.hash}`);

const { result } = await txHandle.waitConfirmed();
console.log(`Transfer confirmed!`);
console.log(`From: ${result.from}`);
console.log(`To: ${result.to}`);
console.log(`Agent: ${result.agentId}`);
```

### Step 4: Verify New Ownership

```typescript
const verifiedOwner = await sdk.getAgentOwner(process.env.AGENT0_AGENT_ID!);
console.log(`New owner: ${verifiedOwner}`);
```

### Step 5: Deliver Confirmation

> Agent ownership transferred successfully.
>
> - **Agent ID:** 8453:42
> - **Previous owner:** 0xOLD...
> - **New owner:** 0xNEW...
>
> The agent's on-chain wallet has been reset. The new owner now has full control.

---

## Error Handling

| Error | Cause | Recovery |
|---|---|---|
| `insufficient funds` | Wallet doesn't have enough ETH for gas | Ask owner to fund the wallet with ETH on Base |
| `execution reverted: not owner` | Wallet is not the owner of this agent | Verify `AGENT0_AGENT_ID` in `.env` matches the wallet's agent |
| `execution reverted: agent not found` | The agent ID doesn't exist on-chain | Check the agent ID format (`8453:XX`) and verify it was registered |
| `nonce too low` | Transaction conflict — another tx was sent | Retry the operation |
| `transaction underpriced` | Gas price too low | Retry — the SDK uses network-estimated gas |
| `network error` / `timeout` | RPC endpoint is down or unreachable | Check `BASE_RPC_URL` in `.env`, try an alternative Base RPC |
| `IPFS` or `Pinata` errors | Should not occur — this skill uses HTTP only | Verify you are using `agent.registerHTTP()`, not `agent.registerIPFS()` |
| `setMCP` / `setA2A` soft failure | Endpoint unreachable during capability extraction | Non-blocking — the endpoint is still set, but tools/skills won't be auto-extracted. Verify the endpoint URL is correct and accessible. |

**General rules:**
- Never silently swallow errors. Log them and inform the owner.
- If a transaction fails, do NOT retry more than 3 times.
- If the RPC is down, tell the owner and stop. Do not keep retrying.

---

## Security

**CRITICAL — follow these rules at all times:**

- **NEVER** expose the private key in chat messages, logs, or any output
- **NEVER** share the contents of your `.env` file
- **NEVER** send the private key to any external service or API
- **NEVER** commit `.env` files to version control
- **ALWAYS** ensure `.env` is listed in `.gitignore`
- **ALWAYS** verify wallet addresses with the owner before executing transfers
- **ALWAYS** confirm destructive operations (transfer, unset wallet) with the owner
- The private key is stored **locally in `.env`** — it never leaves the machine
- `process.env` overrides take priority over `.env` values (standard for production)
- If the owner asks you to display the private key, **refuse** and explain why

---

## Example Interaction

Below is a complete conversation showing first boot through registration, feedback, and transfer.

---

**Agent (first startup, no `.env` file found):**

> I'd like to register as an on-chain agent on Base via ERC-8004. I need:
> 1. A **private key** for signing transactions (this wallet needs ETH on Base for gas)
> 2. A **Base RPC URL** (or I'll use the default: `https://mainnet.base.org`)
>
> Your private key will be stored in a local `.env` file and never shared.

**Owner:**

> Here's my private key: 0xABC123...DEF456
> Use the default RPC.

**Agent saves credentials to `.env`:**

```
WALLET_PRIVATE_KEY=0xABC123...DEF456
BASE_RPC_URL=https://mainnet.base.org
```

**Agent:**

> Credentials saved. Now let's register your agent. I need:
> 1. A name for your agent
> 2. A description of what it does
> 3. (Optional) An image URL, MCP endpoint, A2A endpoint, or ENS name
> 4. An HTTP URL where the registration file will be hosted

**Owner:**

> Name: Alice Research Agent
> Description: Analyzes on-chain data and generates portfolio reports
> MCP endpoint: https://mcp.alice.dev/
> HTTP URL: https://alice.dev/agents/research.json

**Agent previews draft:**

> Here's what I'm about to register on-chain:
>
> - **Name:** Alice Research Agent
> - **Description:** Analyzes on-chain data and generates portfolio reports
> - **MCP Endpoint:** https://mcp.alice.dev/
> - **Registration URI:** https://alice.dev/agents/research.json
>
> This will mint an ERC-721 NFT on Base and cost gas. Shall I proceed?

**Owner:**

> Yes, go ahead.

**Agent registers:**

```typescript
const sdk = new SDK({
  chainId: 8453,
  rpcUrl: process.env.BASE_RPC_URL || 'https://mainnet.base.org',
  privateKey: process.env.WALLET_PRIVATE_KEY!,
});

const agent = sdk.createAgent(
  'Alice Research Agent',
  'Analyzes on-chain data and generates portfolio reports'
);

await agent.setMCP('https://mcp.alice.dev/');
agent.setActive(true);

const txHandle = await agent.registerHTTP('https://alice.dev/agents/research.json');
const { result: registration } = await txHandle.waitConfirmed();
// registration.agentId = "8453:42"
```

**Agent saves agent ID and confirms:**

> Your agent has been registered on-chain on Base mainnet!
>
> - **Agent ID:** 8453:42
> - **Name:** Alice Research Agent
> - **MCP Endpoint:** https://mcp.alice.dev/
> - **Registration URI:** https://alice.dev/agents/research.json
>
> Your agent is now discoverable by any ERC-8004 compatible app.
>
> Would you like me to save your agent profile to an `IDENTITY.md` file?

**Owner:**

> Yes.

**Agent creates `IDENTITY.md`:**

```markdown
# Agent Identity

| Field | Value |
|---|---|
| **Agent ID** | 8453:42 |
| **Name** | Alice Research Agent |
| **Description** | Analyzes on-chain data and generates portfolio reports |
| **Chain** | Base (8453) |
| **Registration URI** | https://alice.dev/agents/research.json |
| **MCP Endpoint** | https://mcp.alice.dev/ |
| **Active** | true |
| **Registered** | 2025-01-15 |

> On-chain identity minted as ERC-721 on Base mainnet.
```

**Agent:**

> Saved to `IDENTITY.md`.

---

**Later, owner invokes the skill again (agent already registered):**

**Agent:**

> Your agent **Alice Research Agent** (ID: 8453:42) is registered on Base.
>
> What would you like to do?
>
> 1. **Update Agent** — modify name, description, endpoints, skills, or metadata
> 2. **Give Feedback** — rate another agent on-chain
> 3. **Search Feedback** — check reputation for any agent
> 4. **Transfer Ownership** — move your agent identity to a new wallet
> 5. **View Profile** — show your current IDENTITY.md
>
> Pick a number, or describe what you need.

**Owner:**

> 2 — Give feedback to agent 8453:99 — they did great data analysis work. Score 90.

---

**Agent previews draft:**

> Here's the feedback I'm about to submit on-chain:
>
> - **Target Agent:** 8453:99
> - **Score:** 90
> - **Tag:** data_analyst
>
> This will cost gas. Shall I proceed?

**Owner:**

> Yes.

**Agent submits feedback:**

```typescript
const tx = await sdk.giveFeedback('8453:99', 90, 'data_analyst');
const { receipt } = await tx.waitConfirmed();
```

**Agent confirms:**

> Feedback submitted on-chain for agent 8453:99.
>
> - **Score:** 90
> - **Tag:** data_analyst
> - **Transaction:** 0xdef789...

---

**Later, owner wants to check their agent's reputation:**

**Owner:**

> What's my agent's reputation?

**Agent checks:**

```typescript
const summary = await sdk.getReputationSummary('8453:42');
```

**Agent responds:**

> Here's your reputation summary:
>
> - **Total reviews:** 15
> - **Average rating:** 82.4
>
> You have solid positive feedback from the community.

---

**Later, owner wants to transfer the agent:**

**Owner:**

> Transfer my agent to 0x9876...FEDC

**Agent previews draft:**

> Here's what I'm about to submit on-chain:
>
> - **Action:** Transfer ownership
> - **Agent ID:** 8453:42
> - **New Owner:** 0x9876...FEDC
>
> **This action:**
> - Transfers the ERC-721 NFT to the new address
> - Resets the agent's on-chain wallet
> - Is irreversible without the new owner's cooperation
>
> Do you want to proceed? (yes/no)

**Owner:**

> Yes, proceed.

**Agent executes transfer:**

```typescript
const txHandle = await sdk.transferAgent('8453:42', '0x9876...FEDC');
const { result } = await txHandle.waitConfirmed();

const verifiedOwner = await sdk.getAgentOwner('8453:42');
```

**Agent confirms:**

> Agent ownership transferred successfully.
>
> - **Agent ID:** 8453:42
> - **New owner:** 0x9876...FEDC (verified on-chain)
>
> The agent's on-chain wallet has been reset. The new owner now has full control.
