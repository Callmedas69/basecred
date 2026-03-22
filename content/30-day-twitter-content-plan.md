# zkBaseCred 30-Day Twitter/X Content Plan

> Generated: 2026-03-22
> Brand: zkBaseCred -- Privacy-preserving reputation primitive on Base mainnet
> Primary tagline: "Reputation without opinion."

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [Content Pillars](#content-pillars)
3. [Weekly Themes](#weekly-themes)
4. [Day-by-Day Plan](#day-by-day-plan)
5. [Engagement Strategy](#engagement-strategy)
6. [Content Recycling Guide](#content-recycling-guide)
7. [Metrics and KPIs](#metrics-and-kpis)

---

## Executive Summary

### Goals

1. **Establish zkBaseCred as the definitive reputation primitive on Base** -- not another score, not another badge system, but the infrastructure layer that returns actionable decisions with ZK proofs.
2. **Drive developer awareness and first integrations** -- every thread should make a developer think "I could replace my ad-hoc reputation check with one API call."
3. **Educate the market on context-aware reputation** -- shift the narrative from "reputation scores" to "reputation decisions" with different thresholds for different contexts.
4. **Build a technical following** that understands the ZK architecture, trusts the protocol's design, and can explain it to others.

### Target KPIs (30-Day)

| Metric | Target |
|---|---|
| Followers gained | 500-1,000 |
| Avg. impressions per tweet | 2,000+ |
| Thread completion rate | 40%+ |
| Link clicks (docs/API) | 200+ |
| Developer DMs / replies | 20+ meaningful conversations |
| Retweets from ecosystem accounts | 15+ |
| Poll participation (avg.) | 50+ votes |

### Target Audience Segments

1. **Web3 developers on Base** -- primary audience. They build the integrations.
2. **DAO operators and governance designers** -- they feel the sybil/dormant-wallet pain daily.
3. **Content platform builders** (Farcaster ecosystem) -- spam filtering and publishing quality.
4. **Grants program managers** -- application screening at scale.
5. **Crypto-native builders and thought leaders** -- amplification and credibility.

---

## Content Pillars

### Pillar 1: Product Features and Technical Deep Dives

Core messages:
- ALLOW / DENY / ALLOW_WITH_LIMITS -- not a number
- Groth16 ZK proofs, 80-constraint circuit, ~500ms proof generation
- 5 decision contexts with different strictness levels
- On-chain DecisionRegistry on Base mainnet
- Deterministic decision engine with hashable, versionable policy rules

Content formats: Technical threads, architecture breakdowns, "how it works" explainers.

### Pillar 2: Use Case Spotlights

Core messages:
- DAO voting integrity (governance.vote) -- dormant wallets and sybils get DENY
- Spam filtering (comment) -- day-one users with real reputations participate immediately
- Content quality (publish) -- editors review what matters, not everything
- Grant/job screening (apply) -- 200 applications screened in hours, not weeks
- Community access (allowlist.general) -- replace manual moderator review

Content formats: Problem/solution threads, before/after comparisons, scenario walkthroughs.

### Pillar 3: Developer Experience and Integration Guides

Core messages:
- 4-line integration via REST API
- TypeScript SDK: npm install basecred-decision-engine
- What you do NOT have to build (signal aggregation, normalization, ZK circuits, on-chain submission)
- Agent SDK for autonomous AI agents
- End-to-end latency under 2 seconds

Content formats: Code snippet tweets, integration walkthroughs, "what you don't build" lists.

### Pillar 4: Competitive Positioning and Market Education

Core messages:
- vs Gitcoin Passport: stamps + single number vs context-aware decisions + ZK proofs
- vs Worldcoin: biometric orb vs behavioral signals
- vs Galxe: quest completion vs passive reputation reading
- vs Karma3Labs: numeric rankings vs categorical decisions
- Ethos, Talent Protocol, and Neynar are signal INPUTS, not competitors

Content formats: Comparison tweets, "what if" scenarios, market education threads.

### Pillar 5: Community Building and Ecosystem Engagement

Core messages:
- Live on Base mainnet (not testnet, not "coming soon")
- Part of the Base ecosystem
- Integrates with Ethos, Talent Protocol, and Neynar
- Building in public
- Open to protocol partnerships and signal partnerships

Content formats: Polls, question tweets, ecosystem shoutouts, milestone announcements.

---

## Weekly Themes

### Week 1 (Days 1-7): "Introduction and Problem Awareness"

**Objective:** Establish presence. Define the problem space. Make people realize their current reputation checks are broken.

**Tone:** Authoritative, problem-aware. "Here is what is broken. Here is what exists."

**Key narratives:**
- Every onchain app asks the same question: can this wallet be trusted?
- Everyone rebuilds reputation from scratch with fragile heuristics
- A spam filter and a governance gate are not the same problem
- Reputation scores are the wrong abstraction

### Week 2 (Days 8-14): "Technical Deep Dives and ZK Education"

**Objective:** Earn technical credibility. Explain the ZK architecture, decision engine, and on-chain registry. Developers should understand exactly how it works.

**Tone:** Engineering-focused, educational. "Here is how it works, precisely."

**Key narratives:**
- Groth16 proofs in ~500ms, 80-constraint circuit
- 5-phase decision engine: Fallback, Hard-Deny, Allow, Allow-With-Limits, Default Deny
- Signal normalization into categorical tiers (never numeric)
- Policy rules are declarative JSON with SHA-256 hashes
- On-chain DecisionRegistry with verifiable counters

### Week 3 (Days 15-21): "Use Cases and Integration"

**Objective:** Show real scenarios. Make it concrete. Developers should see their own use case reflected.

**Tone:** Practical, specific. "Here is exactly how you would use this."

**Key narratives:**
- DAO governance: dormant wallets DENIED, active members vote with zero friction
- Spam filtering: replace age-based checks with reputation-aware decisions
- Grant screening: 200 applications in hours, not weeks
- Content platforms: auto-publish trusted creators, queue borderline cases for review
- 4-line API integration with code examples

### Week 4 (Days 22-30): "Growth, Community, and Ecosystem"

**Objective:** Drive action. Encourage integrations, partnerships, and community participation. Look forward without overpromising.

**Tone:** Confident, invitational. "This is live. Here is how to use it. Here is where it is going."

**Key narratives:**
- Live on Base mainnet today
- Integration is a single API call
- Protocol partnerships welcome
- Signal partnerships welcome
- The ecosystem of contextual reputation is just beginning

---

## Day-by-Day Plan

---

### WEEK 1: Introduction and Problem Awareness

---

#### Day 1

**Category:** Product Features
**Type:** Thread (5 tweets)
**Suggested time:** 10:00 AM ET (Tuesday)
**Hashtags:** #Base #ZKProofs

**Thread:**

**1/5**
Every onchain app asks the same question: can this wallet be trusted to do this thing, right now?

DAOs need it for voting. Farcaster channels need it for spam filtering. Grants programs need it for screening. Content platforms need it for publishing.

Everyone rebuilds the answer from scratch.

**2/5**
The current options all fall short.

Gitcoin Passport requires stamps and outputs a single number. Worldcoin requires a biometric orb. Galxe requires users to complete quests. Karma3Labs outputs numeric rankings.

None of them return an actionable, context-aware decision.

**3/5**
zkBaseCred is a privacy-preserving reputation primitive on Base mainnet.

It aggregates signals from Ethos, Talent Protocol, and Neynar. It runs them through a deterministic decision engine. It returns ALLOW, DENY, or ALLOW_WITH_LIMITS.

Every decision backed by a Groth16 ZK proof.

**4/5**
Five decision contexts, each with different thresholds:

- allowlist.general -- community access
- comment -- spam filtering (lowest barrier)
- publish -- content quality (high strictness)
- apply -- job/grant screening (capability-focused)
- governance.vote -- DAO voting (strictest, requires recent activity)

**5/5**
A spam filter and a governance gate are not the same problem. They should not use the same threshold.

zkBaseCred treats them differently. Context, not credit scores.

Live on Base mainnet. Docs: docs.zkbasecred.xyz

**Engagement notes:** Pin this thread. Quote tweet part 1/5 with "This is what we have been building." Tag @base in a reply to part 5.

---

#### Day 2

**Category:** Community Building / Engagement
**Type:** Single tweet
**Suggested time:** 1:00 PM ET (Wednesday)
**Hashtags:** #Base

**Tweet:**
```
Every protocol on Base that does reputation checking has built it from scratch. Different implementations, different standards, different failure modes. The plumbing problem nobody talks about.
```
(224 chars)

**Engagement notes:** This is a conversation starter. Reply to responses with specifics about how zkBaseCred solves the fragmentation. Look for DAO and Farcaster builders who engage.

---

#### Day 3

**Category:** Competitive Positioning
**Type:** Single tweet
**Suggested time:** 11:00 AM ET (Thursday)
**Hashtags:** #ZK #Reputation

**Tweet:**
```
Reputation scores are the wrong abstraction. A DAO governance gate and a comment spam filter need different thresholds. Outputting a single number forces every integrator to decide what that number means. Output the decision instead.
```
(233 chars)

**Engagement notes:** This positions the core thesis without naming competitors. If anyone mentions Gitcoin Passport or similar, reply with the specific factual comparison.

---

#### Day 4

**Category:** Use Case Spotlight
**Type:** Single tweet
**Suggested time:** 2:00 PM ET (Friday)
**Hashtags:** #DAOs #Governance

**Tweet:**
```
DAOs using token-weighted voting have a dormant wallet problem. Wallets inactive for months appear for contentious votes. Token holdings do not equal active community participation.
```
(179 chars)

**Engagement notes:** Do not pitch the solution yet. Let the problem resonate. Seed the governance.vote use case. Engage with DAO operators who reply.

---

#### Day 5

**Category:** Developer Experience
**Type:** Single tweet
**Suggested time:** 12:00 PM ET (Saturday)
**Hashtags:** #BuildOnBase #DevEx

**Tweet:**
```
What you do not have to build when you use zkBaseCred: signal aggregation from 3 APIs, signal normalization, policy management, ZK circuit compilation, on-chain submission, graceful degradation. One API call. Under 2 seconds.
```
(225 chars)

**Engagement notes:** Saturday is lower traffic but good for developer audiences who browse on weekends. Reply to any dev questions with code examples.

---

#### Day 6

**Category:** Product Features
**Type:** Single tweet
**Suggested time:** 11:00 AM ET (Sunday)
**Hashtags:** #ZKProofs #Base

**Tweet:**
```
zkBaseCred returns ALLOW, DENY, or ALLOW_WITH_LIMITS. Not a number. Every decision is backed by a Groth16 ZK proof and recorded on-chain. The verifier sees the decision. The underlying signals stay private.
```
(206 chars)

**Engagement notes:** Clean product statement. Good for organic discovery. Reply to comments with links to docs.

---

#### Day 7

**Category:** Community Building / Engagement
**Type:** Poll
**Suggested time:** 10:00 AM ET (Monday)
**Hashtags:** #Web3 #Reputation

**Tweet:**
```
What is the biggest problem with onchain reputation today?
```

**Poll options:**
- No privacy (data exposed to every app)
- One-size-fits-all scores
- Users have to "do stuff" to prove reputation
- No on-chain verifiability

**Engagement notes:** All four options map to zkBaseCred's value prop. Reply to voters with specific context about how zkBaseCred addresses their choice. Do not be salesy -- be informative.

---

### WEEK 2: Technical Deep Dives and ZK Education

---

#### Day 8

**Category:** Product Features (Technical Deep Dive)
**Type:** Thread (6 tweets)
**Suggested time:** 10:00 AM ET (Tuesday)
**Hashtags:** #ZKProofs #Groth16

**Thread:**

**1/6**
How zkBaseCred generates a ZK-proven reputation decision in under 2 seconds. A technical breakdown.

**2/6**
Step 1: Signal Fetch (~400-1000ms)

Three parallel API calls to Ethos (long-term trust), Talent Protocol (builder/creator capability), and Neynar (spam risk). These are signal inputs, not competitors. zkBaseCred consumes their data and adds the decision layer.

**3/6**
Step 2: Normalization

Raw signals are converted into categorical tiers. Trust becomes LOW / NEUTRAL / HIGH / VERY_HIGH. Builder capability becomes NEWCOMER / BUILDER / EXPERT / THOUGHT_LEADER.

No numeric scores ever leave the system. Categories, not credit scores.

**4/6**
Step 3: 5-Phase Rule Evaluation

The decision engine runs a first-match-wins evaluation:

1. Fallback (insufficient data)
2. Hard-Deny (critical risk signals)
3. Allow (all criteria met)
4. Allow-With-Limits (partial match)
5. Default Deny

Deterministic. Auditable. Every rule is declarative JSON with a SHA-256 hash.

**5/6**
Step 4: ZK Proof Generation (~500ms)

A Groth16 proof over an 80-constraint circuit proves that the decision was correctly computed from the normalized signals, without revealing the signals themselves.

The circuit enforces that the same inputs always produce the same output.

**6/6**
Step 5: On-Chain Submission

The decision and proof are submitted to the DecisionRegistry on Base mainnet via a relayer. On-chain counters track totalDecisions, uniqueSubjectCount, and per-context breakdowns.

Total end-to-end: under 2 seconds.

Docs: docs.zkbasecred.xyz

**Engagement notes:** Tag @base on part 6. This thread should be bookmarked by technical followers. Reply to questions with specifics -- this is the credibility-building thread.

---

#### Day 9

**Category:** Competitive Positioning
**Type:** Single tweet
**Suggested time:** 1:00 PM ET (Wednesday)
**Hashtags:** #Reputation #Privacy

**Tweet:**
```
Gitcoin Passport outputs a number. Worldcoin requires an orb. Galxe requires quests. zkBaseCred outputs a context-aware decision backed by a ZK proof. Different problems need different thresholds -- a spam filter and a governance gate are not the same thing.
```
(258 chars)

**Engagement notes:** Factual comparison only. If anyone pushes back, respond with specific technical differences, not opinions. Acknowledge that Gitcoin Passport and others serve their own purposes -- zkBaseCred solves a different problem.

---

#### Day 10

**Category:** Product Features
**Type:** Single tweet
**Suggested time:** 11:00 AM ET (Thursday)
**Hashtags:** #ZK #Privacy

**Tweet:**
```
Prove reputation. Reveal nothing. The integrator sees ALLOW or DENY. The ZK proof verifies the decision was correctly computed. The underlying Ethos, Talent, and Neynar data stays private. That is the point of zero-knowledge proofs.
```
(231 chars)

**Engagement notes:** Clean ZK value prop tweet. Good for the privacy-focused crypto audience.

---

#### Day 11

**Category:** Developer Experience
**Type:** Thread (4 tweets)
**Suggested time:** 10:00 AM ET (Friday)
**Hashtags:** #BuildOnBase #TypeScript

**Thread:**

**1/4**
Integrate reputation-gated access in 4 lines of TypeScript.

**2/4**
```
const res = await fetch(
  "https://zkbasecred.xyz/api/v1/decide-with-proof",
  {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      subject: "0x867c...",
      context: "governance.vote"
    })
  }
);
const { decision, confidence, onChain } = await res.json();
```

That is the entire integration.

**3/4**
What you get back:

- decision: ALLOW, DENY, or ALLOW_WITH_LIMITS
- confidence: how strongly the signals supported the decision
- constraints: any limits on the ALLOW_WITH_LIMITS outcome
- blockingFactors: what the user can improve if denied
- onChain: tx hash of the DecisionRegistry submission

**4/4**
What you did NOT have to build:

- 3 API integrations (Ethos, Talent, Neynar)
- Signal normalization logic
- Context-specific policy rules
- ZK circuit compilation
- Proof generation
- On-chain gas management

You do not need a reputation team. You need a reputation primitive.

npm install basecred-decision-engine

**Engagement notes:** Code in tweets gets strong engagement from developer audiences. Reply to "how does this handle X" questions with specifics from the architecture.

---

#### Day 12

**Category:** Use Case Spotlight
**Type:** Single tweet
**Suggested time:** 2:00 PM ET (Saturday)
**Hashtags:** #Farcaster #SpamFiltering

**Tweet:**
```
Farcaster channels using account age for spam filtering: a bot can wait 30 days. zkBaseCred's comment context checks trust and spam risk regardless of account age. Day-one users with real reputations participate immediately. Bots cannot.
```
(237 chars)

**Engagement notes:** Tag relevant Farcaster channel operators if appropriate. This resonates with anyone running a community that deals with spam.

---

#### Day 13

**Category:** Product Features
**Type:** Single tweet
**Suggested time:** 11:00 AM ET (Sunday)
**Hashtags:** #OnChain #Base

**Tweet:**
```
Every zkBaseCred decision is recorded on the DecisionRegistry on Base mainnet. On-chain counters for total decisions, unique subjects, per-context breakdowns, and per-outcome distributions. Auditable by anyone. Owned by nobody.
```
(226 chars)

**Engagement notes:** Appeals to the transparency-minded audience. Link to the contract on Basescan if anyone asks.

---

#### Day 14

**Category:** Community Building / Engagement
**Type:** Engagement tweet (quote tweet template)
**Suggested time:** 12:00 PM ET (Monday)
**Hashtags:** #Governance #DAOs

**Tweet:**
```
Whenever you see a tweet about DAO governance manipulation, sybil attacks, or dormant wallet voting, this is the reply:

"This is the exact problem context-aware reputation solves. governance.vote requires HIGH trust, recent activity within 30 days, and low spam risk. Dormant wallets get DENY."
```
(Note: This tweet is 280+ chars -- use as a quote tweet of a relevant governance discussion. Trim the intro to fit the QT format.)

**Actual QT template (under 280 chars):**
```
This is the exact problem context-aware reputation solves. governance.vote requires HIGH trust, recent activity within 30 days, and low spam risk. Dormant wallets get DENY. Active members vote with zero friction.
```
(211 chars)

**Engagement notes:** Save this as a template. When a DAO governance controversy trends, quote tweet the discussion with this. Timely engagement drives discovery.

---

### WEEK 3: Use Cases and Integration

---

#### Day 15

**Category:** Use Case Spotlight
**Type:** Thread (6 tweets)
**Suggested time:** 10:00 AM ET (Tuesday)
**Hashtags:** #DAOs #Governance

**Thread:**

**1/6**
DAOs using token-weighted voting have a dormant wallet problem.

Wallets that have not participated in months suddenly appear for contentious votes. Purchased wallets swing outcomes. Sybil accounts split tokens to amplify voting power.

Token holdings do not equal community participation.

**2/6**
The governance.vote context is zkBaseCred's strictest.

Requirements:
- Trust at HIGH or above
- Social Trust at NEUTRAL or above
- Activity within the last 30 days
- Spam risk below HIGH

The recency requirement is unique to governance. Even highly trusted wallets cannot vote if inactive for over 30 days.

**3/6**
The outcome is not binary.

- ALLOW: full voting weight, no friction
- ALLOW_WITH_LIMITS: reduced voting weight (the wallet partially meets criteria)
- DENY: blocked with specific blocking factors explaining why

Partial-meet voters get reduced weight instead of exclusion. Nuance, not a binary gate.

**4/6**
Before: Connect wallet, vote if token balance > 0.

After: Connect wallet, zkBaseCred check, ALLOW (full weight) / ALLOW_WITH_LIMITS (reduced weight) / DENY (with blocking factors).

Active community members retain full voting power with zero additional friction.

**5/6**
Every eligibility check is ZK-proven and recorded on-chain.

The DAO sees who can vote and at what weight. Nobody sees the underlying reputation data -- not the DAO, not other voters, not the public.

Privacy-preserving governance integrity.

**6/6**
If your DAO has ever had a vote swung by wallets that appeared out of nowhere, governance.vote exists for this.

One API call. Under 2 seconds. On-chain verifiable.

Docs: docs.zkbasecred.xyz

**Engagement notes:** This is the flagship use case thread. Tag DAO-focused accounts in replies (not in the thread itself). Engage with anyone who shares dormant-wallet war stories.

---

#### Day 16

**Category:** Developer Experience
**Type:** Single tweet
**Suggested time:** 1:00 PM ET (Wednesday)
**Hashtags:** #DevEx #Base

**Tweet:**
```
"You do not need a reputation team. You need a reputation primitive." One POST request. Five contexts. ZK-proven decisions in under 2 seconds. On-chain record included. npm install basecred-decision-engine
```
(205 chars)

**Engagement notes:** Clean developer value prop. Link to npm package in a reply.

---

#### Day 17

**Category:** Use Case Spotlight
**Type:** Thread (5 tweets)
**Suggested time:** 10:00 AM ET (Thursday)
**Hashtags:** #Grants #Hiring

**Thread:**

**1/5**
Grants programs on Base receive hundreds of applications per cycle. Manual screening means checking each applicant's on-chain history, GitHub contributions, and social presence. It takes weeks. It is inherently subjective.

**2/5**
The apply context is capability-focused.

Requirements:
- Builder capability at EXPERT or above
- Creator capability at EXPERT or above
- Trust at NEUTRAL or above

Social trust has lower weight. This context cares about what you can build, not how popular you are on Farcaster.

**3/5**
Before: 200 applications, 3 reviewers, 2 weeks, 40 shortlisted.

After: 200 applications, zkBaseCred API, instant ALLOW/DENY, ~50 advance to human review, 1 week, 40 selected.

The first pass is automated. Reviewers spend time on qualified candidates, not filtering obvious mismatches.

**4/5**
Denied applicants receive blockingFactors -- specific, actionable reasons explaining what to improve. Not "you did not qualify." Instead: "Builder capability below EXPERT threshold."

Transparency without exposing anyone else's data.

**5/5**
Every screening decision is ZK-proven. No applicant can see another's raw capability data. The grants committee sees decisions, not signals.

Zero qualified builders slip through. Zero reviewer fatigue on first-pass filtering.

API: zkbasecred.xyz/api/v1

**Engagement notes:** Tag grants programs operating on Base if there are active ones. Engage with anyone discussing grants process pain points.

---

#### Day 18

**Category:** Competitive Positioning
**Type:** Single tweet
**Suggested time:** 2:00 PM ET (Friday)
**Hashtags:** #Reputation #Identity

**Tweet:**
```
Most reputation systems require users to do something: scan an orb, complete quests, collect stamps. zkBaseCred reads existing behavioral signals passively. If you have on-chain history, you already have a reputation. We just make it usable.
```
(241 chars)

**Engagement notes:** This contrasts the "active effort" model with passive signal reading. Resonates with users frustrated by stamp/quest fatigue.

---

#### Day 19

**Category:** Use Case Spotlight
**Type:** Single tweet
**Suggested time:** 11:00 AM ET (Saturday)
**Hashtags:** #Content #Farcaster

**Tweet:**
```
Content platforms face a trilemma: open publishing degrades quality, editor-only creates bottlenecks, token-gated has no correlation with quality. The publish context auto-approves trusted creators and queues borderline cases for review.
```
(235 chars)

**Engagement notes:** Relevant to Farcaster ecosystem builders and anyone working on decentralized content platforms.

---

#### Day 20

**Category:** Product Features
**Type:** Single tweet
**Suggested time:** 12:00 PM ET (Sunday)
**Hashtags:** #ZK #Privacy

**Tweet:**
```
ALLOW_WITH_LIMITS is not a compromise. It is precision. A wallet that partially meets criteria gets probationary access, reduced voting weight, or a review queue -- not a binary rejection. Nuance encoded in a ZK proof.
```
(217 chars)

**Engagement notes:** Highlights the three-outcome model which is a key differentiator. Most systems are binary.

---

#### Day 21

**Category:** Community Building / Engagement
**Type:** Poll
**Suggested time:** 10:00 AM ET (Monday)
**Hashtags:** #DAOs #Web3

**Tweet:**
```
Your DAO is about to vote on a contentious treasury proposal. Which reputation check matters most?
```

**Poll options:**
- Token balance (current holdings)
- Recent activity (last 30 days)
- Trust score from multiple sources
- All of the above, weighted by context

**Engagement notes:** The "correct" answer maps to governance.vote which requires all of these. Reply to voters explaining how governance.vote combines these signals. Do not force the conversation -- let it develop naturally.

---

### WEEK 4: Growth, Community, and Ecosystem

---

#### Day 22

**Category:** Product Features
**Type:** Thread (5 tweets)
**Suggested time:** 10:00 AM ET (Tuesday)
**Hashtags:** #Base #ZKProofs

**Thread:**

**1/5**
zkBaseCred has been live on Base mainnet. Here is what the architecture looks like in production.

**2/5**
Signal layer: 3 providers fetched in parallel.

- Ethos: long-term trust and social trust scores
- Talent Protocol: builder and creator capability
- Neynar: spam risk detection

Each signal is normalized into categorical tiers. No raw numeric data leaves the system.

**3/5**
Decision layer: 5 contexts, each with its own policy.

The engine evaluates a first-match-wins rule chain. Rules are declarative JSON, versioned, and hashed with SHA-256. The exact policy used for any decision can be inspected and verified by anyone.

No black boxes.

**4/5**
Proof layer: Groth16 over an 80-constraint circuit.

~500ms proof generation. The proof verifies that the categorical decision was correctly derived from the normalized signals without revealing those signals.

The circuit enforces determinism: same inputs, same output, every time.

**5/5**
On-chain layer: DecisionRegistry on Base mainnet.

UUPS-upgradeable proxy. On-chain counters for total decisions, unique subjects, per-context and per-outcome breakdowns.

Every decision is verifiable. The protocol is transparent. The individual data is private.

zkbasecred.xyz

**Engagement notes:** This is the "state of the protocol" thread. Good for credibility. Share contract addresses in replies if asked.

---

#### Day 23

**Category:** Developer Experience
**Type:** Thread (4 tweets)
**Suggested time:** 1:00 PM ET (Wednesday)
**Hashtags:** #BuildOnBase #AIAgents

**Thread:**

**1/4**
AI agents need reputation checks too. When an autonomous agent acts on behalf of a user, the receiving protocol needs to verify: is this agent's owner trustworthy for this action?

**2/4**
zkBaseCred's Agent SDK allows autonomous agents to:

- Register their owner's wallet
- Request reputation decisions for specific contexts
- Submit decisions on-chain
- Act within the ALLOW / DENY / ALLOW_WITH_LIMITS outcome

The agent inherits its owner's reputation without exposing the owner's data.

**3/4**
Use case: an AI agent applies to a grants program on behalf of its owner. The grants platform calls zkBaseCred with the owner's wallet and the "apply" context. The agent gets ALLOW if the owner has EXPERT+ builder capability.

No doxxing. No manual screening. No trust-me-bro.

**4/4**
Agent reputation is the next frontier. Not agent identity (that is a different problem). Agent reputation: can the human behind this agent be trusted for this specific action?

Agent SDK docs: docs.zkbasecred.xyz

**Engagement notes:** Tag AI agent projects building on Base. This is a forward-looking thread that positions zkBaseCred for the agent economy.

---

#### Day 24

**Category:** Use Case Spotlight
**Type:** Single tweet
**Suggested time:** 11:00 AM ET (Thursday)
**Hashtags:** #NFT #Community

**Tweet:**
```
NFT allowlists curated by moderators: sybil vulnerability, false negatives on legitimate builders, and moderator burnout. The allowlist.general context replaces manual review with a single API call. ALLOW, DENY, or ALLOW_WITH_LIMITS. Instantly.
```
(244 chars)

**Engagement notes:** Relevant to NFT project operators. Engage with anyone discussing allowlist management pain.

---

#### Day 25

**Category:** Competitive Positioning
**Type:** Single tweet
**Suggested time:** 2:00 PM ET (Friday)
**Hashtags:** #Reputation #ZK

**Tweet:**
```
Ethos measures trust. Talent Protocol measures capability. Neynar detects spam. They are signal providers, not reputation systems. zkBaseCred is the decision layer: it consumes their signals, applies context-specific policies, and outputs ZK-proven decisions.
```
(259 chars)

**Engagement notes:** Important positioning tweet. Clarifies the relationship with signal providers. Prevents the "aren't you competing with Ethos?" confusion.

---

#### Day 26

**Category:** Community Building / Engagement
**Type:** Single tweet
**Suggested time:** 11:00 AM ET (Saturday)
**Hashtags:** #Base #BuildInPublic

**Tweet:**
```
Building a reputation primitive means saying no to things that seem obvious. No numeric scores. No single threshold for all contexts. No revealing signal data to integrators. Constraints shape the architecture.
```
(209 chars)

**Engagement notes:** "Building in public" philosophical tweet. Resonates with builders. Opens conversations about design decisions.

---

#### Day 27

**Category:** Product Features
**Type:** Single tweet
**Suggested time:** 12:00 PM ET (Sunday)
**Hashtags:** #ZK #Determinism

**Tweet:**
```
zkBaseCred's decision engine is deterministic. Same wallet, same context, same signal state: same decision every time. Rules are declarative JSON with SHA-256 hashes. The exact policy used for any decision can be inspected. No black boxes.
```
(238 chars)

**Engagement notes:** Appeals to the "don't trust, verify" ethos. Link to policy documentation if anyone asks.

---

#### Day 28

**Category:** Developer Experience
**Type:** Single tweet
**Suggested time:** 10:00 AM ET (Monday)
**Hashtags:** #DevEx #API

**Tweet:**
```
POST a wallet address and a context. Get back ALLOW, DENY, or ALLOW_WITH_LIMITS with a Groth16 proof and an on-chain transaction hash. Under 2 seconds. That is the entire developer experience. The complexity is behind the API.
```
(226 chars)

**Engagement notes:** Reinforces simplicity. Good for developers discovering the account for the first time.

---

#### Day 29

**Category:** Community Building / Engagement
**Type:** Poll
**Suggested time:** 1:00 PM ET (Tuesday)
**Hashtags:** #Web3 #Reputation

**Tweet:**
```
Which use case for context-aware reputation are you most interested in?
```

**Poll options:**
- DAO governance integrity
- Spam filtering for social platforms
- Grant/job application screening
- Content publishing quality gates

**Engagement notes:** This poll doubles as market research. The winning option informs next month's content focus. Reply to each voter with the specific context (governance.vote, comment, apply, publish) that maps to their choice.

---

#### Day 30

**Category:** Product Features
**Type:** Thread (5 tweets)
**Suggested time:** 10:00 AM ET (Wednesday)
**Hashtags:** #Base #ZKProofs

**Thread:**

**1/5**
30 days of explaining what context-aware reputation means. Here is the summary.

**2/5**
The problem: every onchain app rebuilds reputation checks from scratch. Ad-hoc heuristics, no privacy, no verifiability, one-size-fits-all thresholds.

The result: sybil attacks on governance, spam floods on social platforms, weeks-long grant reviews, moderator burnout on allowlists.

**3/5**
The primitive: zkBaseCred aggregates signals from 3 providers, normalizes them into categorical tiers, evaluates against 5 context-specific policies, and returns ALLOW / DENY / ALLOW_WITH_LIMITS.

Every decision backed by a Groth16 ZK proof. Every decision recorded on-chain on Base mainnet.

**4/5**
Five contexts, five products:

- allowlist.general: community access
- comment: spam filtering (lowest barrier)
- publish: content quality (high strictness)
- apply: job/grant screening (capability-focused)
- governance.vote: DAO voting (strictest, requires recent activity)

Context, not credit scores.

**5/5**
Live on Base mainnet. One API call. Under 2 seconds. ZK-proven. On-chain verifiable.

If your protocol needs reputation-gated access, you do not need a reputation team. You need a reputation primitive.

zkbasecred.xyz
docs.zkbasecred.xyz
npm install basecred-decision-engine

**Engagement notes:** Capstone thread. Pin this after the Day 1 thread has had its run. This serves as the evergreen "what is zkBaseCred" reference.

---

## Engagement Strategy

### Reply Templates

Use these as starting points for common reply scenarios. Adapt to context -- never copy-paste robotically.

**When someone asks "How is this different from Gitcoin Passport?"**
> Gitcoin Passport requires users to collect stamps and outputs a single numeric score. Integrators then have to decide what that number means. zkBaseCred outputs a context-aware decision (ALLOW/DENY/ALLOW_WITH_LIMITS) with a ZK proof. Different contexts apply different thresholds automatically. A spam filter and a governance gate use different policies.

**When someone asks "How is this different from Worldcoin?"**
> Worldcoin verifies that a user is a unique human using a biometric orb scan. zkBaseCred verifies that a wallet has sufficient reputation for a specific action using behavioral signals from Ethos, Talent Protocol, and Neynar. Different problems, different approaches. zkBaseCred requires no hardware.

**When someone asks "Why not just use token-gating?"**
> Token holdings do not correlate with trustworthiness, capability, or recent activity. A wallet that bought tokens yesterday and one that has been active in the community for a year look the same to a token gate. zkBaseCred evaluates behavioral signals across multiple dimensions.

**When someone asks "What if I want custom thresholds?"**
> The 5 built-in contexts cover the most common use cases. Custom policy support is on the roadmap -- protocols will be able to define their own thresholds using the same signal inputs and decision engine. Today, the existing contexts handle community access, spam filtering, content publishing, application screening, and governance voting.

**When someone asks "Is this live?"**
> Live on Base mainnet. DecisionRegistry deployed and recording decisions. TypeScript SDK published on npm (basecred-decision-engine). REST API at zkbasecred.xyz/api/v1. Not testnet, not "coming soon."

**When a DAO governance controversy trends:**
> Quote tweet with: "This is the exact problem context-aware reputation solves. governance.vote requires HIGH trust, recent activity within 30 days, and low spam risk. Dormant wallets get DENY. Active members vote with zero friction."

**When spam/bot discussions trend on Farcaster/crypto Twitter:**
> Quote tweet with: "Account age is not a spam filter. A bot can wait 30 days. zkBaseCred's comment context checks trust and spam risk regardless of age. Real users with established reputations participate on day one."

### Quote Tweet Strategy

Monitor these topics for QT opportunities:

1. **DAO governance controversies** -- dormant wallets, whale manipulation, sybil voting
2. **Spam complaints** on Farcaster or crypto social platforms
3. **Grants program discussions** -- review bottlenecks, screening fairness
4. **ZK technology announcements** -- position zkBaseCred as a practical ZK application
5. **Base ecosystem announcements** -- show up as part of the ecosystem
6. **Reputation/identity discussions** -- correct misconceptions about reputation vs identity

**Rule:** Never force it. Only QT when the connection is natural and adds genuine value to the conversation.

### Conversation Starters

Post these as standalone tweets or replies when engagement is low:

- "What is the worst ad-hoc reputation check you have seen in a smart contract?"
- "If you could gate one action in your protocol behind a reputation check, what would it be?"
- "Reputation scores or reputation decisions -- which would you rather integrate?"
- "What signals actually matter for DAO voting eligibility?"
- "Name a protocol that would benefit from context-aware spam filtering."

---

## Content Recycling Guide

### Thread to Single Tweet

Every thread contains 2-3 tweets that work as standalone singles. Extract and schedule them 7-14 days after the original thread.

**Examples from this plan:**

- Day 1 thread, tweet 5 works standalone: "A spam filter and a governance gate are not the same problem. They should not use the same threshold."
- Day 8 thread, tweet 4 works standalone (trimmed): "zkBaseCred's decision engine runs a first-match-wins evaluation: Fallback, Hard-Deny, Allow, Allow-With-Limits, Default Deny. Deterministic. Auditable. Every rule is declarative JSON with a SHA-256 hash."
- Day 15 thread, tweet 3 works standalone: "ALLOW: full voting weight. ALLOW_WITH_LIMITS: reduced weight. DENY: blocked with specific blocking factors. Not binary. Nuanced. ZK-proven."

### Thread to Poll

Convert thread topics into engagement polls 10-14 days later.

**Examples:**
- Day 15 (governance thread) becomes: "Should DAO voting require proof of recent activity, or just token holdings?"
- Day 17 (grants thread) becomes: "How long does your grants program take to screen applications? (a) days, (b) 1-2 weeks, (c) 3+ weeks, (d) we do not screen"

### Single Tweet to Thread

High-performing single tweets (>5x average engagement) can be expanded into threads the following week.

**Expansion pattern:**
1. Repost the original tweet as tweet 1
2. Add 3-4 tweets with technical depth, examples, or code
3. End with a CTA or documentation link

### Poll Results to Content

After each poll closes:
1. Screenshot the results
2. Write a follow-up tweet interpreting the results and connecting to zkBaseCred
3. Use the winning option to guide next week's content emphasis

### Monthly Recap

At the end of each 30-day cycle, compile the top 5 performing tweets into a recap thread. This serves as an evergreen reference for new followers.

---

## Metrics and KPIs

### Weekly Tracking

| Metric | How to Measure | Target |
|---|---|---|
| Impressions per tweet | Twitter Analytics | 2,000+ avg |
| Engagement rate | (likes + replies + RTs + clicks) / impressions | 3%+ |
| Thread completion rate | Impressions on last tweet / impressions on first tweet | 40%+ |
| Profile visits | Twitter Analytics | 500+ per week |
| Follower growth | Net new followers per week | 125-250 |
| Link clicks | Twitter Analytics (clicks to docs, API, npm) | 50+ per week |
| Meaningful replies | Manual count of dev questions, integration inquiries | 5+ per week |

### Monthly Review

| Metric | Target |
|---|---|
| Total followers gained | 500-1,000 |
| Total link clicks to docs/API | 200+ |
| Developer DMs or public integration inquiries | 20+ |
| Ecosystem account retweets | 15+ |
| Poll avg. participation | 50+ votes |
| Top-performing tweet impressions | 10,000+ |

### Content Performance Scoring

Rate each piece of content on a 1-5 scale across:

1. **Reach** -- Did it get seen? (impressions vs average)
2. **Engagement** -- Did people interact? (engagement rate vs average)
3. **Conversion** -- Did it drive action? (link clicks, profile visits)
4. **Quality of engagement** -- Were the replies from target audience? (developers, DAO operators)
5. **Shareability** -- Was it retweeted or quoted by ecosystem accounts?

### Weekly Adjustment Protocol

After each week, review performance and adjust:

- **If threads outperform singles:** Increase thread frequency to 3 per week
- **If polls drive high engagement:** Add a second poll per week
- **If a specific use case resonates:** Double down with more content in that pillar
- **If engagement is low overall:** Shift posting times, increase reply/QT activity
- **If developer questions are frequent:** Create dedicated FAQ-style threads

### Content Pillar Balance Check

At the end of each week, verify content distribution:

| Pillar | Target % | Actual % |
|---|---|---|
| Product Features | 25% | -- |
| Use Case Spotlights | 25% | -- |
| Developer Experience | 20% | -- |
| Competitive Positioning | 15% | -- |
| Community/Engagement | 15% | -- |

If any pillar is more than 10 percentage points off target, rebalance the following week.

---

## Appendix: Posting Schedule Summary

| Day | Weekday | Category | Type | Hook |
|---|---|---|---|---|
| 1 | Tue | Product | Thread (5) | "Every onchain app asks the same question..." |
| 2 | Wed | Community | Single | "Every protocol on Base that does reputation..." |
| 3 | Thu | Competitive | Single | "Reputation scores are the wrong abstraction..." |
| 4 | Fri | Use Case | Single | "DAOs using token-weighted voting..." |
| 5 | Sat | Dev Experience | Single | "What you do not have to build..." |
| 6 | Sun | Product | Single | "zkBaseCred returns ALLOW, DENY, or ALLOW_WITH_LIMITS..." |
| 7 | Mon | Community | Poll | "What is the biggest problem with onchain reputation?" |
| 8 | Tue | Product | Thread (6) | "How zkBaseCred generates a ZK-proven decision..." |
| 9 | Wed | Competitive | Single | "Gitcoin Passport outputs a number..." |
| 10 | Thu | Product | Single | "Prove reputation. Reveal nothing..." |
| 11 | Fri | Dev Experience | Thread (4) | "Integrate reputation-gated access in 4 lines..." |
| 12 | Sat | Use Case | Single | "Farcaster channels using account age..." |
| 13 | Sun | Product | Single | "Every zkBaseCred decision is recorded..." |
| 14 | Mon | Community | QT Template | "This is the exact problem context-aware reputation solves..." |
| 15 | Tue | Use Case | Thread (6) | "DAOs using token-weighted voting have a dormant wallet problem..." |
| 16 | Wed | Dev Experience | Single | "You do not need a reputation team..." |
| 17 | Thu | Use Case | Thread (5) | "Grants programs on Base receive hundreds of applications..." |
| 18 | Fri | Competitive | Single | "Most reputation systems require users to do something..." |
| 19 | Sat | Use Case | Single | "Content platforms face a trilemma..." |
| 20 | Sun | Product | Single | "ALLOW_WITH_LIMITS is not a compromise..." |
| 21 | Mon | Community | Poll | "Which reputation check matters most for DAO voting?" |
| 22 | Tue | Product | Thread (5) | "zkBaseCred has been live on Base mainnet..." |
| 23 | Wed | Dev Experience | Thread (4) | "AI agents need reputation checks too..." |
| 24 | Thu | Use Case | Single | "NFT allowlists curated by moderators..." |
| 25 | Fri | Competitive | Single | "Ethos measures trust. Talent Protocol measures capability..." |
| 26 | Sat | Community | Single | "Building a reputation primitive means saying no..." |
| 27 | Sun | Product | Single | "zkBaseCred's decision engine is deterministic..." |
| 28 | Mon | Dev Experience | Single | "POST a wallet address and a context..." |
| 29 | Tue | Community | Poll | "Which use case are you most interested in?" |
| 30 | Wed | Product | Thread (5) | "30 days of explaining context-aware reputation..." |

### Content Type Distribution (30 days)

| Type | Count |
|---|---|
| Single tweets | 16 |
| Threads | 8 |
| Polls | 3 |
| QT templates | 1 |
| Engagement/conversation | 2 |
| **Total pieces** | **30** |

### Pillar Distribution (30 days)

| Pillar | Count | % |
|---|---|---|
| Product Features | 8 | 27% |
| Use Case Spotlights | 7 | 23% |
| Developer Experience | 6 | 20% |
| Competitive Positioning | 4 | 13% |
| Community/Engagement | 5 | 17% |
