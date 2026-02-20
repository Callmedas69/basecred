/** A single zkProof use case example */
export interface UseCase {
  id: string;
  title: string;                    // e.g. "Governance Voting Power"
  description: string;              // What this use case does
  context: string;                  // e.g. "governance.vote"
  decisionOutcome: "ALLOW" | "DENY" | "ALLOW_WITH_LIMITS";
  effect: UseCaseEffect;           // What happens when decision is reached
  category: UseCaseCategory;
}

/** The concrete effect of a zkProof decision */
export interface UseCaseEffect {
  type: "multiplier" | "access" | "threshold" | "custom";
  label: string;                   // e.g. "Voting power multiplied by 3x"
  value?: number;                  // e.g. 3 for a 3x multiplier
  unit?: string;                   // e.g. "x", "%", "votes"
}

/** Grouping category for use cases */
export type UseCaseCategory =
  | "governance"
  | "access-control"
  | "moderation"
  | "financial"
  | "identity";
