import { motion } from "framer-motion";

import RollingNumber from "../../Hero/SchedulerShowcase/RollingNumber";
import {
  CourseCard,
  FakeButton,
  FakeSelect,
  FakeSwitch,
  SideMetrics,
} from "../ShowcaseKit";
import usePlayOnce from "../usePlayOnce";
import styles from "./EnrollmentShowcase.module.scss";
import {
  ENROLLMENT_COURSE,
  ENROLLMENT_HISTORY,
  ENROLLMENT_SECTION,
  ENROLLMENT_TERM,
  ENROLLMENT_TITLE,
  MONTH_TICKS,
  PHASES,
} from "./data";

// A picture of the Enrollment page: PSY 1's real Fall 2026 seat history draws
// itself day by day against the seat limit (dashed) and the registration
// passes, while the enrolled count follows it. Plays once when scrolled into
// view; decorative only.

const STEP_MS = 110;
const EASE = [0.25, 0.1, 0.25, 1] as const;

// Chart geometry, in SVG units
const WIDTH = 860;
const HEIGHT = 360;
const Y_MAX = 900;
const Y_TICKS = [900, 600, 300, 0];

const toTime = (date: string) => new Date(`${date}T00:00:00Z`).getTime();
const START = toTime(ENROLLMENT_HISTORY[0].date);
const END = toTime(ENROLLMENT_HISTORY[ENROLLMENT_HISTORY.length - 1].date);
const xFor = (date: string) => ((toTime(date) - START) / (END - START)) * WIDTH;
const yFor = (seats: number) => HEIGHT - (seats / Y_MAX) * HEIGHT;

const POINTS = ENROLLMENT_HISTORY.map((p) => ({
  ...p,
  x: xFor(p.date),
  y: yFor(p.enrolled),
}));

// Enrolled: straight lines between days; capacity: a step line
const ENROLLED_PATH = POINTS.map(
  (p, i) => `${i ? "L" : "M"}${p.x.toFixed(1)},${p.y.toFixed(1)}`
).join(" ");
const CAPACITY_PATH = POINTS.map((p, i) => {
  const y = yFor(p.capacity).toFixed(1);
  return i === 0 ? `M${p.x.toFixed(1)},${y}` : `H${p.x.toFixed(1)} V${y}`;
}).join(" ");
const AREA_PATH = `${ENROLLED_PATH} L${WIDTH},${HEIGHT} L0,${HEIGHT} Z`;

const LAST = POINTS[POINTS.length - 1];

export default function EnrollmentShowcase() {
  // Steps: the course card, one per day of history, then the details panel
  const { ref, step, still } = usePlayOnce<HTMLDivElement>({
    total: 1 + POINTS.length + 1,
    stepMs: STEP_MS,
  });
  const pointsShown = Math.min(POINTS.length, Math.max(0, step - 1));
  const current = POINTS[Math.max(0, pointsShown - 1)];
  const revealedTo = pointsShown === 0 ? 0 : current.x;
  const finished = step > POINTS.length + 1;
  const enter = still ? false : { opacity: 0, y: 6, filter: "blur(2px)" };
  const shown = { opacity: 1, y: 0, filter: "blur(0px)" };

  return (
    <div ref={ref} className={styles.root}>
      <div className={styles.toolbar}>
        <FakeSelect width={140} clearable>
          {ENROLLMENT_COURSE}
        </FakeSelect>
        <FakeSelect width={130}>{ENROLLMENT_TERM}</FakeSelect>
        <FakeSelect width={150}>Section {ENROLLMENT_SECTION}</FakeSelect>
        <FakeButton>Add class</FakeButton>
        <span className={styles.spacer} />
        <FakeSwitch label="Show phases" />
      </div>

      <div className={styles.cards}>
        {step >= 1 ? (
          <motion.div
            initial={enter}
            animate={shown}
            transition={{ duration: 0.5, ease: EASE }}
          >
            <CourseCard
              color="blue"
              code={ENROLLMENT_COURSE}
              detail={`${ENROLLMENT_TERM} · Section ${ENROLLMENT_SECTION}`}
              value={
                <>
                  <RollingNumber
                    value={pointsShown === 0 ? 0 : current.enrolled}
                    minDigits={3}
                  />
                  <span className={styles.cardCapacity}>
                    &nbsp;/ {current.capacity}
                  </span>
                </>
              }
            />
          </motion.div>
        ) : (
          <div className={styles.cardSlot} />
        )}
      </div>

      <div className={styles.main}>
        <div className={styles.chart}>
          <div className={styles.yAxis}>
            {Y_TICKS.map((tick) => (
              <span key={tick}>{tick}</span>
            ))}
          </div>
          <div className={styles.plotArea}>
            <svg
              viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
              preserveAspectRatio="none"
              className={styles.svg}
            >
              <defs>
                <clipPath id="enrollment-reveal">
                  <motion.rect
                    x={0}
                    y={-4}
                    height={HEIGHT + 8}
                    initial={false}
                    animate={{ width: revealedTo }}
                    transition={{
                      duration: still ? 0 : STEP_MS / 1000,
                      ease: "linear",
                    }}
                  />
                </clipPath>
              </defs>
              {Y_TICKS.map((tick) => (
                <line
                  key={tick}
                  className={styles.gridLine}
                  x1={0}
                  x2={WIDTH}
                  y1={yFor(tick)}
                  y2={yFor(tick)}
                />
              ))}
              {PHASES.map((phase) => (
                <line
                  key={phase.label}
                  className={styles.phaseLine}
                  x1={xFor(phase.date)}
                  x2={xFor(phase.date)}
                  y1={0}
                  y2={HEIGHT}
                />
              ))}
              <g clipPath="url(#enrollment-reveal)">
                <path className={styles.capacityLine} d={CAPACITY_PATH} />
                <path className={styles.area} d={AREA_PATH} />
                <path className={styles.enrolledLine} d={ENROLLED_PATH} />
              </g>
            </svg>
            {PHASES.map((phase) => (
              <span
                key={phase.label}
                className={styles.phaseLabel}
                style={{ left: `${(xFor(phase.date) / WIDTH) * 100}%` }}
              >
                {phase.label}
              </span>
            ))}
            <div className={styles.xAxis}>
              {MONTH_TICKS.map((tick) => (
                <span
                  key={tick.label}
                  style={{ left: `${(xFor(tick.date) / WIDTH) * 100}%` }}
                >
                  {tick.label}
                </span>
              ))}
            </div>
          </div>
        </div>

        <motion.div
          className={styles.sideSlot}
          initial={false}
          animate={finished ? shown : { opacity: 0, y: 6, filter: "blur(2px)" }}
          transition={{ duration: still ? 0 : 0.6, ease: EASE }}
        >
          <SideMetrics
            color="blue"
            code={ENROLLMENT_COURSE}
            title={ENROLLMENT_TITLE}
            metadata={`${ENROLLMENT_TERM} · Section ${ENROLLMENT_SECTION}`}
            metrics={[
              {
                label: "Enrolled",
                value: `${LAST.enrolled} / ${LAST.capacity} (${Math.round(
                  (LAST.enrolled / LAST.capacity) * 100
                )}%)`,
              },
              { label: "Waitlisted", value: "0" },
              { label: "Seats left", value: LAST.capacity - LAST.enrolled },
            ]}
          />
        </motion.div>
      </div>
    </div>
  );
}
