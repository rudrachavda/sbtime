import { ArrowUpRight } from "iconoir-react";

import { IS_UAT, LIVE_SITE_URL } from "@/lib/environment";

import styles from "./UatBanner.module.scss";

// Always shown on UAT and can't be closed, so UAT is never mistaken for the
// live site.
export default function UatBanner({ compact = false }: { compact?: boolean }) {
  if (!IS_UAT) return null;

  // Pages without the shared header get a small corner badge instead.
  if (compact) {
    return (
      <a
        className={styles.badge}
        href={LIVE_SITE_URL}
        title="Test environment. Changes here don't affect ucsbtime.com."
      >
        UAT
      </a>
    );
  }

  return (
    <div className={styles.root} role="note">
      <span className={styles.tag}>UAT</span>
      <p className={styles.text}>
        Test environment. Data here is a copy, and changes don't affect the live
        site.
      </p>
      <a className={styles.link} href={LIVE_SITE_URL}>
        Open ucsbtime.com
        <ArrowUpRight height={12} width={12} />
      </a>
    </div>
  );
}
