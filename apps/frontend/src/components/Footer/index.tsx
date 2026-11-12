import { useEffect, useState } from "react";

import { HalfMoon, MacOsWindow, SunLight } from "iconoir-react";
import { Link } from "react-router-dom";

import { Container, PillSwitcher, useTheme } from "@repo/theme";

import { FEATURES } from "@/lib/features";

import styles from "./Footer.module.scss";

function ThemeSwitcher() {
  const { theme, setTheme } = useTheme();

  const items = [
    { value: "system", label: <MacOsWindow width={14} height={14} /> },
    { value: "light", label: <SunLight width={14} height={14} /> },
    { value: "dark", label: <HalfMoon width={14} height={14} /> },
  ];

  return (
    <PillSwitcher
      items={items}
      value={theme ?? "system"}
      onValueChange={(value) =>
        setTheme(value === "system" ? null : (value as "light" | "dark"))
      }
      iconOnly
    />
  );
}

type Status = "UP" | "HASISSUES" | "UNDERMAINTENANCE";

const STATUS_LABELS: Record<Status, string> = {
  UP: "All systems operational",
  HASISSUES: "Experiencing issues",
  UNDERMAINTENANCE: "Under maintenance",
};

// SBTime's own status page (an Instatus page, for example). Unset, so no
// badge is shown; Berkeleytime's page described their servers, not ours.
const STATUS_PAGE_URL: string | null = null;

function StatusBadge() {
  const [status, setStatus] = useState<Status | null>(null);

  useEffect(() => {
    if (!STATUS_PAGE_URL) return;
    fetch(`${STATUS_PAGE_URL}/summary.json`)
      .then((res) => res.json())
      .then((data) => setStatus(data.page.status as Status))
      .catch(() => setStatus("HASISSUES"));
  }, []);

  if (!status || !STATUS_PAGE_URL) return null;

  return (
    <a
      href={STATUS_PAGE_URL}
      target="_blank"
      rel="noopener noreferrer"
      className={styles.statusBadge}
      data-status={status}
    >
      <span className={styles.statusDot} />
      {STATUS_LABELS[status]}
    </a>
  );
}

export default function Footer() {
  return (
    <Container className={styles.wrapper}>
      <div className={styles.root}>
        <div className={styles.group}>
          <div className={styles.brandGroup}>
            <Link to="/" className={styles.brand}>
              SBTime
            </Link>
            <p className={styles.description}>
              Built on Berkeleytime, an ASUC OCTO project
            </p>
            <StatusBadge />
          </div>
        </div>
        <div className={styles.columns}>
          <div className={styles.column}>
            <p className={styles.label}>Socials</p>
            <a
              href="https://www.instagram.com/berkeleytimeofficial/"
              target="_blank"
              className={styles.link}
            >
              Instagram
            </a>
            <a
              href="https://discord.gg/uP2bTPh99U"
              target="_blank"
              className={styles.link}
            >
              Discord
            </a>
            <a
              href="https://github.com/asuc-octo/berkeleytime"
              target="_blank"
              className={styles.link}
            >
              GitHub
            </a>
          </div>
          <div className={styles.column}>
            <p className={styles.label}>Offerings</p>
            <Link to="/catalog" className={styles.link}>
              Courses
            </Link>
            {FEATURES.curatedClasses && (
              <Link to="/curated" className={styles.link}>
                Curated Classes
              </Link>
            )}
            <Link to="/scheduler" className={styles.link}>
              Scheduler
            </Link>
            {FEATURES.gradtrak && (
              <Link to="/gradtrak" className={styles.link}>
                Gradtrak
              </Link>
            )}
            {FEATURES.grades && (
              <Link to="/grades" className={styles.link}>
                Grades
              </Link>
            )}
            {FEATURES.enrollment && (
              <Link to="/enrollment" className={styles.link}>
                Enrollment
              </Link>
            )}
          </div>
          <div className={styles.column}>
            <p className={styles.label}>About Us</p>
            <Link to="/about" className={styles.link}>
              Our Team
            </Link>
            <Link to="https://octo.asuc.org/" className={styles.link}>
              OCTO
            </Link>
            <Link to="/legal/privacy" className={styles.link}>
              Privacy Policy
            </Link>
            <Link to="/legal/terms" className={styles.link}>
              Terms of Service
            </Link>
          </div>
        </div>
      </div>
      <div className={styles.bottom}>
        <span>© {new Date().getFullYear()}, SBTime.</span>
        <ThemeSwitcher />
      </div>
    </Container>
  );
}
