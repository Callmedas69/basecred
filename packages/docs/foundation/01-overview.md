---
sidebar_position: 1
slug: overview
---

import VersionBadges from '@site/src/components/VersionBadges';

# Foundation Overview

<VersionBadges
  category="Foundation"
  version="0.1.0"
  updated="Feb 14, 2026"
  guidelinesLabel="Core Principles"
  guidelinesUrl="/foundation/core-principles"
/>

This document defines the **non negotiable foundation of BaseCred**.

It governs **all BaseCred components**, including the SDK, the Decision Engine, integration layers, and product or interface surfaces.

It exists to prevent drift, misuse, and silent interpretation across the entire system.

:::warning
No implementation guidance belongs in this section.
:::

---

## North Star

BaseCred is built for **builders who care about real users and long-term contributors**.

It is explicitly **not** designed for growth farming, transaction farming, or short term KPI optimization.

BaseCred prioritizes signal over noise, continuity over spikes, and evidence over conclusions.

These priorities are **normative**, not technical.  
They define what BaseCred is allowed to value, regardless of component or implementation.

---

## Purpose

BaseCred exists to provide **structured, source faithful context about people over time**.

It does this by exposing **independent credibility facets**, including social credibility derived from **Ethos** and builder+creator credibility derived from **Talent Protocol**.

In addition, BaseCred may rely on **identity and data access infrastructure**, such as **Neynar**, solely to observe **spam behavior and social activity signals**. This usage is limited to detection and classification purposes and **does not constitute credibility**.

These facets and inputs may be produced, transported, or consumed by different components, such as the SDK, the Decision Engine, or interface layers, but their **meaning is fixed here**.

“Unified” means **co located**, not combined.

BaseCred does not aggregate scores, judge users, rank participants, recommend actions, or enforce outcomes.

BaseCred exposes **context only**.

BaseCred only exposes upstream-defined data and semantics.
It does not derive, reinterpret, normalize, or invent meaning.

---

## Context

In BaseCred, **context is descriptive, not prescriptive**.

Context consists of structured facts, signals, and source-faithful representations that describe **what is known** about a person over time. Context may include presence, absence, activity-derived signals, or credibility facets, but it **never implies an outcome**.

Context does **not** make decisions, assign labels, or determine consequences.

BaseCred’s responsibility ends at providing **accurate, bounded context**.  
How that context is interpreted, weighted, or acted upon is the responsibility of **downstream systems**.

---

## Data Access vs. Credibility Sources

BaseCred distinguishes **credibility sources** from **infrastructure used to access data**.

Not all upstream systems provide credibility signals.

For example, Neynar provides authenticated access to Farcaster identities, accounts, and social graph data. Within BaseCred, Neynar is used **only to assess data integrity and detect spam or abusive activity**, and is never used to assess a person’s credibility or standing. Neynar is **not** treated as a source of credibility.

BaseCred does not treat Neynar data as reputation, derive trust or quality from social graph structure, or infer intent, influence, or authority from activity.

Infrastructure enables access.  
Meaning is defined only by explicit credibility sources and this foundation.

---

## Scope of Authority

This foundation applies **upstream of all decisions**.

Any BaseCred component may fetch data, assemble context, enforce rules, or apply policies.

However, **no component may reinterpret meaning** defined here.

If a downstream system violates this foundation, the system is wrong, not the foundation.

---

## The Question BaseCred Answers

BaseCred answers:

> **“Who is this person over time?”**

It explicitly does **not** answer whether a person is good or bad, whether they can be trusted, or whether they should be allowed or blocked.

Those questions belong to **applications and decision layers**, not BaseCred itself.

BaseCred provides context.  
Decisions happen downstream.

---

## Boundary

This document defines the **BaseCred Foundation**.

Once accepted, it is immutable. All later development must obey it, and any semantic change requires reopening explicitly.
