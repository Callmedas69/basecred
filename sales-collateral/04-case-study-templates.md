# zkBaseCred Case Study Templates

> One template per decision context. Each follows the Problem, Solution, Result structure.
> Replace [brackets] with actual partner data when real integrations are live.

---

## Case Study 1: allowlist.general — Community Access Gatekeeping

### Title
**[Protocol Name] replaced manual allowlist curation with automated reputation gating.**

### The Problem
[Protocol Name] runs a [type: token-gated community / NFT allowlist / early access program] on Base with [X] members. Previously, they managed access through a combination of:
- Manual Discord role checks
- Minimum token balance requirements
- Subjective moderator review

This approach had three failure modes:
1. **Sybil vulnerability**: Users created multiple wallets to get multiple allowlist spots
2. **False negatives**: Legitimate builders with strong reputations were denied because they did not hold the right tokens
3. **Moderator burnout**: The review queue for borderline cases grew faster than the team could process

### The Solution
[Protocol Name] integrated zkBaseCred's `allowlist.general` context via the REST API. The integration replaced their manual review pipeline:

```
Before: User applies -> Moderator reviews Discord history + wallet -> Manual approve/deny
After:  User submits wallet -> zkBaseCred API call -> Automatic ALLOW / DENY / ALLOW_WITH_LIMITS
```

The `allowlist.general` context evaluates:
- **Trust** (Ethos): Long-term credibility across the ecosystem
- **Social Trust** (Neynar): Farcaster legitimacy and quality
- **Builder / Creator** (Talent Protocol): Demonstrated capability

Users who receive `ALLOW_WITH_LIMITS` get probationary access with reduced permissions until their reputation signals strengthen.

### The Result
- **[X]% reduction** in manual review workload
- **[X]% decrease** in sybil-linked duplicate applications
- **Zero** raw reputation data exposed to moderators or applicants
- Decisions are on-chain verifiable: any community member can check the DecisionRegistry
- Users denied access receive `blockingFactors` explaining what to improve (e.g., "trust", "builder") — not an opaque rejection

### Key Quote
> "[Quote from partner about the integration experience, time saved, or trust improvement.]"

---

## Case Study 2: comment — Spam Filtering at Scale

### Title
**[Platform Name] cut comment spam by [X]% without blocking legitimate new users.**

### The Problem
[Platform Name] operates a [Farcaster channel / forum / social platform] with [X] daily active commenters. Their existing spam filter used a binary approach:
- Accounts older than 30 days: allowed to comment
- Accounts newer than 30 days: rate-limited to 3 comments per hour

This caused two problems:
1. **Sophisticated spam bots** aged accounts past the 30-day threshold and then flooded channels
2. **Legitimate new users** with strong reputations elsewhere were frustrated by rate limits that did not reflect their actual trustworthiness

### The Solution
[Platform Name] replaced their age-based filter with zkBaseCred's `comment` context. This context has the lowest barrier of any zkBaseCred decision — it only requires:
- **Trust** at NEUTRAL or above (Ethos)
- **Social Trust** at NEUTRAL or above (Neynar)

Spam bots with HIGH or VERY_HIGH spam risk are hard-denied regardless of account age. Users with VERY_LOW trust or social trust are also blocked.

The integration was a single API call added to their comment submission handler:

```typescript
// Before: if (account.age < 30) rateLimit()
// After:
const { decision } = await zkBaseCred.decide(wallet, "comment");
if (decision === "DENY") return rejectComment();
if (decision === "ALLOW_WITH_LIMITS") return rateLimitComment();
// ALLOW: post immediately
```

### The Result
- **[X]% reduction** in spam comments reaching the feed
- **[X]% fewer** false-positive blocks on legitimate new users
- New users with established Farcaster presence (HIGH social trust) could comment immediately on day one
- No user data exposure: the platform never sees Ethos or Neynar signal data, only the categorical decision

### Key Quote
> "[Quote about spam reduction or new-user experience improvement.]"

---

## Case Study 3: publish — Content Quality Gatekeeping

### Title
**[Publisher Name] automated editorial access decisions with privacy-preserving reputation checks.**

### The Problem
[Publisher Name] runs a [decentralized blog / content platform / curation protocol] on Base. They wanted to allow community members to publish articles, but needed quality control:
- **Open publishing** led to low-quality content that degraded the platform's reputation
- **Editor-only publishing** created a bottleneck and was criticized as centralized gatekeeping
- **Token-gated publishing** had no correlation with content quality — wealthy wallets are not necessarily good writers

They needed a middle ground: allow publishing for users with demonstrated credibility, without a human review step for every post.

### The Solution
[Publisher Name] integrated the `publish` context, which applies stricter thresholds than `comment`:
- **Trust** at HIGH or above (Ethos)
- **Social Trust** at HIGH or above (Neynar)
- **Builder OR Creator capability** at BUILDER or above (Talent Protocol)

Users who meet all three criteria get `ALLOW` and can publish immediately. Users who partially meet criteria receive `ALLOW_WITH_LIMITS` with a `review_queue` constraint — their posts are published but flagged for editor review. Users who fail get `DENY` with specific `blockingFactors` explaining which signals need improvement.

