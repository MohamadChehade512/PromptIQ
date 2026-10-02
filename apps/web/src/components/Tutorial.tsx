import {
  useEffect,
  useId,
  useRef,
  useState,
  type KeyboardEvent as ReactKeyboardEvent,
} from 'react';
import { TUTORIAL_STEPS, type TutorialStep } from '../lib/tutorialSteps';

interface Rect {
  top: number;
  left: number;
  width: number;
  height: number;
}

const PAD = 8;
/** Breathing room between the screen edge, the spotlight and the card. */
const GAP = 16;
/** Card height before it's been measured. */
const CARD_FALLBACK = 260;

function findTarget(target: string | undefined): Element | null {
  return target ? document.querySelector(`[data-tour="${target}"]`) : null;
}

/** A centered, zero-size "hole": the page stays dimmed with nothing highlighted. */
function centerRect(): Rect {
  return { top: window.innerHeight / 2, left: window.innerWidth / 2, width: 0, height: 0 };
}

function measure(el: Element | null): Rect {
  if (!el) return centerRect();
  const r = el.getBoundingClientRect();
  return {
    top: r.top - PAD,
    left: r.left - PAD,
    width: r.width + PAD * 2,
    height: r.height + PAD * 2,
  };
}

/**
 * Jump (not smooth-scroll) so the target sits centred in the space above the card, which
 * stays docked at the bottom of the screen. A target taller than that space starts at the
 * top. Measuring once after a jump is what keeps the spotlight steady; chasing a smooth
 * scroll is what made it jitter.
 */
/** Height of the sticky app bar, which covers the top of the page on wide screens. */
function stickyInset(): number {
  const bar = document.querySelector('.top');
  return bar && getComputedStyle(bar).position === 'sticky'
    ? bar.getBoundingClientRect().height
    : 0;
}

function bringIntoView(el: Element | null, cardHeight: number) {
  if (!el) return;
  // Targets inside the sticky bar are always in view.
  if (el.closest('.top')) return;
  const r = el.getBoundingClientRect();
  const inset = stickyInset();
  const room = window.innerHeight - inset - cardHeight - GAP * 3;
  const offset =
    inset + (r.height + PAD * 2 <= room ? GAP + PAD + (room - r.height - PAD * 2) / 2 : GAP + PAD);
  window.scrollTo({ top: Math.max(0, window.scrollY + r.top - offset), behavior: 'instant' });
}

/**
 * A step-by-step tour: dims the page, spotlights one part at a time and explains it.
 * "Next" is at the bottom of the card, "Skip tutorial" at the top; Escape also skips.
 * The page is held still while the tour is open, so everything stays locked in place.
 */
export function Tutorial(props: { onClose: () => void; steps?: TutorialStep[] }) {
  const steps = props.steps ?? TUTORIAL_STEPS;
  const [index, setIndex] = useState(0);
  const [view, setView] = useState({ rect: centerRect(), cardHeight: CARD_FALLBACK });
  const { rect, cardHeight } = view;
  const cardRef = useRef<HTMLDivElement>(null);
  const titleId = useId();
  const bodyId = useId();
  const step = steps[index]!;
  const last = index === steps.length - 1;

  // Hold the page still while the tour is open (the scrollbar gutter stays, so nothing shifts).
  useEffect(() => {
    const root = document.documentElement;
    const previous = root.style.overflow;
    root.style.overflow = 'hidden';
    return () => {
      root.style.overflow = previous;
    };
  }, []);

  // Each step: jump to the target, then measure. Re-measure only if the window or the
  // target itself changes size, never while something is moving.
  useEffect(() => {
    const el = findTarget(step.target);
    const cardHeightNow = () => cardRef.current?.offsetHeight || CARD_FALLBACK;
    bringIntoView(el, cardHeightNow());
    const read = () => setView({ rect: measure(el), cardHeight: cardHeightNow() });
    let frame = requestAnimationFrame(read);
    const update = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(read);
    };
    window.addEventListener('resize', update);
    const observer =
      el && typeof ResizeObserver !== 'undefined' ? new ResizeObserver(update) : null;
    if (el) observer?.observe(el);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener('resize', update);
      observer?.disconnect();
    };
  }, [step.target]);

  useEffect(() => {
    cardRef.current?.focus({ preventScroll: true });
  }, [index]);

  const { onClose } = props;
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  // Modal: keep keyboard focus inside the card.
  function trapFocus(e: ReactKeyboardEvent<HTMLDivElement>) {
    if (e.key !== 'Tab' || !cardRef.current) return;
    const buttons = [...cardRef.current.querySelectorAll('button')];
    const first = buttons[0];
    const lastButton = buttons[buttons.length - 1];
    if (!first || !lastButton) return;
    const active = document.activeElement;
    if (e.shiftKey && (active === first || active === cardRef.current)) {
      e.preventDefault();
      lastButton.focus();
    } else if (!e.shiftKey && active === lastButton) {
      e.preventDefault();
      first.focus();
    }
  }

  // The card stays docked at the bottom; it only moves to the top when the target is at the
  // very end of the page and can't scroll up far enough to clear it.
  const empty = rect.width === 0;
  const clearsBottom = rect.top + rect.height <= window.innerHeight - cardHeight - GAP * 2;
  const clearsTop = rect.top >= cardHeight + GAP * 2;
  const placement = empty ? 'center' : !clearsBottom && clearsTop ? 'top' : 'bottom';

  return (
    <div className="tour">
      <div
        className={`tour-spotlight${empty ? ' tour-spotlight-empty' : ''}`}
        style={{
          transform: `translate3d(${rect.left}px, ${rect.top}px, 0)`,
          width: rect.width,
          height: rect.height,
        }}
        aria-hidden="true"
      />
      <div
        ref={cardRef}
        className={`tour-card tour-${placement}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={bodyId}
        tabIndex={-1}
        onKeyDown={trapFocus}
      >
        <div className="tour-head">
          <span className="tour-count">
            Step {index + 1} of {steps.length}
          </span>
          {!last && (
            <button type="button" className="link-button" onClick={props.onClose}>
              Skip tutorial
            </button>
          )}
        </div>
        {/* Keyed by step so the text fades in instead of swapping abruptly. */}
        <div className="tour-body" key={index}>
          <h2 id={titleId}>{step.title}</h2>
          <p id={bodyId}>{step.body}</p>
        </div>
        <div className="tour-dots" aria-hidden="true">
          {steps.map((s, i) => (
            <span key={s.title} className={i === index ? 'active' : undefined} />
          ))}
        </div>
        <div className="tour-actions">
          {index > 0 && (
            <button type="button" className="button secondary" onClick={() => setIndex(index - 1)}>
              Back
            </button>
          )}
          <button
            type="button"
            className="button primary"
            onClick={() => (last ? props.onClose() : setIndex(index + 1))}
          >
            {last ? 'Start using the Workshop' : 'Next'}
          </button>
        </div>
      </div>
    </div>
  );
}
