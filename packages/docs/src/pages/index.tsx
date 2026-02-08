import type { ReactNode } from "react";
import clsx from "clsx";
import Link from "@docusaurus/Link";
import useDocusaurusContext from "@docusaurus/useDocusaurusContext";
import Layout from "@theme/Layout";
import Heading from "@theme/Heading";
import styles from "./index.module.css";

const sections = [
  {
    title: "Foundation",
    description: "Core principles, schema definitions, and the philosophical grounding behind BaseCred.",
    href: "/foundation/overview",
  },
  {
    title: "Decision Engine",
    description: "Rule catalog, signal normalization, tier calculations, and engine internals.",
    href: "/decision-engine/intro",
  },
  {
    title: "Integration",
    description: "SDK reference, response schema, ZK utilities, and integration guidance.",
    href: "/integration/intro",
  },
];

function HomepageHeader() {
  const { siteConfig } = useDocusaurusContext();
  return (
    <header className={clsx("hero", styles.heroBanner)}>
      <div className="container">
        <Heading as="h1" className={styles.hero__title}>
          {siteConfig.title}
        </Heading>
        <p className={styles.hero__subtitle}>{siteConfig.tagline}</p>
      </div>
    </header>
  );
}

function SectionCards() {
  return (
    <div className={styles.cards}>
      {sections.map((section) => (
        <Link key={section.title} className={styles.card} to={section.href}>
          <h3>{section.title}</h3>
          <p>{section.description}</p>
        </Link>
      ))}
    </div>
  );
}

export default function Home(): ReactNode {
  const { siteConfig } = useDocusaurusContext();
  return (
    <Layout title={siteConfig.title} description="BaseCred Documentation">
      <main
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          minHeight: "60vh",
          textAlign: "center",
        }}
      >
        <HomepageHeader />
        <SectionCards />
      </main>
    </Layout>
  );
}
