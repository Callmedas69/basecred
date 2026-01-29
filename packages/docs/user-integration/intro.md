---
sidebar_position: 1
slug: /intro
---

# BaseCred Users Integration Guide

This guide details how to integrate with the BaseCred Decision Engine via its REST API. This method allows you to fetch user data on your end (client-side or server-side) using the SDK and then request a decision from the hosted Decision Engine.

## Prerequisites

Ensure you have `basecred-sdk` installed in your project:

```bash
npm install basecred-sdk
```

## 1. Fetching User Data (Client Side)

Use the `basecred-sdk` to fetch a "Unified Profile" for a given user. You will need to configure your own API keys for the SDK.

```typescript
import { getUnifiedProfile, SDKConfig } from "basecred-sdk";

const config: SDKConfig = {
  ethos: {
    baseUrl: "https://api.ethos.network",
    clientId: "YOUR_ETHOS_CLIENT_ID",
  },
  talent: {
    baseUrl: "https://api.talentprotocol.com",
    apiKey: "YOUR_TALENT_API_KEY",
  },
  farcaster: {
    enabled: true,
    neynarApiKey: "YOUR_NEYNAR_API_KEY",
  },
};

// Fetch the profile
const profile = await getUnifiedProfile("0xUserAddress...", config);
```

## 2. Requesting a Decision

Once you have the profile data, send it to the BaseCred Decision Engine API via a POST request.

**Endpoint:** `POST /api/decision/{context}`

**Example Request:**

```typescript
const response = await fetch(
  "https://basecred-demo.geoart.studio/api/decision/base_mainnet",
  {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      profile: profile, // The raw profile object from the SDK
    }),
  },
);

const decisionResult = await response.json();
```

## 3. Handling the Response

The API will return a decision object containing the result, confidence level, and explanation.

**Response Structure:**

```json
{
  "context": "base_mainnet",
  "decision": "ALLOW", // "ALLOW" | "DENY" | "ALLOW_WITH_LIMITS"
  "confidence": "HIGH", // "VERY_HIGH" | "HIGH" | "MEDIUM" | "LOW" | "VERY_LOW"
  "explain": [
    "User has high Talent score",
    "Ethos score is sufficient"
  ],
  "signals": { ... },
  "profile": { ... }
}
```

## Summary

1.  **Fetch Profile**: different protocols (Ethos, Farcaster, Talent) -> `basecred-sdk` -> `UnifiedProfile`
2.  **Get Decision**: `UnifiedProfile` -> `POST /api/decision` -> Decision Result
