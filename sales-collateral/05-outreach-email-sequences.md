# zkBaseCred Outreach Email Sequences

> Two sequences: (A) Developer cold outreach, (B) Protocol partnership outreach.
> Each sequence is 3 emails. Spacing: Email 1 (Day 0), Email 2 (Day 3), Email 3 (Day 7).

---

## Sequence A: Developer Cold Outreach

Target: Individual developers or small teams building on Base who handle access control, spam filtering, or community gating.

---

### A1: The Hook (Day 0)

**Subject line options (test 2-3):**
- "Your app already has reputation data. You're just not using it."
- "One API call replaces your spam filter + allowlist + access control"
- "Stop building reputation plumbing. Start shipping."

**Body:**

Hi [Name],

I noticed [specific observation: "you're building a Farcaster client on Base" / "your DAO uses token-gated governance" / "you launched a grants program recently"]. I wanted to share something that might save you significant engineering time.

We built zkBaseCred — a reputation primitive for Base. One API call turns a wallet address into a categorical access decision (ALLOW / DENY / ALLOW_WITH_LIMITS). Under the hood, it aggregates signals from Ethos, Talent Protocol, and Neynar, normalizes them into tiers, evaluates context-specific rules, and generates a ZK proof — all in under 2 seconds. Reputation without opinion: deterministic decisions, not subjective numbers.

The part that might matter most to you: **five built-in contexts** designed for the exact decisions you probably make manually today:

- `comment` — spam filtering (lowest barrier)
- `publish` — content quality gating
- `allowlist.general` — community access control
- `apply` — application screening
- `governance.vote` — voting eligibility (strictest)

It is live on Base mainnet with on-chain verification. The TypeScript SDK is on npm.

If any of those contexts match a problem you are solving, I would be happy to walk you through the integration — it is genuinely 4 lines of code for the REST API.

Best,
[Sender]

P.S. Here is the SDK if you want to explore on your own: `npm install basecred-decision-engine`

---

### A2: The Technical Proof (Day 3)

**Subject line:** "How zkBaseCred evaluates a wallet in <2 seconds"

**Body:**

Hi [Name],

Following up on my last note about zkBaseCred. I wanted to share a concrete example of what the API returns, because the best way to evaluate infrastructure is to see the output.

When you POST a wallet address with context `governance.vote`, here is what comes back:

```json
{
  "decision": "ALLOW",
  "confidence": "HIGH",
  "constraints": [],
  "explain": ["Active, trusted member eligible for governance"],
  "onChain": {
    "submitted": true,
    "txHash": "0x..."
  }
}
```

What happened behind the scenes:
1. Fetched trust data from Ethos, user quality from Neynar, builder/creator capability from Talent Protocol (~500ms, parallel)
2. Normalized everything into categorical tiers (trust: HIGH, socialTrust: HIGH, spamRisk: VERY_LOW, etc.)
3. Evaluated 5-phase rule engine against `governance.vote` policy thresholds
4. Generated a Groth16 ZK proof in ~500ms (proves the decision was correctly computed without revealing signal data)
5. Auto-submitted to the DecisionRegistry on Base mainnet

Your app never sees the raw signals. Your users never see each other's data. Every decision is on-chain and verifiable. Prove reputation. Reveal nothing.

If this is relevant to what you are building, I am happy to jump on a 15-minute call to discuss integration. No pitch deck — just the technical details.

Best,
[Sender]

---

### A3: The Soft Close (Day 7)

**Subject line:** "Last note — open source if you want to dig in"

**Body:**

Hi [Name],

Last follow-up — I do not want to be noise in your inbox.

Two things worth mentioning:

1. **The decision engine SDK is fully inspectable.** Every rule, threshold, and normalization function is in the TypeScript source. You can read the exact logic that produces ALLOW/DENY decisions before you integrate. No black boxes.

2. **You probably have a version of this problem already.** If you are checking Farcaster follower counts, requiring minimum token balances, or manually reviewing applications — that is the plumbing zkBaseCred replaces. The difference is: we aggregate 3 signal inputs, handle partial data gracefully, generate ZK proofs for privacy, and record everything on-chain. Unlike Gitcoin Passport (stamps), Worldcoin (orb), or Karma3Labs (numbers), zkBaseCred returns context-aware decisions your app can act on directly.

If the timing is not right, no worries. The SDK is on npm (`basecred-decision-engine`) and the docs are at basecred.xyz whenever you need it.

Best,
[Sender]

---

## Sequence B: Protocol Partnership Outreach

Target: Protocol founders, product leads, or BD teams at Base-native protocols that could integrate zkBaseCred as infrastructure (DAOs, social platforms, grants programs, content platforms).

---

### B1: The Strategic Pitch (Day 0)

**Subject line options (test 2-3):**
- "[Protocol Name] + zkBaseCred: reputation infrastructure without the build"
- "Proposal: privacy-preserving reputation for [Protocol Name]"
- "What if [Protocol Name]'s access control was ZK-verified on Base?"

**Body:**

Hi [Name],

I lead [zkBaseCred / product at BaseCred], and I have been following [Protocol Name]'s growth on Base. [Specific observation: "Your governance participation has been growing rapidly" / "The new publishing feature you launched is impressive" / "Your grants program is one of the most active on Base"].

