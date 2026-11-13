import { useState } from "react";

import { ArrowRight, Xmark } from "iconoir-react";
import { Link } from "react-router-dom";

import styles from "./BetaBanner.module.scss";

// TODO(SBTime): update once Letters & Science and Creative Studies
// requirements are in GradTrak.
export default function BetaBanner() {
  const [isVisible, setIsVisible] = useState(true);

  if (!isVisible) {
    return null;
  }

  return (
    <div className={styles.root}>
      <p className={styles.text}>
        GradPath only checks requirements for College of Engineering majors for
        now. Letters &amp; Science and Creative Studies are coming later.
      </p>
      <div className={styles.actions}>
        <Link className={styles.link} to="/gradtrak">
          <div className={styles.text}>Open GradPath</div>
          <ArrowRight height={12} width={12} />
        </Link>
        <button
          type="button"
          className={styles.closeButton}
          onClick={() => setIsVisible(false)}
          aria-label="Close banner"
        >
          <Xmark />
        </button>
      </div>
    </div>
  );
}
