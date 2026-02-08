# @basecred/openclaw-skill

OpenClaw skill for checking human reputation via BaseCred's decision engine.

## Installation

### Option 1: Copy the skill file

```bash
curl -s https://basecred.xyz/skill.md > ~/.openclaw/workspace/skills/basecred-reputation/SKILL.md
```

### Option 2: Install from npm

```bash
npm install @basecred/openclaw-skill
cp node_modules/@basecred/openclaw-skill/SKILL.md ~/.openclaw/workspace/skills/basecred-reputation/SKILL.md
```

## Configuration

Set the following environment variables in your OpenClaw config:

```
BASECRED_API_URL=https://basecred.xyz
BASECRED_API_KEY=bc_your_api_key_here
```

## Getting an API Key

1. Visit [basecred.xyz/agent](https://basecred.xyz/agent)
2. Connect your wallet
3. Sign a message to authenticate
4. Generate a new API key
5. Copy the key (it's only shown once)

## What This Skill Does

This skill teaches your OpenClaw agent to check any human's reputation before granting access or trust. It uses BaseCred's decision engine which aggregates signals from:

- **Ethos Network** — On-chain trust scores
- **Farcaster (Neynar)** — Social graph and activity
- **Talent Protocol** — Builder and creator credentials

The agent receives a clear ALLOW / DENY / ALLOW_WITH_LIMITS decision with confidence level and explanation.
