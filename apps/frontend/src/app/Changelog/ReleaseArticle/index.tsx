import { Link } from "react-router";

import { type Release, SBTIME_AUTHOR, releaseLink } from "@/lib/releases";

import {
  Author,
  CopyLinkButton,
  Divider,
  ReleaseBody,
  ReleaseDate,
  ReleaseMedia,
} from "../ReleaseParts";
import styles from "./ReleaseArticle.module.scss";

// One entry on /changelog: the date and Copy link over a divider, then the
// title and author (sticky on wide screens) beside the image and text. The
// title and image open the release's own page.

export default function ReleaseArticle({ release }: { release: Release }) {
  const author = release.author ?? SBTIME_AUTHOR;

  return (
    <article id={release.slug} className={styles.article}>
      <header className={styles.header}>
        <Divider />
        <div className={styles.headerRow}>
          <ReleaseDate date={release.date} />
          <CopyLinkButton slug={release.slug} className={styles.copy} />
        </div>
      </header>

      <div className={styles.grid}>
        <div className={styles.side}>
          <h2 className={styles.title}>
            <Link to={releaseLink(release.slug)}>{release.title}</Link>
          </h2>
          <Author author={author} className={styles.authorWide} />
        </div>

        <div className={styles.content}>
          <ReleaseMedia release={release} linked />
          <ReleaseBody release={release} />
          <Author author={author} className={styles.authorNarrow} />
        </div>
      </div>
    </article>
  );
}
