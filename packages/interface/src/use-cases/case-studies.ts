export interface CaseStudy {
  id: string
  context: string
  number: number
  title: string
  subtitle: string
  problem: {
    intro: string
    failureModes: string[]
  }
  solution: {
    description: string
    beforeAfter: { before: string; after: string }
    signals: string[]
    codeSnippet?: string
  }
  result: {
    metrics: string[]
    keyQuote: string
  }
}

export const CASE_STUDIES: CaseStudy[] = [
  {
    id: "allowlist-general",
    context: "allowlist.general",
    number: 1,
    title: "Community Access Gatekeeping",
    subtitle:
      "Replace manual allowlist curation with automated reputation gating.",
    problem: {
      intro:
        "Projects running token-gated communities, NFT allowlists, or early access programs on Base typically manage access through a combination of manual Discord role checks, minimum token balance requirements, and subjective moderator review.",
      failureModes: [
        "Sybil vulnerability — users create multiple wallets to claim multiple allowlist spots",
        "False negatives — legitimate builders with strong reputations are denied because they don't hold the right tokens",
        "Moderator burnout — the review queue for borderline cases grows faster than the team can process",
      ],
    },
    solution: {
      description:
        "The allowlist.general context replaces manual review pipelines with a single API call. Users who receive ALLOW_WITH_LIMITS get probationary access with reduced permissions until their reputation signals strengthen.",
      beforeAfter: {
        before:
          "User applies → Moderator reviews Discord history + wallet → Manual approve/deny",
        after:
          "User submits wallet → zkBaseCred API call → Automatic ALLOW / DENY / ALLOW_WITH_LIMITS",
      },
      signals: ["trust", "socialTrust", "builder", "creator"],
    },
    result: {
      metrics: [
        "Reduction in manual review workload",
        "Decrease in sybil-linked duplicate applications",
        "Zero raw reputation data exposed to moderators or applicants",
        "Decisions are on-chain verifiable via the DecisionRegistry",
        "Denied users receive blockingFactors explaining what to improve",
      ],
      keyQuote:
        "We went from a 3-day review backlog to instant, verifiable decisions.",
    },
  },
  {
    id: "comment",
    context: "comment",
    number: 2,
    title: "Spam Filtering at Scale",
    subtitle:
      "Cut comment spam without blocking legitimate new users.",
    problem: {
      intro:
        "Social platforms and Farcaster channels using age-based spam filters face a binary problem: accounts older than 30 days are allowed to comment, newer accounts are rate-limited. This creates a gap that sophisticated bots exploit while frustrating legitimate newcomers.",
      failureModes: [
        "Sophisticated spam bots age accounts past the 30-day threshold and then flood channels",
        "Legitimate new users with strong reputations elsewhere are frustrated by rate limits that don't reflect their actual trustworthiness",
      ],
    },
    solution: {
      description:
        "The comment context has the lowest barrier of any zkBaseCred decision — it only requires Trust at NEUTRAL or above and Social Trust at NEUTRAL or above. Spam bots with HIGH or VERY_HIGH spam risk are hard-denied regardless of account age.",
      beforeAfter: {
        before: "if (account.age < 30 days) → rateLimit()",
        after:
          "zkBaseCred API call → DENY (reject) / ALLOW_WITH_LIMITS (rate-limit) / ALLOW (post immediately)",
      },
      signals: ["trust", "socialTrust"],
      codeSnippet: `// Before: if (account.age < 30) rateLimit()
// After:
const { decision } = await zkBaseCred.decide(wallet, "comment");
if (decision === "DENY") return rejectComment();
if (decision === "ALLOW_WITH_LIMITS") return rateLimitComment();
// ALLOW: post immediately`,
    },
    result: {
      metrics: [
        "Reduction in spam comments reaching the feed",
        "Fewer false-positive blocks on legitimate new users",
        "New users with established Farcaster presence can comment immediately on day one",
        "No user data exposure — the platform never sees signal data, only the categorical decision",
      ],
      keyQuote:
        "Day-one users with real reputations can participate immediately. Bots can't.",
    },
  },
  {
    id: "publish",
    context: "publish",
    number: 3,
    title: "Content Quality Gatekeeping",
    subtitle:
      "Automate editorial access decisions with privacy-preserving reputation checks.",
    problem: {
      intro:
        "Content platforms need quality control but face a trilemma: open publishing degrades quality, editor-only publishing creates bottlenecks and centralization criticism, and token-gated publishing has no correlation with content quality.",
      failureModes: [
        "Open publishing leads to low-quality content that degrades the platform's reputation",
        "Editor-only publishing creates a bottleneck and is criticized as centralized gatekeeping",
        "Token-gated publishing has no correlation with content quality — wealthy wallets aren't necessarily good writers",
      ],
    },
    solution: {
      description:
        "The publish context applies stricter thresholds than comment: Trust at HIGH+, Social Trust at HIGH+, and Builder OR Creator capability at BUILDER+. Users who partially meet criteria receive ALLOW_WITH_LIMITS with a review_queue constraint.",
      beforeAfter: {
        before:
          "All submissions → Editor reviews every post → Publish or reject",
        after:
          "zkBaseCred check → ALLOW (auto-publish) / ALLOW_WITH_LIMITS (flagged for review) / DENY (with actionable feedback)",
      },
      signals: ["trust", "socialTrust", "builder", "creator"],
    },
    result: {
      metrics: [
        "Submissions auto-approved without editor intervention",
        "Reduction in low-quality published content",
        "Editors focus on borderline cases instead of reviewing everything",
        "Authors see actionable feedback instead of opaque rejections",
        "Every publishing decision is ZK-proven and verifiable",
      ],
      keyQuote:
        "Our editors went from reviewing everything to reviewing only what matters.",
    },
  },
  {
    id: "apply",
    context: "apply",
    number: 4,
    title: "Job & Grant Application Screening",
    subtitle:
      "Screen applications in hours instead of weeks.",
    problem: {
      intro:
        "Grants programs, bounty platforms, and hiring pipelines on Base receive hundreds of applications per cycle. Manual screening requires checking each applicant's on-chain history, GitHub contributions, and social presence — a process that takes weeks and is inherently subjective.",
      failureModes: [
        "Review takes weeks per cycle as reviewers manually check on-chain history, GitHub, and social presence",
        "Subjective rubrics mean different reviewers weight the same criteria differently",
        "Applicants have no visibility into what qualifies them, leading to frustration and repeated applications",
      ],
    },
    solution: {
      description:
        "The apply context is capability-focused: Builder capability at EXPERT+, Creator capability at EXPERT+, and Trust at NEUTRAL+. Social trust has lower weight — this context cares about what you can build, not how popular you are on Farcaster.",
      beforeAfter: {
        before:
          "200 applications → 3 reviewers → 2 weeks → 40 shortlisted",
        after:
          "200 applications → zkBaseCred API → instant ALLOW/DENY → ~50 advance to human review → 1 week → 40 selected",
      },
      signals: ["builder", "creator", "trust"],
    },
    result: {
      metrics: [
        "Reduction in first-pass review time",
        "Zero qualified applicants missed due to reviewer fatigue",
        "Applicants see why they were screened out via blockingFactors",
        "Reviewers spend time on qualified candidates instead of filtering mismatches",
        "ZK proofs ensure no applicant can see another's raw capability data",
      ],
      keyQuote:
        "We screened 200 applications in hours, not weeks. Zero qualified builders slipped through.",
    },
  },
  {
    id: "governance-vote",
    context: "governance.vote",
    number: 5,
    title: "DAO Voting Integrity",
    subtitle:
      "Eliminate dormant-wallet voting manipulation with reputation-gated governance.",
    problem: {
      intro:
        "DAOs using token-based governance (1 token = 1 vote) face persistent manipulation: dormant wallets reactivate for contentious votes, purchased wallets swing outcomes, and sybil accounts split tokens to amplify voting power. Token holdings don't reflect genuine community participation.",
      failureModes: [
        "Dormant wallets that have been inactive for months suddenly appear to vote on contentious proposals",
        "Purchased wallets with accumulated tokens but no genuine community participation are used to swing votes",
        "Sybil accounts split tokens across multiple wallets to amplify voting power",
      ],
    },
    solution: {
      description:
        "The governance.vote context is zkBaseCred's strictest: Trust at HIGH+, Social Trust at NEUTRAL+, Recency within 30 days, and Spam Risk below HIGH. The recency requirement is unique to governance — even highly trusted wallets cannot vote if inactive for over 30 days.",
      beforeAfter: {
        before: "Connect wallet → Vote (if token balance > 0)",
        after:
          "Connect wallet → zkBaseCred check → ALLOW (full weight) / ALLOW_WITH_LIMITS (reduced weight) / DENY (with blocking factors)",
      },
      signals: ["trust", "socialTrust", "recency", "spamRisk"],
    },
    result: {
      metrics: [
        "Reduction in votes from wallets with no recent community activity",
        "Decrease in suspected sybil voting patterns",
        "Active community members retain full voting power with zero friction",
        "Partial-meet voters get reduced weight instead of binary exclusion",
        "Every eligibility check is ZK-proven and recorded on-chain",
      ],
      keyQuote:
        "Real community members vote. Dormant whales and sybils don't.",
    },
  },
]
