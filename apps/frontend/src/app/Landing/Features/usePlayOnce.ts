import { useEffect, useRef, useState } from "react";

import { useInView, useReducedMotion } from "framer-motion";

// Steps a showcase forward once it scrolls into view: returns how many steps
// have played so far (0..total). With reduced motion it jumps straight to the
// end. Plays once per page load.
export default function usePlayOnce<T extends Element>({
  total,
  startDelayMs = 400,
  stepMs,
}: {
  total: number;
  startDelayMs?: number;
  stepMs: number;
}) {
  const ref = useRef<T>(null);
  // 10%: the windows are wider than the screen and clipped, so on phones only
  // a small share of one is ever visible.
  const inView = useInView(ref, { once: true, amount: 0.1 });
  const still = useReducedMotion() ?? false;
  const [step, setStep] = useState(0);

  useEffect(() => {
    if (still) {
      setStep(total);
      return;
    }
    if (!inView) return;
    const timers = Array.from({ length: total }, (_, i) =>
      window.setTimeout(() => setStep(i + 1), startDelayMs + i * stepMs)
    );
    return () => timers.forEach((timer) => window.clearTimeout(timer));
  }, [inView, still, total, startDelayMs, stepMs]);

  return { ref, step, still };
}
