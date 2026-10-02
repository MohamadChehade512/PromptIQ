import { useEffect, useRef, useState, type RefObject } from 'react';

const REDUCE = '(prefers-reduced-motion: reduce)';

/** True when the person has asked their device for less motion; everything then shows instantly. */
export function prefersReducedMotion(): boolean {
  return typeof window.matchMedia === 'function' && window.matchMedia(REDUCE).matches;
}

export function useReducedMotion(): boolean {
  const [reduce, setReduce] = useState(prefersReducedMotion);
  useEffect(() => {
    if (typeof window.matchMedia !== 'function') return;
    const mq = window.matchMedia(REDUCE);
    const on = () => setReduce(mq.matches);
    mq.addEventListener('change', on);
    return () => mq.removeEventListener('change', on);
  }, []);
  return reduce;
}

/**
 * Becomes true once the element has scrolled into view (and stays true). Without
 * IntersectionObserver (tests, very old browsers) it's true straight away.
 */
export function useInView<T extends Element>(threshold = 0.25): [RefObject<T | null>, boolean] {
  const ref = useRef<T>(null);
  const [seen, setSeen] = useState(() => typeof IntersectionObserver === 'undefined');
  useEffect(() => {
    const el = ref.current;
    if (seen || !el) return;
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setSeen(true);
          io.disconnect();
        }
      },
      { threshold },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [seen, threshold]);
  return [ref, seen];
}

/**
 * Animates a number toward `target` (ease-out), from wherever it currently is; on mount it
 * starts from `start` (default: no animation on mount).
 */
export function useCountUp(target: number, durationMs = 700, start = target): number {
  const reduce = useReducedMotion();
  const [value, setValue] = useState(reduce ? target : start);
  const from = useRef(reduce ? target : start);
  useEffect(() => {
    if (reduce) {
      from.current = target;
      return;
    }
    const t0 = performance.now();
    const origin = from.current;
    let frame = 0;
    const tick = (now: number) => {
      const t = Math.min(1, (now - t0) / durationMs);
      const eased = 1 - Math.pow(1 - t, 3);
      const v = origin + (target - origin) * eased;
      from.current = v;
      setValue(v);
      if (t < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [target, durationMs, reduce]);
  // With reduced motion, jump straight to the value.
  return reduce ? target : value;
}
