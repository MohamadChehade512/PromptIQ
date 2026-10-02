import { useId } from 'react';

const P_SHAPE =
  'M507 268H700a201 201 0 0 1 0 402H592q-47 0-47 47v70H457q-60 0-60-60V378q0-110 110-110Z';
const SPARK =
  'M885 207C893 250 905 262 952 272 905 282 893 294 885 337 877 294 865 282 818 272 865 262 877 250 885 207Z';

/**
 * The Prompt IQ mark: a P-shaped speech bubble (the prompt) with rising bars (the score)
 * and a spark. Same artwork as public/logo-mark.svg, traced from docs/brand/prompt-iq-logo.png.
 * Gradient ids are unique per instance so several logos can share a page.
 */
export function Logo({ size = 32, title }: { size?: number; title?: string }) {
  const id = useId();
  const g = (name: string) => `${id}-${name}`;
  return (
    <svg
      className="logo"
      viewBox="380 190 600 610"
      width={size}
      height={size}
      role={title ? 'img' : undefined}
      aria-label={title}
      aria-hidden={title ? undefined : true}
    >
      <defs>
        <linearGradient
          id={g('p')}
          x1="397"
          y1="268"
          x2="893"
          y2="700"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0" stopColor="#01ccff" />
          <stop offset="0.35" stopColor="#2782fe" />
          <stop offset="0.7" stopColor="#834ffc" />
          <stop offset="1" stopColor="#ac38fd" />
        </linearGradient>
        <linearGradient
          id={g('low')}
          x1="397"
          y1="560"
          x2="720"
          y2="787"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0" stopColor="#2125d9" />
          <stop offset="0.55" stopColor="#3c26ed" />
          <stop offset="1" stopColor="#6a27fa" />
        </linearGradient>
        <linearGradient
          id={g('fold')}
          x1="420"
          y1="380"
          x2="520"
          y2="787"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0" stopColor="#001776" />
          <stop offset="0.6" stopColor="#0029bc" />
          <stop offset="1" stopColor="#011986" />
        </linearGradient>
        <linearGradient
          id={g('fade')}
          x1="0"
          y1="500"
          x2="0"
          y2="720"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0" stopColor="#fff" stopOpacity="0" />
          <stop offset="1" stopColor="#fff" stopOpacity="1" />
        </linearGradient>
        <mask id={g('mask')} maskUnits="userSpaceOnUse" x="380" y="190" width="600" height="610">
          <rect x="380" y="190" width="600" height="610" fill={`url(#${g('fade')})`} />
        </mask>
        <linearGradient
          id={g('spark')}
          x1="818"
          y1="207"
          x2="952"
          y2="337"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0" stopColor="#5530ef" />
          <stop offset="1" stopColor="#6a3cf5" />
        </linearGradient>
      </defs>
      <path fill={`url(#${g('p')})`} d={P_SHAPE} />
      <path fill={`url(#${g('low')})`} mask={`url(#${g('mask')})`} d={P_SHAPE} />
      <path
        fill={`url(#${g('fold')})`}
        d="M397 505C412 440 455 385 540 352L503 389V677L545 717V787H503C472 722 436 668 397 622Z"
      />
      <path fill="#fff" d="M540 352H700a117 117 0 0 1 0 235H594l-91 90V389q0-37 37-37Z" />
      <rect x="568" y="483" width="42" height="66" rx="11" fill="#009ffd" />
      <rect x="633" y="445" width="42" height="104" rx="11" fill="#065ff7" />
      <rect x="698" y="405" width="42" height="144" rx="11" fill="#662ff9" />
      <path fill={`url(#${g('spark')})`} d={SPARK} />
    </svg>
  );
}

/** Mark + "Prompt IQ" wordmark, with "IQ" in the brand gradient, and a Beta badge. */
export function Wordmark({ size = 32 }: { size?: number }) {
  return (
    <span className="wordmark">
      <Logo size={size} />
      <span className="wordmark-text">
        Prompt <span className="wordmark-accent">IQ</span>
      </span>
      <span className="beta-badge">Beta</span>
    </span>
  );
}
