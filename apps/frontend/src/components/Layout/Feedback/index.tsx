import { MessageText } from "iconoir-react";

import { Button } from "@repo/theme";

import { FEEDBACK_FORM_URL } from "@/lib/contact";

import styles from "./Feedback.module.scss";

export default function Feedback() {
  return (
    <div className={styles.root}>
      <Button
        as="a"
        href={FEEDBACK_FORM_URL}
        target="_blank"
        className={styles.button}
      >
        <MessageText />
        Provide feedback
      </Button>
    </div>
  );
}
