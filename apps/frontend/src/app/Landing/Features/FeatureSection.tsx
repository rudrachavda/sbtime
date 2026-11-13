import type { ReactNode } from "react";

import styles from "./FeatureSection.module.scss";

// One home page feature section (from the design reference): heading,
// description and a "TLDR" list on the left; an animated window on the right
// that runs off the page's right edge and fades out. Used once per feature.

interface FeatureSectionProps {
  title: string;
  description: string;
  features: string[];
  /** The window's contents: a decorative, animated mockup of the feature */
  showcase: ReactNode;
}

export default function FeatureSection({
  title,
  description,
  features,
  showcase,
}: FeatureSectionProps) {
  return (
    <section className={styles.root}>
      <div className={styles.container}>
        <div className={styles.copy}>
          <div className={styles.intro}>
            <h2 className={styles.title}>{title}</h2>
            <p className={styles.description}>{description}</p>
          </div>
          <p className={styles.tldr}>TLDR</p>
          <div className={styles.featureBlock}>
            <div className={styles.divider} role="separator" />
            <ul className={styles.features}>
              {features.map((feature) => (
                <li key={feature}>{feature}</li>
              ))}
            </ul>
          </div>
        </div>

        <div className={styles.stage}>
          <div className={styles.bleed}>
            <div className={styles.window} aria-hidden="true">
              <div className={styles.inset}>
                <div className={styles.panel}>{showcase}</div>
              </div>
              <div className={styles.sheen} />
            </div>
            <div className={styles.fadeBottom} />
            <div className={styles.fadeRight} />
          </div>
        </div>
      </div>
    </section>
  );
}
