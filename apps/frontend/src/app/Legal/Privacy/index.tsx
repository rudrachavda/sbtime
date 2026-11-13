import type { ReactNode } from "react";

import { Container } from "@repo/theme";

import { CONTACT_EMAIL } from "@/lib/contact";

import styles from "./Privacy.module.scss";

const SITE = "https://ucsbtime.com";

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className={styles.section}>
      <h2 className={styles.heading}>{title}</h2>
      {children}
    </section>
  );
}

function List({ items }: { items: ReactNode[] }) {
  return (
    <ul className={styles.list}>
      {items.map((item, index) => (
        <li key={index}>
          <p className={styles.listItemContent}>{item}</p>
        </li>
      ))}
    </ul>
  );
}

const Email = () => (
  <a href={`mailto:${CONTACT_EMAIL}`} className={styles.link}>
    {CONTACT_EMAIL}
  </a>
);

export default function Privacy() {
  return (
    <div className={styles.root}>
      <Container className={styles.container}>
        <h1 className={styles.title}>Privacy Policy</h1>
        <p className={styles.lastUpdated}>Last updated: November 12, 2026</p>

        <p className={styles.content}>
          SBTime (
          <a href={SITE} className={styles.link}>
            ucsbtime.com
          </a>
          ) helps UC Santa Barbara students browse classes, build schedules and
          plan their degrees. This policy explains what information SBTime
          collects, why, and what you can do about it. SBTime is an independent
          student project and is not affiliated with or endorsed by UC Santa
          Barbara.
        </p>
        <p className={styles.content}>
          In short: SBTime keeps what it needs to run the features you use. It
          doesn&apos;t show ads, doesn&apos;t sell or rent your information, and
          doesn&apos;t use third-party analytics or tracking.
        </p>

        <Section title="What SBTime collects">
          <h3 className={styles.subHeading}>When you sign in</h3>
          <p className={styles.content}>
            You sign in with Google. SBTime receives your name, email address
            and Google account ID. It never sees your Google password.
          </p>

          <h3 className={styles.subHeading}>What you save</h3>
          <List
            items={[
              "Bookmarked classes and courses, and the folders you put them in.",
              "Schedules you build in the Scheduler.",
              "GradPath plans: your majors and minors, planned courses, labels and requirement check-offs.",
              "Class ratings you submit.",
              "Classes you watch for seat alerts, and whether alerts are on.",
            ]}
          />

          <h3 className={styles.subHeading}>How the site is used</h3>
          <p className={styles.content}>
            SBTime records how the site is used, whether or not you&apos;re
            signed in: pages and classes viewed, searches, and clicks on things
            like banners. Each record includes the time, a random session ID,
            your browser type, the page that linked you to SBTime, and a hashed
            (scrambled) version of your IP address rather than the address
            itself. If you&apos;re signed in, it also includes your account ID.
          </p>
          <p className={styles.content}>
            The servers also keep standard request logs (the page requested, the
            time and your browser type) for fixing problems.
          </p>

          <h3 className={styles.subHeading}>Cookies and browser storage</h3>
          <p className={styles.content}>
            SBTime sets one cookie, which keeps you signed in. It lasts 12 hours
            when you&apos;re signed out and up to a year when you&apos;re signed
            in. Display preferences, such as light or dark mode, are saved in
            your browser only and are never sent to SBTime. There are no
            advertising or third-party tracking cookies.
          </p>
        </Section>

        <Section title="How SBTime uses it">
          <List
            items={[
              "To run the features you use: saving your bookmarks, schedules and plans, and showing them when you return.",
              "To send the emails you ask for: a confirmation when you watch or stop watching a class, and an alert when a seat opens up.",
              "To keep the site working: finding and fixing problems, preventing abuse, and seeing which features are used so they can be improved.",
              "To show class ratings. Ratings are only ever shown as anonymous totals; your name is never shown next to a rating.",
            ]}
          />
        </Section>

        <Section title="Who SBTime shares it with">
          <p className={styles.content}>
            SBTime never sells or rents your information. It is shared only with
            the services SBTime runs on, and only as much as they need:
          </p>
          <List
            items={[
              "Google, to sign you in.",
              "Gmail (Google), to send the emails you ask for.",
              "SBTime's hosting and database providers, which store the data and run the site.",
            ]}
          />
          <p className={styles.content}>
            SBTime may also share information if the law requires it, or to
            protect the site and its users from abuse.
          </p>
          <p className={styles.content}>
            SBTime doesn&apos;t have access to your UCSB records. Course data
            comes from UCSB&apos;s public sources, and your GradPath plans
            contain only what you enter.
          </p>
        </Section>

        <Section title="How long it's kept">
          <List
            items={[
              "Your account and everything you've saved: until you delete them or delete your account.",
              "Usage records: deleted automatically after one year.",
              "Server request logs: a short time, as set by the hosting provider.",
            ]}
          />
        </Section>

        <Section title="Your choices">
          <List
            items={[
              "You can remove bookmarks, schedules, plans, ratings and watched classes at any time.",
              <>
                You can delete your account under{" "}
                <strong>Profile → Account → Delete Account</strong>. This
                deletes your account, bookmarks, schedules, GradPath plans,
                ratings and watched classes. Usage records are kept until they
                expire, but are no longer linked to you.
              </>,
              <>
                You can ask for a copy of your information, or ask for it to be
                corrected or deleted, by emailing <Email />.
              </>,
              "You can use SBTime without signing in. Browsing classes, grades and enrollment doesn't need an account.",
            ]}
          />
        </Section>

        <Section title="Security">
          <p className={styles.content}>
            SBTime uses encrypted connections (HTTPS) and limits who can access
            its systems. No website can promise perfect security, so please let
            SBTime know at <Email /> if you find a problem.
          </p>
        </Section>

        <Section title="Children">
          <p className={styles.content}>
            SBTime is meant for university students and isn&apos;t intended for
            anyone under 13. If you believe a child under 13 has created an
            account, email <Email /> and it will be deleted.
          </p>
        </Section>

        <Section title="Changes to this policy">
          <p className={styles.content}>
            If this policy changes, the new version will be posted here with a
            new date. Significant changes will be announced on the site.
          </p>
        </Section>

        <Section title="Contact">
          <p className={styles.content}>
            Questions or requests about your privacy: <Email />.
          </p>
        </Section>
      </Container>
    </div>
  );
}
