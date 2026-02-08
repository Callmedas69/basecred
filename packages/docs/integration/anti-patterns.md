---
sidebar_position: 9
---

# Anti-Patterns

> What NOT to do with BaseCred.

BaseCred provides neutral context — not judgments. The following patterns violate the foundational principles and will lead to harmful or misleading outcomes.

---

:::danger Don't create a leaderboard
BaseCred decisions are categorical (`ALLOW` / `DENY` / `ALLOW_WITH_LIMITS`), not scalar. Ranking users implies false precision. There is no "score" to sort by, and attempting to derive one misrepresents the system's output.
:::

:::danger Don't use as "Credit Score"
Financial creditworthiness is NOT evaluated by BaseCred. Using it for undercollateralized lending, credit decisions, or financial risk assessment is dangerous and outside the system's design scope.
:::

---

## Treating Context as Authorization

BaseCred provides **descriptive context**, not authorization decisions. Your application must own the enforcement layer. Using BaseCred output directly as an access control gate — without your own policy logic — violates the [Context vs Decision](./context-vs-decision.md) boundary.

**Wrong:** `if (basecred.decision === "ALLOW") grantAccess()`
**Right:** Use BaseCred output as one input to your application's own authorization logic.

## Auto-Blocking Users from Signals Alone

Never automatically block a user solely because BaseCred returned `DENY`. A denial may reflect missing data (`LOW` confidence), not malicious behavior. Always check the `confidence` field and `explain` array before taking punitive action.

## Caching Decisions as Permanent Verdicts

Decisions are point-in-time snapshots. They reflect the state of signals at the moment of the request. Caching a decision and replaying it hours or days later treats an ephemeral assessment as a permanent verdict. Always re-request when the action occurs.

See [Time & Recency](./time-and-recency.md) for more on why decisions are ephemeral.

## Exposing Raw Signals as "Scores" to End Users

The normalized signals (trust tier, builder capability, etc.) are **internal engine inputs**, not user-facing metrics. Displaying them as scores or ratings to end users:

- Creates false precision (tiers are categorical, not numeric)
- Encourages gaming behavior
- Misrepresents what the system measures

If you need to communicate standing to users, use the `explain` array from the decision output — it is designed for human consumption.

## Merging with Other Scoring Systems

Combining BaseCred output with other reputation or scoring systems into a single composite number destroys the categorical semantics. BaseCred decisions are self-contained and should not be averaged, weighted, or blended with external scores.
