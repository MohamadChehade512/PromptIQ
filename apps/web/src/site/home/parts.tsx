import type { ReactNode, RefObject } from 'react';
import { useCountUp, useInView } from '../../lib/motion';
import { VAGUE } from './demoData';

/** Fades and lifts its content in the first time it scrolls into view. */
export function Reveal(props: { children: ReactNode; className?: string; as?: 'section' | 'div' }) {
  const [ref, seen] = useInView<HTMLElement>(0.15);
  const common = {
    className: `reveal ${props.className ?? ''}`,
    'data-in': seen || undefined,
  };
  return props.as === 'section' ? (
    <section ref={ref} {...common}>
      {props.children}
    </section>
  ) : (
    <div ref={ref as RefObject<HTMLDivElement | null>} {...common}>
      {props.children}
    </div>
  );
}

/** A number that counts toward its value; `format` renders it. */
export function Counter(props: {
  value: number;
  format?: (n: number) => string;
  ms?: number;
  /** Count up from here when first shown (default 0). */
  from?: number;
}) {
  const v = useCountUp(props.value, props.ms, props.from ?? 0);
  return <>{(props.format ?? ((n) => Math.round(n).toLocaleString()))(v)}</>;
}

/** Score ring: the arc and the number both animate to the score. */
export function ScoreRing({ score, size = 112 }: { score: number; size?: number }) {
  const v = useCountUp(score, 900, 0);
  const r = 52;
  const c = 2 * Math.PI * r;
  const tone = score >= 75 ? 'good' : score >= 50 ? 'warn' : 'bad';
  return (
    <div className={`ring tone-${tone}`} style={{ width: size, height: size }}>
      <svg viewBox="0 0 120 120" aria-hidden="true">
        <circle className="ring-track" cx="60" cy="60" r={r} />
        <circle
          className="ring-value"
          cx="60"
          cy="60"
          r={r}
          strokeDasharray={`${(v / 100) * c} ${c}`}
          transform="rotate(-90 60 60)"
        />
      </svg>
      <span className="ring-num">{Math.round(v)}</span>
    </div>
  );
}

/** The vague example with the engine's flagged words highlighted (when `marked`). */
export function MarkedPrompt({ marked }: { marked: boolean }) {
  const words = VAGUE.marks.map((m) => m.phrase.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
  const re = new RegExp(`\\b(${words.join('|')})\\b`, 'g');
  const kind = (s: string) => VAGUE.marks.find((m) => m.phrase === s)?.kind ?? 'filler';
  const parts = VAGUE.text.split(re);
  return (
    <p className="demo-text">
      {parts.map((part, i) =>
        i % 2 === 1 ? (
          <mark key={i} className={`flag flag-${kind(part)}`} data-on={marked || undefined}>
            {part}
          </mark>
        ) : (
          <span key={i}>{part}</span>
        ),
      )}
    </p>
  );
}
