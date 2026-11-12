import { Text } from "@repo/theme";

import { CONTACT_EMAIL, FEEDBACK_FORM_URL } from "@/lib/contact";

// eslint-disable-next-line css-modules/no-unused-class
import profileStyles from "../Profile.module.scss";
import styles from "./Support.module.scss";

export default function Support() {
  return (
    <div className={profileStyles.contentInner}>
      <h1 className={profileStyles.pageTitle}>Support</h1>
      <div className={profileStyles.pageContent}>
        <Text size="3" style={{ lineHeight: 1.6 }}>
          Thank you for beta testing our website! To leave us feedback,{" "}
          <a
            href={FEEDBACK_FORM_URL}
            target="_blank"
            rel="noopener noreferrer"
            className={styles.link}
          >
            fill out this form
          </a>{" "}
          or email us at{" "}
          <a href={`mailto:${CONTACT_EMAIL}`} className={styles.link}>
            {CONTACT_EMAIL}
          </a>
          .
        </Text>
      </div>
    </div>
  );
}
