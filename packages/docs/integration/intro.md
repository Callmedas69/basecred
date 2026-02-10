---
sidebar_position: 1
---

# Overview

> Make misuse harder than correct use.

BaseCred is a **read-only reputation primitive**. It aggregates signals from trusted on-chain and off-chain providers (Ethos, Neynar, Talent Protocol) and exposes them as **neutral, deterministic context** — not judgments.

BaseCred answers one question only:

> **“What signals are observable about this identity right now?”**

It does **not** decide who to trust, who to block, or what action to take.

## Core Principles

- **Context, not decisions:** BaseCred provides descriptive signals. Applications own all interpretation, thresholds, and enforcement.
- **No judgment:** We never label users, rank them, or produce final verdicts.
- **Deterministic:** The same input always results in the same output.
- **Explicit absence:** Missing data is surfaced clearly — never inferred or hidden.
- **Transparent by design:** Every field is traceable to a source. No hidden weighting. No black boxes.

## What BaseCred Is Not

BaseCred is **not** an authorization engine, moderation system, trust oracle, or recommendation system.

If your product requires a final score or automatic action, BaseCred is intentionally the wrong tool.

## Integration

You can integrate BaseCred via the SDK or public API. The response schema is **versioned and stable** (Semantic Versioning). See the [Integration Guide](./integration.mdx) for details.

See [Context vs Decision](./context-vs-decision.md) to understand where BaseCred stops and your application begins.

If you are building an **AI agent** (e.g. OpenClaw), see the [OpenClaw Integration](./openclaw.mdx) for a quick-start guide and the [Agent API Reference](./agent-api.mdx) for full endpoint docs. Agents can self-register, verify via tweet, and check their owner's reputation autonomously.

If you are integrating a ZK agent flow, see the [ZK Agent Integration](./zk-agent.mdx) page for policy hashes and proof payload examples.

:::tip Quick Start
If running locally, visit `http://localhost:3000/human` to see live data.
:::
