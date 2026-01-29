---
sidebar_position: 5
---

# Availability Semantics

> Understanding signal presence and absence.

Every signal in BaseCred has an `availability` state. Do not assume missing data means low score.

### States

- `AVAILABLE`: Data is present and fresh.
- `UNAVAILABLE`: Data provider returned no record (user likely does not exist on platform).
- `ERROR`: Provider unreachable. Decisions may fallback to "Partial" logic.
