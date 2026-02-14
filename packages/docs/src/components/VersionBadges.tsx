import Link from "@docusaurus/Link";
import styles from "./VersionBadges.module.css";

interface VersionBadgesProps {
  category: string;
  version: string;
  updated: string;
  guidelinesLabel?: string;
  guidelinesUrl?: string;
}

export default function VersionBadges({
  category,
  version,
  updated,
  guidelinesLabel,
  guidelinesUrl,
}: VersionBadgesProps) {
  return (
    <div className={styles.wrapper}>
      <span className={`${styles.badge} ${styles.category}`}>{category}</span>
      <span className={`${styles.badge} ${styles.version}`}>
        Version {version}
      </span>
      <span className={`${styles.badge} ${styles.updated}`}>
        Updated {updated}
      </span>
      {guidelinesLabel && guidelinesUrl && (
        <Link
          to={guidelinesUrl}
          className={`${styles.badge} ${styles.link}`}
        >
          {guidelinesLabel}
        </Link>
      )}
    </div>
  );
}
