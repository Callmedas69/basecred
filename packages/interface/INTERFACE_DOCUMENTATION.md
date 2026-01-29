# Interface Technical Documentation

## Overview

The `packages/interface` component serves as the user-facing layer of the BaseCred protocol. It provides the tools necessary for users and developers to interact with the underlying decision engine in a transparent, read-only manner.

**Core Responsibility:** To expose authorized, normalized reputation signals without enforcing subjective judgments.

## Tools

### 1. Wallet Explorer

The Wallet Explorer is the primary graphical user interface for inspecting the reputation status of any EVM-compatible address.

- **Location:** `/src/app/explorer/page.tsx`
- **Route:** `/explorer`

#### Key Features

1.  **Search & Analysis**
    - **Input:** Users provide an EVM wallet address.
    - **Process:** The interface initiates a parallel fetch request for all available context policies (e.g., `default`, `allowlist.general`, `governance.vote`).
    - **Normalization:** Raw data is converted into standardized signals (Trust, spamRisk, etc.).

2.  **Context Switching**
    - The Explorer allows users to toggle between different **Contexts**.
    - A "Context" represents a specific policy or set of rules (e.g., "Is this user a builder?" vs "Is this user allowed to vote?").
    - **Implementation:** The UI dynamically renders tabs for each context returned by the `/api/config/contexts` endpoint.
    - **UI Labels:** The Explorer maps technical context keys to human-readable descriptions (hardcoded in `page.tsx`):
      | Context Key | UI Description |
      | :--- | :--- |
      | `default` | Standard Policy Analysis |
      | `allowlist.general` | General Access Allowlist |
      | `comment` | Comment Permission |
      | `publish` | Publishing Rights |
      | `apply` | Application Submission |
      | `governance.vote` | Governance Voting |

3.  **Decision Visualization**
    - **Outcomes:**
      - `ALLOW` (Green): Meets all policy requirements.
      - `DENY` (Red): Fails one or more critical requirements.
      - `ALLOW_WITH_LIMITS` (Yellow): Meets requirements but with specific restrictions or lower confidence.
    - **Signals:** Displays normalized values for:
      - `Trust` (Tiered: VERY_LOW to VERY_HIGH)
      - `Social Trust`
      - `Builder Score`
      - `Spam Risk` (High/Low)

4.  **Audit Trail (Transparency)**
    - **Sources & Reasons:** Every decision includes a literal array of reasons explaining _why_ a specific outcome was reached (e.g., "Address has high spam volume", "Verified Ethos account").
    - **JSON View:** A "Raw JSON" tab allows developers to inspect the exact API response payload, ensuring full transparency of the data structure.

### 2. Decision API

The Decision API is the programmatic interface that developers use to integrate BaseCred signals into their own applications.

- **Location:** `/src/app/api/decision/[context]/route.ts`
- **Method:** `GET`

#### Endpoint Specification

```http
GET /api/decision/{context}?subject={address}
```

#### Parameters

| Parameter | Type     | Required | Description                                                                                           |
| :-------- | :------- | :------- | :---------------------------------------------------------------------------------------------------- |
| `context` | `string` | **Yes**  | The policy context to evaluate. Defaults to `default`. Common values: `default`, `allowlist.general`. |
| `subject` | `string` | **Yes**  | The EVM wallet address to analyze.                                                                    |

#### Request Flow & Architecture

1.  **Validation:**
    - The API first validates the request structure using `validateDecideRequest` from the `basecred-decision-engine` package.
    - Ensures the `subject` is present and valid.

2.  **Engine Delegation:**
    - The request is passed to the `getDecision(subject, context)` use-case.
    - The interface layer **does not** contain business logic; it acts purely as a gateway to the Decision Engine.

3.  **Response:**
    - Returns a JSON object complying with the strict BaseCred schema.
    * **Caching:** Responses include standard caching headers (`s-maxage=60`, `max-age=30`, `stale-while-revalidate=300`) to ensure high performance and reduce load on underlying data providers.
    - **CORS:** Open CORS policy (`Access-Control-Allow-Origin: *`) to allow client-side usage from any domain.

#### Example Response

```json
{
  "context": "default",
  "decision": "ALLOW",
  "confidence": "VERY_HIGH",
  "signals": {
    "trust": "HIGH",
    "spamRisk": "LOW",
    "socialTrust": "MEDIUM",
    "builder": "HIGH"
  },
  "explain": [
    "User has a verified Farcaster ID",
    "Wallet age > 1 year",
    "No negative flags found"
  ],
  "profile": {
    "address": "0x123..."
  }
}
```

## Integration Guide

For external developers integrating with this interface:

1.  **Do not rely on screen scraping.** Use the API endpoint directly.
2.  **Handle all decision states.** Do not assume only `ALLOW` or `DENY`; `WARN` states may be introduced.
3.  **Respect Caching.** The interface implements caching; real-time updates may have a slight propagation delay (up to 60 seconds).
