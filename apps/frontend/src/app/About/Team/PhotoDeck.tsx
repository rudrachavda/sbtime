import { useState } from "react";

import {
  AnimatePresence,
  TargetAndTransition,
  motion,
  useReducedMotion,
} from "framer-motion";
import { NavArrowLeft, NavArrowRight } from "iconoir-react";
import { Link } from "react-router";

import styles from "./PhotoDeck.module.scss";
import Signatures from "./Signatures";
import { JOIN_TEAM_LINK, TEAM_PHOTOS } from "./data";

// The team photos as a deck of prints: the current one on top, the rest
// fanned out underneath. Next drops the top print forward and fades it out as
// the deck moves up; Previous puts it back. Stops at both ends.

// Each print's place in the deck, top first
const STACK: TargetAndTransition[] = [
  { x: 0, y: 0, scale: 1, rotate: 0 },
  { x: 10, y: 12, scale: 0.97, rotate: 1 },
  { x: -12, y: 25, scale: 0.94, rotate: -1 },
  { x: 8, y: 37, scale: 0.91, rotate: 1.2 },
  { x: -6, y: 50, scale: 0.88, rotate: -0.8 },
];

// Prints already looked at: dropped forward off the deck and faded out
const LIFTED: TargetAndTransition = {
  x: 8,
  y: 88,
  scale: 1.02,
  rotate: 3,
  opacity: 0,
  filter: "blur(8px)",
};

const EASE = [0.25, 0.1, 0.25, 1] as const;

const pad = (n: number) => String(n).padStart(2, "0");

function poseFor(depth: number): TargetAndTransition {
  if (depth < 0) return LIFTED;
  const place = STACK[Math.min(depth, STACK.length - 1)];
  return {
    ...place,
    opacity: depth < STACK.length ? 1 : 0,
    filter: "blur(0px)",
  };
}

export default function PhotoDeck() {
  const [index, setIndex] = useState(0);
  const reduceMotion = useReducedMotion();
  const total = TEAM_PHOTOS.length;
  const current = TEAM_PHOTOS[index];
  const duration = reduceMotion ? 0 : 0.5;

  return (
    <section
      aria-roledescription="carousel"
      aria-label="Team photos"
      className={styles.photos}
    >
      <div className={styles.controls}>
        <button
          type="button"
          aria-label="Previous photo"
          className={`${styles.arrow} ${styles.previous}`}
          disabled={index === 0}
          onClick={() => setIndex((i) => Math.max(0, i - 1))}
        >
          <NavArrowLeft />
        </button>

        <p className={styles.counter} aria-live="polite">
          {pad(index + 1)} / {pad(total)}
        </p>

        <button
          type="button"
          aria-label="Next photo"
          className={`${styles.arrow} ${styles.next}`}
          disabled={index === total - 1}
          onClick={() => setIndex((i) => Math.min(total - 1, i + 1))}
        >
          <NavArrowRight />
        </button>

        <div className={styles.deck}>
          {TEAM_PHOTOS.map((photo, i) => {
            const depth = i - index;
            return (
              <motion.div
                key={photo.src}
                className={styles.print}
                // Lifted prints stay above the deck while they fade out
                style={{ zIndex: depth < 0 ? total + 1 : total - depth }}
                initial={false}
                animate={poseFor(depth)}
                transition={{ duration, ease: EASE }}
                aria-hidden={depth !== 0}
              >
                <div className={styles.printImage}>
                  <img
                    src={photo.src}
                    alt={photo.caption}
                    draggable={false}
                    loading={i < 2 ? "eager" : "lazy"}
                    decoding="async"
                  />
                </div>
              </motion.div>
            );
          })}
        </div>

        <div className={styles.caption}>
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: reduceMotion ? 0 : 0.2, ease: EASE }}
            >
              <p className={styles.captionTitle}>{current.caption}</p>
              <p className={styles.captionDate}>{current.date}</p>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      <Signatures />

      <Link to={JOIN_TEAM_LINK} className={styles.join}>
        Join the team
      </Link>
    </section>
  );
}
