import type { ReactNode } from "react";

import { Link } from "react-router-dom";

import { Container } from "@repo/theme";

import { CONTACT_EMAIL } from "@/lib/contact";

import styles from "./Terms.module.scss";

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

export default function Terms() {
  return (
    <div className={styles.root}>
      <Container className={styles.container}>
        <h1 className={styles.title}>Terms of Service</h1>
        <p className={styles.lastUpdated}>Last updated: November 12, 2026</p>

        <p className={styles.content}>
          These terms cover your use of SBTime (
          <a href="https://ucsbtime.com" className={styles.link}>
            ucsbtime.com
          </a>
          ). By using SBTime, you agree to them. SBTime is a free, independent
          student project and is not affiliated with or endorsed by UC Santa
          Barbara.
        </p>

        <Section title="Course information">
          <p className={styles.content}>
            Class times, seats, grades and requirements on SBTime come from
            public sources, including UCSB&apos;s Academic Curriculums API and
            General Catalog, grade data published by the Daily Nexus, and
            enrollment history from UCSBPlat. This information can be out of
            date, incomplete or wrong.
          </p>
          <p className={styles.content}>
            SBTime is a planning aid, not an official record. GradTrak&apos;s
            requirement checks are not a degree audit. Always confirm classes,
            enrollment and graduation requirements with GOLD, the UCSB General
            Catalog and your academic advisor before making decisions.
          </p>
        </Section>

        <Section title="Your account">
          <List
            items={[
              "You sign in with your Google account and are responsible for what happens under it.",
              "Accounts are for one person. Don't sign in as someone else or share an account.",
              "SBTime may suspend or remove accounts that break these terms.",
            ]}
          />
        </Section>

        <Section title="Using SBTime fairly">
          <p className={styles.content}>
            When using SBTime, please don&apos;t:
          </p>
          <List
            items={[
              "Collect data from the site in bulk with automated tools (scraping), or put heavy load on its servers.",
              "Try to break, overload or get around the site's security or limits.",
              "Submit fake, misleading or manipulated ratings, or rate classes on someone else's behalf.",
              "Use SBTime for anything illegal, or to harass or harm others.",
            ]}
          />
          <p className={styles.content}>
            SBTime&apos;s source code is open source under the MIT License and
            available{" "}
            <a
              href="https://github.com/rudrachavda/sbtime"
              target="_blank"
              rel="noopener noreferrer"
              className={styles.link}
            >
              on GitHub
            </a>
            . You&apos;re welcome to read, copy and build on the code under that
            license; these terms cover using the website itself.
          </p>
        </Section>

        <Section title="What you add">
          <p className={styles.content}>
            Your schedules, plans and bookmarks stay yours. When you submit a
            class rating, you allow SBTime to store it and include it in the
            anonymous totals shown to other students. You can delete your
            ratings, or your whole account, at any time; see the{" "}
            <Link to="/legal/privacy" className={styles.link}>
              Privacy Policy
            </Link>{" "}
            for how your information is handled.
          </p>
        </Section>

        <Section title="Seat alerts">
          <p className={styles.content}>
            Seat alerts are sent on a best-effort basis. They can be late or
            missed, and a seat can be taken before you see the email. Don&apos;t
            rely on SBTime alone to enroll in a class.
          </p>
        </Section>

        <Section title="Changes and availability">
          <p className={styles.content}>
            SBTime is offered for free and may change, pause or stop any feature
            at any time. These terms may also change; the new version will be
            posted here with a new date, and continuing to use SBTime means you
            accept it.
          </p>
        </Section>

        <Section title="No warranty">
          <p className={styles.content}>
            SBTime is provided &quot;as is&quot; and &quot;as available&quot;,
            without warranties of any kind, including any warranty that it will
            be accurate, reliable, uninterrupted or fit for a particular
            purpose.
          </p>
        </Section>

        <Section title="Limitation of liability">
          <p className={styles.content}>
            To the fullest extent the law allows, SBTime and the people who run
            it are not liable for any indirect, incidental or consequential
            damages, or for any loss arising from your use of SBTime or from
            relying on its information, such as a missed class, a missed
            requirement or lost data. Some places don&apos;t allow these limits,
            so they may not all apply to you.
          </p>
        </Section>

        <Section title="Governing law">
          <p className={styles.content}>
            These terms are governed by the laws of the State of California,
            without regard to its conflict of law rules.
          </p>
        </Section>

        <Section title="Contact">
          <p className={styles.content}>
            Questions about these terms: <Email />.
          </p>
        </Section>
      </Container>
    </div>
  );
}
