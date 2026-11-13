import styles from "./Hero.module.scss";
import SchedulerShowcase from "./SchedulerShowcase";

// The frosted window holding the Scheduler showcase.
function AppPreview() {
  return (
    <div
      className={styles.preview}
      style={{ animationDelay: `${WINDOW_DELAY_MS}ms` }}
      aria-hidden="true"
    >
      <div className={styles.previewInset}>
        <div className={styles.previewPanel}>
          <SchedulerShowcase />
        </div>
      </div>
    </div>
  );
}

// Load-in order: the window first (0ms), then each word of the headline.
// Each takes 800ms; words start 80ms apart from 200ms, so the last word
// starts at 440ms.
const WINDOW_DELAY_MS = 0;
const FIRST_WORD_DELAY_MS = 200;
const WORD_STAGGER_MS = 80;

const HEADLINE_LINES = [["UCSB's"], ["course", "discovery", "platform"]];

export default function Hero() {
  let wordIndex = 0;

  return (
    <section className={styles.root}>
      <div className={styles.container}>
        <div className={styles.headingRow}>
          <h1 className={styles.heading}>
            {HEADLINE_LINES.map((words, lineIndex) => (
              <span key={lineIndex} className={styles.line}>
                {words.map((word, i) => {
                  const delay =
                    FIRST_WORD_DELAY_MS + WORD_STAGGER_MS * wordIndex++;
                  return (
                    <span
                      key={word}
                      className={styles.word}
                      style={{ animationDelay: `${delay}ms` }}
                    >
                      {/* The space lives inside the word so it rises with it */}
                      {i < words.length - 1 ? `${word} ` : word}
                    </span>
                  );
                })}
              </span>
            ))}
          </h1>
        </div>
        <div className={styles.stage}>
          <div className={styles.glow} aria-hidden="true" />
          <AppPreview />
        </div>
      </div>
    </section>
  );
}
