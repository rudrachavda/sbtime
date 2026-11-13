import { useEffect } from "react";

import { useLocation } from "react-router";

import { RELEASES } from "@/lib/releases";

import styles from "./Changelog.module.scss";
import ReleaseArticle from "./ReleaseArticle";

// Every release in lib/releases.ts, newest first. Links like
// /changelog#seat-alerts open at that entry.

export default function Changelog() {
  const { hash } = useLocation();

  useEffect(() => {
    if (!hash) return;
    document
      .getElementById(decodeURIComponent(hash.slice(1)))
      ?.scrollIntoView({ block: "start" });
  }, [hash]);

  return (
    <main className={styles.root}>
      <h1 className={styles.title}>Changelog</h1>
      <div className={styles.list}>
        {RELEASES.map((release) => (
          <ReleaseArticle key={release.slug} release={release} />
        ))}
      </div>
    </main>
  );
}
