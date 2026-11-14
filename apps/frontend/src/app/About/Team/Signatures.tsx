import { CSSProperties } from "react";

import { Tooltip } from "@repo/theme";

import styles from "./Signatures.module.scss";
import { SIGNATURES, TeamSignature } from "./data";

// The team's signatures: three to a row (two on phones), each showing its
// name on hover. A signature is an SVG drawn as a mask in the text color, so
// it darkens on hover like text. Without one, the name stands in, in italics.

const DEFAULT_HEIGHT = 56;

function Mark({ person }: { person: TeamSignature }) {
  if (!person.signature) {
    return <span className={styles.placeholder}>{person.name}</span>;
  }
  const { src, width, height } = person.signature;
  return (
    <span
      aria-hidden="true"
      className={styles.mark}
      style={
        {
          "--signature": `url("${src}")`,
          aspectRatio: `${width} / ${height}`,
        } as CSSProperties
      }
    />
  );
}

export default function Signatures() {
  return (
    <ul className={styles.list}>
      {SIGNATURES.map((person, index) => {
        const style = {
          "--height": `${person.height ?? DEFAULT_HEIGHT}px`,
        } as CSSProperties;
        const trigger = person.link ? (
          <a
            href={person.link}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={person.name}
            className={styles.signature}
          >
            <Mark person={person} />
          </a>
        ) : (
          <span
            tabIndex={0}
            aria-label={person.name}
            className={styles.signature}
          >
            <Mark person={person} />
          </span>
        );

        return (
          <li key={index} className={styles.item} style={style}>
            <Tooltip trigger={trigger} title={person.name} side="top" />
          </li>
        );
      })}
    </ul>
  );
}
