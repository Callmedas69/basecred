---
sidebar_position: 2
sidebar_label: Basic Usage
---

# Basic Usage

```ts
import { getUnifiedProfile } from "@basednouns/ethos-tp-sdk";

const profile = await getUnifiedProfile(
  "0x168D8b4f50BB3aA67D05a6937B643004257118ED",
  {
    ethos: {
      baseUrl: "https://api.ethos.network",
      clientId: "your-app@1.0.0",
    },
    talent: {
      baseUrl: "https://api.talentprotocol.com",
      apiKey: "your-api-key",
    },
  },
);
```
