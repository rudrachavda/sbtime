import { useEffect, useRef, useState } from "react";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Check, Copy } from "iconoir-react";
import { Link } from "react-router";

import {
  type Release,
  type ReleaseAuthor,
  formatReleaseDate,
  releaseLink,
} from "@/lib/releases";

import styles from "./ReleaseParts.module.scss";

// Pieces shared by /changelog (ReleaseArticle) and a release's own page
// (ReleasePage), so both read the same way.

const EASE = [0.25, 0.1, 0.25, 1] as const;

const initials = (name: string) =>
  name
    .split(/\s+/)
    .map((word) => word[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

/** The 1.2px rule above the date and the author */
export function Divider() {
  return <div className={styles.divider} role="separator" />;
}

export function ReleaseDate({ date }: { date: string }) {
  return (
    <time className={styles.date} dateTime={date}>
      {formatReleaseDate(date)}
    </time>
  );
}

export function Author({
  author,
  className = "",
}: {
  author: ReleaseAuthor;
  className?: string;
}) {
  return (
    <div className={`${styles.author} ${className}`}>
      {author.avatar ? (
        <img className={styles.avatar} src={author.avatar} alt="" />
      ) : (
        <span className={styles.avatar} aria-hidden>
          {initials(author.name)}
        </span>
      )}
      <div className={styles.authorText}>
        <span className={styles.authorName}>{author.name}</span>
        <span className={styles.authorRole}>{author.role}</span>
      </div>
    </div>
  );
}

/** Copies the release's page URL */
export function CopyLinkButton({
  slug,
  className = "",
}: {
  slug: string;
  className?: string;
}) {
  const [copied, setCopied] = useState(false);
  const timer = useRef<number>();
  const reduceMotion = useReducedMotion();

  useEffect(() => () => window.clearTimeout(timer.current), []);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(
        `${window.location.origin}${releaseLink(slug)}`
      );
      setCopied(true);
      window.clearTimeout(timer.current);
      timer.current = window.setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard blocked (insecure origin or denied); nothing to show
    }
  };

  return (
    <button
      type="button"
      className={`${styles.copy} ${className}`}
      onClick={copy}
    >
      {/* Only the icon changes: copy → check, crossfading in place */}
      <span className={styles.copyIcon}>
        <AnimatePresence initial={false}>
          <motion.span
            key={copied ? "check" : "copy"}
            className={styles.copyIconLayer}
            initial={{ opacity: 0, scale: 0.6, filter: "blur(2px)" }}
            animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
            exit={{ opacity: 0, scale: 0.6, filter: "blur(2px)" }}
            transition={{ duration: reduceMotion ? 0 : 0.2, ease: EASE }}
          >
            {copied ? <Check aria-hidden /> : <Copy aria-hidden />}
          </motion.span>
        </AnimatePresence>
      </span>
      Copy link
      <span className={styles.srOnly} aria-live="polite">
        {copied ? "Link copied" : ""}
      </span>
    </button>
  );
}

/** The release's image (2400×1260), or a placeholder with its title */
export function ReleaseMedia({
  release,
  linked = false,
}: {
  release: Release;
  /** Make the image a link to the release's page */
  linked?: boolean;
}) {
  const content = release.image ? (
    <img src={release.image.src} alt={release.image.alt} />
  ) : (
    <span className={styles.placeholder} aria-hidden>
      {release.title}
    </span>
  );

  return linked ? (
    <Link to={releaseLink(release.slug)} className={styles.media} tabIndex={-1}>
      {content}
    </Link>
  ) : (
    <div className={styles.media}>{content}</div>
  );
}

export function ReleaseBody({ release }: { release: Release }) {
  return (
    <div className={styles.prose}>
      {release.body.map((paragraph) => (
        <p key={paragraph}>{paragraph}</p>
      ))}
    </div>
  );
}