### The Result
- **[X]% of submissions** auto-approved without editor intervention
- **[X]% reduction** in low-quality published content
- Editors focus on borderline cases (`ALLOW_WITH_LIMITS`) instead of reviewing everything
- Authors see actionable feedback ("Improve your creator capability on Talent Protocol") instead of opaque rejections
- Every publishing decision is ZK-proven: authors can verify they were evaluated fairly without seeing other authors' signal data

### Key Quote
> "[Quote about editorial quality, author experience, or time savings.]"

---

## Case Study 4: apply — Job and Grant Application Screening

### Title
**[Program Name] screened [X] grant applications in [Y] hours instead of [Z] weeks.**

### The Problem
[Program Name] runs a [grants program / bounty platform / hiring pipeline] on Base. Each cycle, they receive [X] applications and have [Y] reviewers. The review process:
1. Collect applications (wallet + project description)
2. Manually check each applicant's on-chain history, GitHub contributions, and social presence
3. Evaluate applicants on a subjective rubric
4. Select finalists

This process took [Z] weeks per cycle. Worse, it was subjective — different reviewers weighted the same criteria differently, and applicants had no visibility into what qualified them.

### The Solution
[Program Name] integrated the `apply` context as a first-pass screen. This context is **capability-focused**:
- **Builder capability** at EXPERT or above (Talent Protocol)
- **Creator capability** at EXPERT or above (Talent Protocol)
- **Trust** at NEUTRAL or above (Ethos)

Note: Social trust has lower weight in this context. The `apply` context cares about what you can build, not how popular you are on Farcaster.

The integration replaced the first-pass manual review:
```
Before: 200 applications -> 3 reviewers -> 2 weeks -> 40 shortlisted
After:  200 applications -> zkBaseCred API -> instant ALLOW/DENY ->
        ALLOW applicants (~50) advance to human review -> 1 week -> 40 selected
```

### The Result
- **[X]% reduction** in first-pass review time
- **Zero** qualified applicants missed due to reviewer fatigue
- Applicants see why they were screened out: `blockingFactors: ["builder"]` means "your builder capability on Talent Protocol needs improvement"
- Reviewers spend time on qualified candidates instead of filtering obvious mismatches
- ZK proofs ensure no applicant can see another applicant's raw capability data

### Key Quote
> "[Quote about review efficiency, applicant experience, or fairness.]"

---

## Case Study 5: governance.vote — DAO Voting Integrity

### Title
**[DAO Name] eliminated dormant-wallet voting manipulation with reputation-gated governance.**

### The Problem
[DAO Name] is a [X]-member DAO on Base that uses [Snapshot / on-chain voting] for governance. They faced a persistent problem:
- **Dormant wallets** that had been inactive for months would suddenly appear to vote on contentious proposals
- **Purchased wallets** with accumulated tokens but no genuine community participation were used to swing votes
- **Sybil accounts** split tokens across multiple wallets to amplify voting power

Token-based governance (1 token = 1 vote) did not reflect who was actually participating in the community. The DAO needed a way to verify that voters were real, active, trusted community members — without requiring KYC or doxxing.

### The Solution
[DAO Name] integrated the `governance.vote` context as a prerequisite for voting. This is zkBaseCred's **strictest context**:
- **Trust** at HIGH or above (Ethos)
- **Social Trust** at NEUTRAL or above (Neynar)
- **Recency** within 30 days (must have been active recently)
- **Spam Risk** below HIGH (hard-deny threshold)

The recency requirement is unique to governance: even highly trusted wallets cannot vote if they have been inactive for more than 30 days. This prevents "dormant whale" attacks.

Integration into their voting flow:
```
Before: Connect wallet -> Vote (if token balance > 0)
After:  Connect wallet -> zkBaseCred check (governance.vote) ->
        ALLOW: vote with full weight
        ALLOW_WITH_LIMITS: vote with reduced_weight constraint
        DENY: cannot vote (with explanation of blocking factors)
```

### The Result
- **[X]% reduction** in votes from wallets with no recent community activity
- **[X]% decrease** in suspected sybil voting patterns
- Active community members retained full voting power with zero friction
- Voters receive `ALLOW_WITH_LIMITS` (reduced weight) instead of binary exclusion when they partially meet criteria
- Every voting eligibility check is ZK-proven: no voter sees another voter's trust or activity data
- All eligibility decisions recorded on-chain in the DecisionRegistry for transparency

### Key Quote
> "[Quote about governance integrity, community trust, or reduced manipulation.]"

---

## Template Usage Notes

**When creating a real case study from these templates:**

1. Replace all [bracketed] values with actual data from the integration partner
2. Request specific metrics: percentage improvements, time savings, volume numbers
3. Get a direct quote from a named person at the partner organization
4. Include the partner's logo and a link to their product
5. Add a "Technical Details" sidebar with: API endpoint used, average latency observed, on-chain transaction examples
6. Link to the relevant DecisionRegistry transactions on Basescan as proof
