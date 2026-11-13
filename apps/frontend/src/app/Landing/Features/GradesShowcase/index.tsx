import { motion } from "framer-motion";

import { getLetterGradeFromGPA } from "@/lib/grades";

import {
  CourseCard,
  FakeButton,
  FakeSelect,
  SideMetrics,
} from "../ShowcaseKit";
import usePlayOnce from "../usePlayOnce";
import styles from "./GradesShowcase.module.scss";
import {
  COURSE_AVERAGE_GPA,
  GRADES,
  GRADES_COURSE,
  GRADES_TITLE,
  INSTRUCTORS,
  averageGpa,
  totalOf,
} from "./data";

// A picture of the Grades page comparing two instructors' real PSTAT 120A
// distributions: their course cards appear, the paired bars grow from A+ to
// F, then the averages fill in. Plays once when scrolled into view;
// decorative only.

const STEP_MS = 90;
const EASE = [0.25, 0.1, 0.25, 1] as const;
const Y_MAX = 0.4; // the chart's top line: 40% of students
const Y_TICKS = [0.4, 0.3, 0.2, 0.1, 0];

const SHARES = INSTRUCTORS.map((instructor) =>
  instructor.counts.map((count) => count / totalOf(instructor))
);
const gradeLabel = (gpa: number) =>
  `${getLetterGradeFromGPA(gpa)} (${gpa.toFixed(2)})`;

export default function GradesShowcase() {
  // Steps: one per course card, one per grade, then the averages
  const cardSteps = INSTRUCTORS.length;
  const { ref, step, still } = usePlayOnce<HTMLDivElement>({
    total: cardSteps + GRADES.length + 1,
    stepMs: STEP_MS,
  });
  const barsGrown = Math.max(0, step - cardSteps);
  const showAverages = step > cardSteps + GRADES.length;
  const enter = still ? false : { opacity: 0, y: 6, filter: "blur(2px)" };
  const shown = { opacity: 1, y: 0, filter: "blur(0px)" };
  const [first] = INSTRUCTORS;

  return (
    <div ref={ref} className={styles.root}>
      <div className={styles.toolbar}>
        <FakeSelect width={170} clearable>
          {GRADES_COURSE}
        </FakeSelect>
        <FakeSelect width={140}>By Instructor</FakeSelect>
        <FakeSelect width={210}>
          {INSTRUCTORS.map((i) => i.name).join(", ")}
        </FakeSelect>
        <FakeSelect width={140} muted>
          All Quarters
        </FakeSelect>
        <FakeButton>Add course</FakeButton>
      </div>

      <div className={styles.cards}>
        {INSTRUCTORS.map((instructor, i) =>
          i < step ? (
            <motion.div
              key={instructor.name}
              initial={enter}
              animate={shown}
              transition={{ duration: 0.5, ease: EASE }}
            >
              <CourseCard
                color={instructor.color}
                code={GRADES_COURSE}
                detail={`${instructor.name} · All Quarters`}
                value={
                  <motion.span
                    initial={false}
                    animate={{ opacity: showAverages ? 1 : 0 }}
                    transition={{ duration: still ? 0 : 0.5 }}
                  >
                    {getLetterGradeFromGPA(averageGpa(instructor))}
                  </motion.span>
                }
              />
            </motion.div>
          ) : (
            <div key={instructor.name} className={styles.cardSlot} />
          )
        )}
      </div>

      <div className={styles.main}>
        <div className={styles.chart}>
          <div className={styles.yAxis}>
            {Y_TICKS.map((tick) => (
              <span key={tick}>{Math.round(tick * 100)}%</span>
            ))}
          </div>
          <div className={styles.plotArea}>
            <div className={styles.plot}>
              {Y_TICKS.map((tick) => (
                <span
                  key={tick}
                  className={styles.gridLine}
                  style={{ bottom: `${(tick / Y_MAX) * 100}%` }}
                />
              ))}
              {GRADES.map((grade, gradeIndex) => (
                <div key={grade} className={styles.group}>
                  {INSTRUCTORS.map((instructor, i) => (
                    <motion.div
                      key={instructor.name}
                      className={styles.bar}
                      style={{
                        backgroundColor: `var(--${instructor.color}-500)`,
                      }}
                      initial={false}
                      animate={{
                        height:
                          gradeIndex < barsGrown
                            ? `${(SHARES[i][gradeIndex] / Y_MAX) * 100}%`
                            : "0%",
                      }}
                      transition={{ duration: still ? 0 : 0.6, ease: EASE }}
                    />
                  ))}
                </div>
              ))}
            </div>
            <div className={styles.xAxis}>
              {GRADES.map((grade) => (
                <span key={grade}>{grade}</span>
              ))}
            </div>
          </div>
        </div>

        <motion.div
          className={styles.sideSlot}
          initial={false}
          animate={
            showAverages ? shown : { opacity: 0, y: 6, filter: "blur(2px)" }
          }
          transition={{ duration: still ? 0 : 0.6, ease: EASE }}
        >
          <SideMetrics
            color={first.color}
            code={GRADES_COURSE}
            title={GRADES_TITLE}
            metadata={`${first.name} · All Quarters`}
            metrics={[
              {
                label: "Course Average",
                value: gradeLabel(COURSE_AVERAGE_GPA),
              },
              {
                label: "Section Average",
                value: gradeLabel(averageGpa(first)),
              },
              {
                label: "Students",
                value: totalOf(first).toLocaleString("en-US"),
              },
            ]}
          />
        </motion.div>
      </div>
    </div>
  );
}
