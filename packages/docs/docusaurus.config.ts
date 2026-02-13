import { themes as prismThemes } from "prism-react-renderer";
import type { Config } from "@docusaurus/types";
import type * as Preset from "@docusaurus/preset-classic";

// This runs in Node.js - Don't use client-side code here (browser APIs, JSX...)

const config: Config = {
  title: "BaseCred",
  tagline: "Foundation · Decision Engine · Integration",
  favicon: "img/favicon.ico",

  // Future flags, see https://docusaurus.io/docs/api/docusaurus-config#future
  future: {
    v4: true, // Improve compatibility with the upcoming Docusaurus v4
  },

  // Set the production url of your site here
  url: "https://www.zkbasecred.xyz",
  // Set the /<baseUrl>/ pathname under which your site is served
  // For GitHub pages deployment, it is often '/<projectName>/'
  baseUrl: "/",

  // GitHub pages deployment config.
  // If you aren't using GitHub pages, you don't need these.
  organizationName: "Basecred", // Usually your GitHub org/user name.
  projectName: "basecred", // Usually your repo name.

  onBrokenLinks: "warn", // Warn for now to avoid build failures during migration

  // Even if you don't use internationalization, you can use this field to set
  // useful metadata like html lang. For example, if your site is Chinese, you
  // may want to replace "en" with "zh-Hans".
  i18n: {
    defaultLocale: "en",
    locales: ["en"],
  },

  presets: [
    [
      "classic",
      {
        docs: {
          path: "integration",
          sidebarPath: "./sidebars.ts",
          routeBasePath: "integration",
        },
        blog: false, // Disable blog for now
        theme: {
          customCss: "./src/css/custom.css",
        },
      } satisfies Preset.Options,
    ],
  ],

  themeConfig: {
    // Replace with your project's social card
    image: "img/logo-black.png",
    colorMode: {
      defaultMode: "light",
      disableSwitch: true,
      respectPrefersColorScheme: false,
    },
    navbar: {
      title: "zkBaseCred",
      logo: {
        alt: "BaseCred Logo",
        src: "img/logo-black.png",
      },
      items: [
        {
          to: "/foundation/overview",
          label: "Foundation",
          position: "left",
        },
        {
          to: "/decision-engine/intro",
          label: "Decision Engine",
          position: "left",
        },
        {
          type: "docSidebar",
          sidebarId: "tutorialSidebar",
          position: "left",
          label: "Integration",
        },
        {
          type: "docsVersionDropdown",
          position: "right",
          dropdownActiveClassDisabled: true,
        },
        {
          type: "docsVersionDropdown",
          position: "right",
          docsPluginId: "foundation",
          dropdownActiveClassDisabled: true,
        },
        {
          type: "docsVersionDropdown",
          position: "right",
          docsPluginId: "decision-engine",
          dropdownActiveClassDisabled: true,
        },
        {
          href: "https://github.com/GeoartStudio/basecred",
          label: "GitHub",
          position: "right",
        },
      ],
    },
    footer: {
      style: "light",
      links: [
        {
          title: "Docs",
          items: [
            {
              label: "Integration",
              to: "/integration/intro",
            },
            {
              label: "Agent API",
              to: "/integration/agent-api",
            },
            {
              label: "Foundation",
              to: "/foundation/overview",
            },
          ],

        },
      ],
      copyright: `Copyright © ${new Date().getFullYear()} GeoartStudio. Built with Docusaurus.`,
    },
    prism: {
      theme: prismThemes.github,
      darkTheme: prismThemes.dracula,
    },
  } satisfies Preset.ThemeConfig,

  plugins: [
    [
      '@docusaurus/plugin-content-docs',
      {
        id: 'foundation',
        path: 'foundation',
        routeBasePath: 'foundation',
        sidebarPath: './sidebarsFoundation.ts',
      },
    ],
    [
      '@docusaurus/plugin-content-docs',
      {
        id: 'decision-engine',
        path: 'decision_engine',
        routeBasePath: 'decision-engine',
        sidebarPath: './sidebarsDecisionEngine.ts',
      },
    ],
  ],
};

export default config;