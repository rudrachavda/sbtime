import { useCallback, useEffect, useRef, useState } from "react";

import { NavArrowLeft, NavArrowRight } from "iconoir-react";
import { Link } from "react-router";

import { RELEASES, type Release, releaseLink } from "@/lib/releases";

import styles from "./Releases.module.scss";

// "The Latest": the three newest entries from lib/releases.ts. A 3-column
// grid from 768px; below that, a swipe carousel with prev/next buttons.

const LATEST = RELEASES.slice(0, 3);

/** "NOV 12, 2026" */
const shortDate = (date: string) =>
  new Date(`${date}T00:00:00`)
    .toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    })
    .toUpperCase();

function ReleaseCard({ release }: { release: Release }) {
  return (
    <Link to={releaseLink(release.slug)} className={styles.card}>
      <time className={styles.date} dateTime={release.date}>
        {shortDate(release.date)}
      </time>
      <div className={styles.cardText}>
        <span className={styles.cardTitle}>{release.title}</span>
        <p className={styles.cardSummary}>{release.summary}</p>
      </div>
      <NavArrowRight className={styles.cardChevron} aria-hidden />
    </Link>
  );
}

export default function Releases() {
  const listRef = useRef<HTMLUListElement>(null);
  const [atStart, setAtStart] = useState(true);
  const [atEnd, setAtEnd] = useState(false);

  // Which carousel buttons can move (only matters while it scrolls)
  const update = useCallback(() => {
    const list = listRef.current;
    if (!list) return;
    setAtStart(list.scrollLeft <= 1);
    setAtEnd(list.scrollLeft + list.clientWidth >= list.scrollWidth - 1);
  }, []);

  useEffect(() => {
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, [update]);

  const step = (direction: 1 | -1) => {
    const list = listRef.current;
    const item = list?.firstElementChild as HTMLElement | null;
    if (!list || !item) return;
    // One card plus the 16px gap
    list.scrollBy({
      left: direction * (item.offsetWidth + 16),
      behavior: "smooth",
    });
  };

  return (
    <section className={styles.root}>
      <div className={styles.container}>
        <h2 className={styles.heading}>The Latest</h2>

        <ul ref={listRef} className={styles.list} onScroll={update}>
          {LATEST.map((release) => (
            <li key={release.slug} className={styles.item}>
              <ReleaseCard release={release} />
            </li>
          ))}
        </ul>

        <div className={styles.footer}>
          <div className={styles.arrows}>
            <button
              type="button"
              className={styles.arrow}
              onClick={() => step(-1)}
              disabled={atStart}
              aria-label="Previous release"
            >
              <NavArrowLeft aria-hidden />
            </button>
            <button
              type="button"
              className={styles.arrow}
              onClick={() => step(1)}
              disabled={atEnd}
              aria-label="Next release"
            >
              <NavArrowRight aria-hidden />
            </button>
          </div>
          <Link to="/changelog" className={styles.seeAll}>
            See all releases
            <NavArrowRight aria-hidden />
          </Link>
        </div>
      </div>
    </section>
  );
}
