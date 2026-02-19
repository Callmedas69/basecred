import type {SidebarsConfig} from '@docusaurus/plugin-content-docs';

const sidebars: SidebarsConfig = {
  tutorialSidebar: [
    'intro',
    'context-vs-decision',
    'contexts',
    'integration',
    'sdk',
    'schema',
    {
      type: 'category',
      label: 'AI Agents',
      items: [
        'openclaw',
        'agent-api',
        'agent-sdk',
      ],
    },
    {
      type: 'category',
      label: 'ZK Integration',
      items: [
        'zk-agent',
        'zk-contracts',
        'encoding',
      ],
    },
    'availability',
    'time-and-recency',
    'anti-patterns',
    'faq',
  ],
};

export default sidebars;
