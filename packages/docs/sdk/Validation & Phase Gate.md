---
sidebar_position: 6
sidebar_label: "1.5: Validation Gate"
---

# Sub-Phase 1.5: Validation & Phase Gate

> Verify the SDK meets Phase 0's philosophical requirements.

## Objective

Answer **YES** to all:

1. Output feels neutral
2. Absence is explicit
3. Time matters more than score
4. Resistant to gamification

If any answer is **NO**, Phase 1 fails.

## Criterion 1: Output Feels Neutral

**Question:** Does the SDK output avoid labeling, judging, or implying quality?

| Check                          | Finding                                    |
| ------------------------------ | ------------------------------------------ |
| No `rank` field                | ✅ Not present                             |
| No `percentile` field          | ✅ Not present                             |
| No `tier` field                | ✅ Not present                             |
| Scores are raw values          | ✅ `score: number`, `builderScore: number` |
| No labels ("trusted", "risky") | ✅ No string labels exist                  |
| Facets are parallel            | ✅ `ethos?`, `talent?` are siblings        |

**Verdict: PASS**

## Criterion 2: Absence Is Explicit

**Question:** When data is missing, is it clearly communicated?

| Check                                       | Finding                                       |
| ------------------------------------------- | --------------------------------------------- |
| `availability.ethos` always declares state  | ✅ Required field, 4 valid states             |
| `availability.talent` always declares state | ✅ Required field, 4 valid states             |
| Missing facets are omitted (not null)       | ✅ Property absent if not available           |
| Unknown meta fields use `null`              | ✅ `firstSeenAt: null`, `lastUpdatedAt: null` |

**Verdict: PASS**

## Criterion 3: Time Matters More Than Score

**Question:** Does the schema favor continuity over snapshot values?

| Check                         | Finding        |
| ----------------------------- | -------------- | ----- |
| `meta.firstSeenAt` exists     | ✅ `string     | null` |
| `meta.lastUpdatedAt` exists   | ✅ Both facets |
| `meta.activeSinceDays` exists | ✅ Ethos facet |
| No percentiles                | ✅ Not present |
| No rankings                   | ✅ Not present |

The schema supports: **"Who is this person over time?"**

**Verdict: PASS**

## Criterion 4: Resistant to Gamification

**Question:** Can this SDK be trivially gamed for artificial reputation?

| Check                       | Finding                           |
| --------------------------- | --------------------------------- |
| `influenceFactor` forbidden | ✅ Listed in FORBIDDEN            |
| `XP` fields forbidden       | ✅ Listed in FORBIDDEN            |
| `percentile` forbidden      | ✅ Listed in FORBIDDEN            |
| `ranking` forbidden         | ✅ Listed in FORBIDDEN            |
| Signals are evidence-based  | ✅ `verifiedBuilder = points > 0` |

**Why this schema resists gaming:**

1. **No volume-based rewards** — Scores are opaque protocol calculations
2. **Evidence-based signals** — Boolean facts, not gradients
3. **No rankings** — `rank_position` intentionally not mapped
4. **Relationship signals** — Hard to fake at scale

**Verdict: PASS**

## Final Evaluation

| Criterion                    | Verdict  |
| ---------------------------- | -------- |
| Output feels neutral         | **PASS** |
| Absence is explicit          | **PASS** |
| Time matters more than score | **PASS** |
| Resistant to gamification    | **PASS** |

## Phase 1 Completion

> **Phase 1 — Feasibility: COMPLETE**

The SDK can produce the Phase 0 unified response **reliably**, **truthfully**, and **repeatedly**.

The implementation:

- Obeys the Phase 0 locked schema
- Handles partial responses correctly
- Declares absence explicitly
- Contains no ranking, judging, or inference
- Is resistant to gamification by design

## Exit Checklist

- [x] Criterion 1: Output feels neutral — evaluated with evidence
- [x] Criterion 2: Absence is explicit — evaluated with evidence
- [x] Criterion 3: Time matters more than score — evaluated with evidence
- [x] Criterion 4: Resistant to gamification — evaluated with evidence
- [x] Phase 1 completion formally declared
