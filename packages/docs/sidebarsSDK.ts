import type { SidebarsConfig } from "@docusaurus/plugin-content-docs";

const sidebarsSDK: SidebarsConfig = {
  sdkSidebar: [
    "intro",
    "principles",
    "architecture",
    "phases",
    {
      type: "category",
      label: "API Reference",
      items: [
        "api/installation",
        "api/usage",
        "api/configuration",
        "api/response",
      ],
    },
    {
      type: "category",
      label: "Facets",
      items: [
        "facets/ethos",
        "facets/talent",
        "facets/farcaster",
      ],
    },
    {
      type: "category",
      label: "Phase 1 Subphases",
      items: [
        "Repo & Type Lock",
        "Ethos Repository",
        "Talent Repository",
        "Unified Assembly",
        "Failure Hardening",
        "Validation & Phase Gate",
      ],
    },
    "policies",
    "best-practices",
  ],
};

export default sidebarsSDK;
