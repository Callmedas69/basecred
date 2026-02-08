# @basecred/openclaw-skill

OpenClaw skill that teaches agents to autonomously check their owner's on-chain reputation before granting access or trust.

## Installation

### Option 1: Copy the skill file

```bash
curl -s https://www.zkbasecred.xyz/skill.md > ~/.openclaw/workspace/skills/basecred-reputation/SKILL.md
```

### Option 2: Install from npm

```bash
npm install @basecred/openclaw-skill
cp node_modules/@basecred/openclaw-skill/SKILL.md ~/.openclaw/workspace/skills/basecred-reputation/SKILL.md
```

## Getting Started

### Option A: Self-Registration (Recommended)

Your agent registers itself autonomously. See [SKILL.md](./SKILL.md) for the full flow:

1. Agent calls `POST /api/v1/agent/register` with its name, Telegram ID, and owner's wallet address
2. Agent sends the claim URL to the owner
3. Owner verifies by posting a code on X (Twitter)
4. Agent's API key activates automatically

No manual dashboard visit required.

### Option B: Manual Key Generation

1. Visit [zkbasecred.xyz/agent](https://www.zkbasecred.xyz/agent)
2. Connect your wallet
3. Sign a message to authenticate
4. Generate a new API key
5. Copy the key (it's only shown once)

## Configuration

Set the following environment variables in your OpenClaw config:

```
BASECRED_API_URL=https://www.zkbasecred.xyz
BASECRED_API_KEY=bc_your_api_key_here
```

## What This Skill Does

This skill teaches your OpenClaw agent to check any human's on-chain reputation. The agent registers itself, verifies its owner via X, and autonomously evaluates reputation using zkBaseCred's decision engine which aggregates signals from:

- **Ethos Network** — On-chain trust scores
- **Farcaster (Neynar)** — Social graph and activity
- **Talent Protocol** — Builder and creator credentials

The agent receives a clear ALLOW / DENY / ALLOW_WITH_LIMITS decision with confidence level, explanation, and a natural language summary it can forward directly to the owner.
