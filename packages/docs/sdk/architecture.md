---
sidebar_position: 3
---

# Architecture Overview

## Layer Architecture

BaseCred follows a strict unidirectional architecture with clear separation of concerns.

| Layer        | Responsibility                                       |
| ------------ | ---------------------------------------------------- |
| Public API   | `getUnifiedProfile(address, config)`                 |
| Use Case     | Orchestrates repositories and applies business logic |
| Repository   | Fetches and maps raw API data                        |
| External API | Ethos Network API, Talent Protocol API               |

## Data Flow

1. Consumer calls `getUnifiedProfile(address, config)`
2. Parallel calls to Ethos and Talent repositories
3. Raw data fetched and mapped (no business logic)
4. Semantic levels and signals applied
5. Facets assembled without aggregation
6. Response returned with identity, availability, and facets
