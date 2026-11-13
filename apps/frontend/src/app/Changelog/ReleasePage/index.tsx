import { useEffect } from "react";

import { NavArrowLeft, NavArrowRight } from "iconoir-react";
import { Link, Navigate, useParams } from "react-router";

import { RELEASES, SBTIME_AUTHOR, releaseLink } from "@/lib/releases";

import {
  Author,
  CopyLinkButton,
  Divider,
  ReleaseBody,
  ReleaseDate,
  ReleaseMedia,
} from "../ReleaseParts";
import styles from "./ReleasePage.module.scss";

// A release's own page (/changelog/<slug>): a breadcrumb bar, the centered
// title and image, then the article in a reading-width column with its
// author at the end. Unknown slugs go back to /changelog.

export default function ReleasePage() {
  const { slug } = useParams();
  const release = RELEASES.find((r) => r.slug === slug);

  // The router keeps the scroll position between pages; start at the top
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [slug]);

  if (!release) return <Navigate to="/changelog" replace />;

  const author = release.author ?? SBTIME_AUTHOR;
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: release.title,
    description: release.summary,
    datePublished: release.date,
    inLanguage: "en-US",
    url: `${window.location.origin}${releaseLink(release.slug)}`,
    author: { "@type": "Organization", name: author.name },
    publisher: { "@type": "Organization", name: "SBTime" },
    ...(release.image && {
      image: new URL(release.image.src, window.location.origin).href,
    }),
  };

  return (
    <main className={styles.root}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />

      {/* Breadcrumb and Copy link (tablets and up) */}
      <div className={styles.subBar}>
        <div className={styles.subBarInner}>
          <nav aria-label="Breadcrumb">
            <ol className={styles.crumbs}>
              <li>
                <Link to="/changelog" className={styles.crumbLink}>
                  Changelog
                </Link>
              </li>
              <li className={styles.crumbSeparator} aria-hidden>
                <NavArrowRight />
              </li>
              <li className={styles.crumbCurrent} aria-current="page">
                {release.title}
              </li>
            </ol>
          </nav>
          <CopyLinkButton slug={release.slug} />
        </div>
      </div>

      <div className={styles.hero}>
        <div className={styles.heading}>
          <Link to="/changelog" className={styles.back}>
            <NavArrowLeft aria-hidden />
            Back to Changelog
          </Link>
          <h1 className={styles.title}>{release.title}</h1>
        </div>
        <ReleaseMedia release={release} />
      </div>

      <div className={styles.articleColumn}>
        <article className={styles.article}>
          <header className={styles.header}>
            <Divider />
            <div className={styles.headerRow}>
              <ReleaseDate date={release.date} />
              <CopyLinkButton
                slug={release.slug}
                className={styles.copyPhone}
              />
            </div>
          </header>

          <ReleaseBody release={release} />

          <footer className={styles.footer}>
            <Divider />
            <Author author={author} />
          </footer>
        </article>
      </div>
    </main>
  );
}