I wanted to propose something specific: integrating zkBaseCred as the reputation primitive for [specific feature: "your voting eligibility checks" / "your content moderation pipeline" / "your grant application screening"].

**What zkBaseCred provides that you would not have to build:**
- Signal aggregation from Ethos (trust), Talent Protocol (builder/creator capability), and Neynar (spam risk) — these are inputs, not competitors
- Context-specific decision engine with 5 built-in contexts and calibrated thresholds
- ZK proofs (Groth16) that verify decisions without exposing users' raw data
- On-chain record of every decision on Base mainnet via DecisionRegistry
- Graceful degradation when signal providers are unavailable
- Human-readable explanations for denied users (what to improve, not just "no")

**What this means for [Protocol Name]:**
- Replace [current approach: "manual moderation" / "token-gated access" / "subjective review"] with auditable, deterministic decisions — reputation without opinion
- Give your users privacy: they prove they qualify without revealing their data
- Ship the feature in days instead of building reputation infrastructure for months
- Every decision is on-chain verifiable — your community can audit the system

The integration is a single REST API call. We handle signal fetching, normalization, rule evaluation, ZK proof generation, and on-chain submission. You get back `ALLOW`, `DENY`, or `ALLOW_WITH_LIMITS` with confidence and explanation.

Would you be open to a 20-minute call this week to explore whether this fits your roadmap?

Best,
[Sender]

---

### B2: The Use Case Deep Dive (Day 3)

**Subject line:** "How [Protocol Name] could use zkBaseCred — specific scenario"

**Body:**

Hi [Name],

I wanted to follow up with a concrete scenario for how zkBaseCred would work inside [Protocol Name].

**Scenario: [Choose the most relevant one based on the protocol]**

*If DAO / Governance:*
Today, [Protocol Name] likely gates voting with token balance checks. This means dormant whales with large holdings but no recent participation can swing votes, and sybil accounts can split tokens across wallets.

With zkBaseCred's `governance.vote` context, voting eligibility would require:
- HIGH trust (Ethos) — long-term credibility, not just token holdings
- NEUTRAL or above social trust (Neynar) — genuine community presence
- Activity within the last 30 days — eliminates dormant wallet manipulation
- Below HIGH spam risk — catches sybil patterns

Users who meet all criteria vote with full weight. Users who partially qualify get `ALLOW_WITH_LIMITS` with reduced weight. Users who fail get a clear explanation of what to improve.

*If Content Platform:*
With zkBaseCred's `publish` context, new authors would automatically qualify to publish based on demonstrated trust and capability — no moderator bottleneck. The `comment` context handles spam filtering at the interaction level.

*If Grants Program:*
With zkBaseCred's `apply` context, first-pass screening would focus on builder and creator capability (sourced from Talent Protocol) rather than social popularity. Qualified applicants advance to human review; unqualified applicants get specific feedback on what to improve.

**Integration effort:** One API endpoint, one POST request per decision. We handle everything else. Your frontend gets back a decision, explanation, and on-chain tx hash.

Happy to map this out for your specific architecture. Just reply and I will set up a call.

Best,
[Sender]

---

### B3: The Partnership Frame (Day 7)

**Subject line:** "Partnership proposal: zkBaseCred as [Protocol Name]'s reputation layer"

**Body:**

Hi [Name],

Final note from me on this. I wanted to frame what a partnership between [Protocol Name] and zkBaseCred would look like in practice.

**What we bring:**
- Production-ready reputation API on Base mainnet (live, not testnet)
- ZK-proven decisions with on-chain verification
- TypeScript SDK and Agent SDK for flexible integration
- Five calibrated decision contexts covering the most common access control patterns
- Ongoing signal source expansion (we are adding attestation and on-chain activity signals)

**What we would ask from you:**
- Integration into one feature (governance, publishing, applications, or moderation)
- Feedback on threshold calibration for your community's specific needs
- A co-marketing case study once the integration is live
- Permission to list [Protocol Name] as an integration partner

**What [Protocol Name] gets:**
- Reputation-based access control without months of engineering
- Privacy-preserving decisions your users can verify but not reverse-engineer — prove reputation, reveal nothing
- On-chain audit trail for every decision
- "Powered by zkBaseCred" trust signal for your community

If this is interesting but the timing is not right, I am happy to reconnect in [Q3 / after your next release / whenever makes sense]. The infrastructure is live and we are actively supporting Base-native integrations.

Best,
[Sender]

P.S. You can inspect every rule and threshold in the open-source SDK: `npm install basecred-decision-engine`. No black boxes.

---

## Sequence Notes

**Personalization requirements:**
- Every email MUST include a specific observation about the recipient's protocol/project
- Never send generic versions — if you cannot find something specific, do not send
- Match the context recommendation to the protocol's actual product (do not suggest governance.vote to a content platform)

**Tracking:**
- Track opens and replies per email in each sequence
- If Email 1 is opened 2+ times but no reply, accelerate Email 2 to Day 2
- If no opens on any email, try a different subject line variant before giving up

**Follow-up rules:**
- If they reply with interest: schedule a call within 48 hours
- If they reply with "not now": set a reminder for 60 days
- If they reply with a technical question: answer directly in email, then offer a call
- After Sequence 3 with no reply: wait 90 days, then re-engage with new context (e.g., new feature launch, new signal source added)
