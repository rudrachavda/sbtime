import { useEffect, useRef, useState } from "react";

import { motion, useInView, useReducedMotion } from "framer-motion";

import RollingNumber from "./RollingNumber";
import styles from "./SchedulerShowcase.module.scss";
import {
  FIRST_HOUR,
  LAST_HOUR,
  SHOWCASE_CLASSES,
  SHOWCASE_TERM,
  type ShowcaseClass,
  WEEKDAYS,
} from "./data";

// A picture of the Scheduler for the home page: a Fall 2024 schedule fills
// in one class at a time, then rests on the full week. Plays once, can't be
// clicked or selected (the window around it sets pointer-events and
// user-select to none and hides it from screen readers).

// The hero's own load-in (window, then headline words) ends around 1.24s.
const START_MS = 1400;
// If the showcase only scrolls into view later, start shortly after that.
const MIN_START_MS = 300;
const STEP_MS = 900;
const BLOCK_STAGGER_S = 0.08;
const EASE = [0.25, 0.1, 0.25, 1] as const;

const HOURS = Array.from(
  { length: LAST_HOUR - FIRST_HOUR },
  (_, i) => FIRST_HOUR + i
);
const SPAN_MINUTES = (LAST_HOUR - FIRST_HOUR) * 60;

const toMinutes = (time: string) => {
  const [hours, minutes] = time.split(":").map(Number);
  return hours * 60 + minutes;
};

const formatHour = (hour: number) =>
  `${hour % 12 === 0 ? 12 : hour % 12} ${hour < 12 ? "AM" : "PM"}`;

const formatTime = (time: string) => {
  const [hours, minutes] = time.split(":").map(Number);
  return `${hours % 12 === 0 ? 12 : hours % 12}:${String(minutes).padStart(2, "0")}`;
};

const courseCode = (c: ShowcaseClass) => `${c.subject} ${c.courseNumber}`;

export default function SchedulerShowcase() {
  const rootRef = useRef<HTMLDivElement>(null);
  const mountedAt = useRef(performance.now());
  const inView = useInView(rootRef, { once: true, amount: 0.2 });
  const reduceMotion = useReducedMotion();
  const [shownCount, setShownCount] = useState(0);

  // Reveal the classes one by one, once.
  useEffect(() => {
    if (reduceMotion) {
      setShownCount(SHOWCASE_CLASSES.length);
      return;
    }
    if (!inView) return;

    const sinceMount = performance.now() - mountedAt.current;
    const firstAt = Math.max(MIN_START_MS, START_MS - sinceMount);
    const timers = SHOWCASE_CLASSES.map((_, i) =>
      window.setTimeout(() => setShownCount(i + 1), firstAt + i * STEP_MS)
    );
    return () => timers.forEach((timer) => window.clearTimeout(timer));
  }, [inView, reduceMotion]);

  const shown = SHOWCASE_CLASSES.slice(0, shownCount);
  const units = shown.reduce((sum, c) => sum + c.units, 0);
  // With reduced motion everything appears in place, without animating.
  const enter = (from: Record<string, number | string>) =>
    reduceMotion ? false : from;

  return (
    <div ref={rootRef} className={styles.root}>
      <div className={styles.toolbar}>
        <div className={styles.titleGroup}>
          <span className={styles.title}>{SHOWCASE_TERM}</span>
          <span className={styles.units}>
            <RollingNumber value={units} minDigits={2} /> units
          </span>
        </div>
        <span className={styles.fakeButton}>Share</span>
      </div>

      <div className={styles.body}>
        <div className={styles.sidebar}>
          <div className={styles.sidebarHeader}>Classes</div>
          {shown.map((c) => (
            <motion.div
              key={courseCode(c)}
              className={styles.classRow}
              initial={enter({ opacity: 0, y: 6, filter: "blur(4px)" })}
              animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              transition={{ duration: 0.5, ease: EASE }}
            >
              <span
                className={styles.swatch}
                style={{ backgroundColor: `var(--${c.color}-500)` }}
              />
              <div className={styles.classText}>
                <span className={styles.code}>{courseCode(c)}</span>
                <span className={styles.classTitle}>{c.title}</span>
              </div>
              <span className={styles.classUnits}>{c.units} units</span>
            </motion.div>
          ))}
        </div>

        <div className={styles.week}>
          <div className={styles.weekHeader}>
            <span className={styles.gutter} />
            {WEEKDAYS.map((day) => (
              <span key={day} className={styles.dayLabel}>
                {day}
              </span>
            ))}
          </div>
          <div className={styles.weekBody}>
            <div className={styles.gutter}>
              {HOURS.map((hour) => (
                <span key={hour} className={styles.hourLabel}>
                  {formatHour(hour)}
                </span>
              ))}
            </div>
            {WEEKDAYS.map((day, dayIndex) => (
              <div key={day} className={styles.day}>
                {shown.flatMap((c) => {
                  // This class's blocks on this day, staggered in the order
                  // they appear across the week.
                  const blocks = c.meetings.flatMap((m) =>
                    m.days.map((d) => ({ meeting: m, day: d }))
                  );
                  return blocks
                    .map((block, order) => ({ ...block, order }))
                    .filter((block) => block.day === dayIndex)
                    .map(({ meeting, order }) => {
                      const start = toMinutes(meeting.start) - FIRST_HOUR * 60;
                      const length =
                        toMinutes(meeting.end) - toMinutes(meeting.start);
                      return (
                        <motion.div
                          key={`${courseCode(c)}-${meeting.start}`}
                          className={styles.block}
                          style={{
                            top: `${(start / SPAN_MINUTES) * 100}%`,
                            height: `${(length / SPAN_MINUTES) * 100}%`,
                            backgroundColor: `var(--${c.color}-500)`,
                          }}
                          initial={enter({ opacity: 0, y: -8, scale: 0.98 })}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          transition={{
                            duration: 0.5,
                            ease: EASE,
                            delay: order * BLOCK_STAGGER_S,
                          }}
                        >
                          <span className={styles.blockCode}>
                            {courseCode(c)}
                          </span>
                          <span className={styles.blockTime}>
                            {formatTime(meeting.start)} –{" "}
                            {formatTime(meeting.end)}
                          </span>
                        </motion.div>
                      );
                    });
                })}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
