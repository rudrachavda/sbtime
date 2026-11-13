import { useEffect, useRef, useState } from "react";

import { Check, Copy } from "iconoir-react";

import {
  type Release,
  type ReleaseAuthor,
  SBTIME_AUTHOR,
  formatReleaseDate,
  releaseLink,
} from "@/lib/releases";

import styles from "./ReleaseArticle.module.scss";

// One changelog entry: the date and Copy link over a divider, then the title
// and author (sticky on wide screens) beside the image and text. Every entry
// on /changelog is this component, filled from lib/releases.ts.

const initials = (name: string) =>
  name
    .split(/\s+/)
    .map((word) => word[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

function Author({
  author,
  className,
}: {
  author: ReleaseAuthor;
  className: string;
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

function CopyLinkButton({ slug }: { slug: string }) {
  const [copied, setCopied] = useState(false);
  const timer = useRef<number>();

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
    <button type="button" className={styles.copy} onClick={copy}>
      {copied ? <Check aria-hidden /> : <Copy aria-hidden />}
      <span aria-live="polite">{copied ? "Copied" : "Copy link"}</span>
    </button>
  );
}

export default function ReleaseArticle({ release }: { release: Release }) {
  const author = release.author ?? SBTIME_AUTHOR;
  const href = releaseLink(release.slug);

  return (
    <article id={release.slug} className={styles.article}>
      <header className={styles.header}>
        <div className={styles.headerRow}>
          <time className={styles.date} dateTime={release.date}>
            {formatReleaseDate(release.date)}
          </time>
          <CopyLinkButton slug={release.slug} />
        </div>
      </header>

      <div className={styles.grid}>
        <div className={styles.side}>
          <h2 className={styles.title}>
            <a href={href}>{release.title}</a>
          </h2>
          <Author author={author} className={styles.authorWide} />
        </div>

        <div className={styles.content}>
          <a href={href} className={styles.media} tabIndex={-1}>
            {release.image ? (
              <img src={release.image.src} alt={release.image.alt} />
            ) : (
              <span className={styles.placeholder} aria-hidden>
                {release.title}
              </span>
            )}
          </a>
          <div className={styles.prose}>
            {release.body.map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}
          </div>
          <Author author={author} className={styles.authorNarrow} />
        </div>
      </div>
    </article>
  );
}
