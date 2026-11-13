import { useRef } from "react";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";

import styles from "./RollingNumber.module.scss";

// A number whose changed digits swap in place with the same move as the
// hero's load-in, scaled down: the old digit drifts up, blurs and fades out
// while the new one rises from slightly below, unblurring and fading in.
// Digits that don't change stay still. (Going down, the directions flip.)
//
// `minDigits` pads with leading zeros (2 -> "04") so the width never changes
// while it animates. Used for the showcase's unit total.

const EASE = [0.25, 0.1, 0.25, 1] as const; // the load-in's curve
const DURATION_S = 0.6;
const OFFSET = "20%"; // the load-in's translateY(20%)
const BLUR = "blur(2px)"; // light, so the small digits stay readable

type Direction = 1 | -1;

const variants = {
  enter: (direction: Direction) => ({
    y: direction === 1 ? OFFSET : `-${OFFSET}`,
    opacity: 0,
    filter: BLUR,
  }),
  center: { y: "0%", opacity: 1, filter: "blur(0px)" },
  exit: (direction: Direction) => ({
    y: direction === 1 ? `-${OFFSET}` : OFFSET,
    opacity: 0,
    filter: BLUR,
  }),
};

function Digit({
  value,
  direction,
  still,
}: {
  value: string;
  direction: Direction;
  still: boolean;
}) {
  return (
    <span className={styles.digit}>
      <AnimatePresence initial={false} custom={direction}>
        <motion.span
          key={value}
          className={styles.glyph}
          custom={direction}
          variants={variants}
          initial={still ? false : "enter"}
          animate="center"
          exit={still ? undefined : "exit"}
          transition={{ duration: still ? 0 : DURATION_S, ease: EASE }}
        >
          {value}
        </motion.span>
      </AnimatePresence>
    </span>
  );
}

export default function RollingNumber({
  value,
  minDigits = 1,
}: {
  value: number;
  minDigits?: number;
}) {
  const still = useReducedMotion() ?? false;
  const rounded = Math.max(0, Math.round(value));
  const previous = useRef(rounded);
  const direction: Direction = rounded < previous.current ? -1 : 1;
  previous.current = rounded;

  const digits = String(rounded).padStart(minDigits, "0").split("");

  return (
    <span className={styles.root} aria-label={String(rounded)}>
      {digits.map((digit, i) => (
        // Keyed by place (ones, tens, ...) so unchanged digits stay put.
        <Digit
          key={digits.length - i}
          value={digit}
          direction={direction}
          still={still}
        />
      ))}
    </span>
  );
}
