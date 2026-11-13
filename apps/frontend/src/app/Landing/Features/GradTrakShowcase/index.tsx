import { motion } from "framer-motion";

import RollingNumber from "../../Hero/SchedulerShowcase/RollingNumber";
import usePlayOnce from "../usePlayOnce";
import styles from "./GradTrakShowcase.module.scss";
import {
  PLAN_CATALOG_YEAR,
  PLAN_MAJOR,
  PLAN_YEARS,
  REQUIREMENTS,
} from "./data";

// A picture of GradTrak: a Computer Science plan fills in course by course
// while the requirement checks and the unit total count up. Plays once when
// scrolled into view; decorative only.

const STEP_MS = 320;
const EASE = [0.25, 0.1, 0.25, 1] as const;

// Every course in the order it appears
const ORDER = PLAN_YEARS.flat().flatMap((quarter) => quarter.courses);

export default function GradTrakShowcase() {
  const { ref, step, still } = usePlayOnce<HTMLDivElement>({
    total: ORDER.length,
    stepMs: STEP_MS,
  });

  const placed = ORDER.slice(0, step);
  const units = placed.reduce((sum, course) => sum + course.units, 0);
  const done = (id: string) =>
    placed.filter((course) => course.requirement === id).length;

  let index = 0;

  return (
    <div ref={ref} className={styles.root}>
      <div className={styles.toolbar}>
        <div className={styles.titleGroup}>
          <span className={styles.title}>{PLAN_MAJOR}</span>
          <span className={styles.meta}>{PLAN_CATALOG_YEAR}</span>
        </div>
        <span className={styles.meta}>
          <RollingNumber value={units} minDigits={2} /> units
        </span>
      </div>

      <div className={styles.body}>
        <div className={styles.sidebar}>
          <div className={styles.sidebarHeader}>Requirements</div>
          {REQUIREMENTS.map((requirement) => {
            const count = done(requirement.id);
            return (
              <div key={requirement.id} className={styles.requirement}>
                <div className={styles.requirementRow}>
                  <span className={styles.requirementLabel}>
                    {requirement.label}
                  </span>
                  <span className={styles.requirementCount}>
                    <RollingNumber value={count} /> / {requirement.total}
                  </span>
                </div>
                <div className={styles.track}>
                  <motion.div
                    className={styles.fill}
                    initial={false}
                    animate={{ width: `${(count / requirement.total) * 100}%` }}
                    transition={{ duration: still ? 0 : 0.6, ease: EASE }}
                  />
                </div>
              </div>
            );
          })}
        </div>

        <div className={styles.plan}>
          {PLAN_YEARS.map((quarters, yearIndex) => (
            <div key={yearIndex} className={styles.year}>
              <span className={styles.yearLabel}>Year {yearIndex + 1}</span>
              <div className={styles.quarters}>
                {quarters.map((quarter) => (
                  <div key={quarter.name} className={styles.quarter}>
                    <div className={styles.quarterHeader}>{quarter.name}</div>
                    <div className={styles.courses}>
                      {quarter.courses.map((course) => {
                        const shown = index++ < step;
                        return shown ? (
                          <motion.div
                            key={course.code}
                            className={styles.course}
                            initial={
                              still
                                ? false
                                : { opacity: 0, y: 6, filter: "blur(2px)" }
                            }
                            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                            transition={{ duration: 0.5, ease: EASE }}
                          >
                            <span className={styles.courseCode}>
                              {course.code}
                            </span>
                            <span className={styles.courseUnits}>
                              {course.units}
                            </span>
                          </motion.div>
                        ) : (
                          <div
                            key={course.code}
                            className={styles.placeholder}
                          />
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
