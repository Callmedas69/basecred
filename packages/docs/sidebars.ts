import type {SidebarsConfig} from '@docusaurus/plugin-content-docs';

const sidebars: SidebarsConfig = {
  tutorialSidebar: [
    'intro',
    'context-vs-decision',
    'integration',
    'sdk',
    'schema',
    {
      type: 'category',
      label: 'ZK Integration',
      items: [
        'zk-agent',
        'zk-contracts',
        'encoding',
      ],
    },
    'openclaw',
    'availability',
    'time-and-recency',
    'anti-patterns',
    'faq',
  ],
};

export default sidebars;
