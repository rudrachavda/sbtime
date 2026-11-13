import type { ReactNode } from "react";

import styles from "./ShowcaseKit.module.scss";

// Drawn copies of the real Grades and Enrollment page parts for the home page
// showcases: picker pills, the blue add button, course cards and the details
// panel. Pictures only: nothing here is clickable or focusable.

export function FakeSelect({
  children,
  width,
  clearable,
  muted,
}: {
  children: ReactNode;
  width: number;
  /** Shows the "x" the real class picker has once a class is chosen */
  clearable?: boolean;
  /** Placeholder-style gray text */
  muted?: boolean;
}) {
  return (
    <span
      className={`${styles.select} ${muted ? styles.muted : ""}`}
      style={{ width }}
    >
      <span className={styles.selectText}>{children}</span>
      {clearable && <span className={styles.clear}>×</span>}
      <svg className={styles.chevron} viewBox="0 0 16 16" aria-hidden="true">
        <path d="M4 6l4 4 4-4" fill="none" stroke="currentColor" />
      </svg>
    </span>
  );
}

export function FakeButton({ children }: { children: ReactNode }) {
  return <span className={styles.button}>{children}</span>;
}

export function FakeSwitch({ label }: { label: string }) {
  return (
    <span className={styles.switchRow}>
      <span className={styles.switch}>
        <span className={styles.knob} />
      </span>
      {label}
    </span>
  );
}

export function Square({ color }: { color: string }) {
  return (
    <span
      className={styles.square}
      style={{ backgroundColor: `var(--${color}-500)` }}
    />
  );
}

export function CourseCard({
  color,
  code,
  detail,
  value,
}: {
  color: string;
  code: string;
  detail: string;
  value?: ReactNode;
}) {
  return (
    <div className={styles.card}>
      <Square color={color} />
      <div className={styles.cardText}>
        <span className={styles.cardCode}>{code}</span>
        <span className={styles.cardDetail}>{detail}</span>
      </div>
      {value !== undefined && <span className={styles.cardValue}>{value}</span>}
    </div>
  );
}

// Like the real CourseSideMetrics panel
export function SideMetrics({
  color,
  code,
  title,
  metadata,
  metrics,
}: {
  color: string;
  code: string;
  title: string;
  metadata: string;
  metrics: { label: string; value: ReactNode }[];
}) {
  return (
    <div className={styles.side}>
      <div className={styles.sideHeading}>
        <Square color={color} />
        {code}
      </div>
      <div className={styles.sideTitle}>{title}</div>
      <div className={styles.sideMeta}>{metadata}</div>
      <div className={styles.metrics}>
        {metrics.map((metric) => (
          <div key={metric.label} className={styles.metric}>
            <span className={styles.metricLabel}>{metric.label}</span>
            <span className={styles.metricValue}>{metric.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
