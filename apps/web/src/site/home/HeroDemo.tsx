import { useEffect, useState } from 'react';
import { useReducedMotion } from '../../lib/motion';
import { TIGHT, VAGUE, usd } from './demoData';
import { Counter, MarkedPrompt, ScoreRing } from './parts';

type Phase = 'before' | 'flag' | 'after';
const NEXT: Record<Phase, Phase> = { before: 'flag', flag: 'after', after: 'before' };
const HOLD: Record<Phase, number> = { before: 2200, flag: 3200, after: 5200 };

const perCall = (p: { promptTokens: number; answerTokens: number; thinkingTokens: number }) =>
  p.promptTokens + p.answerTokens + p.thinkingTokens;

/**
 * The hero's live example: a vague prompt is flagged, rewritten, and re-scored, with tokens and
 * cost per call falling as the score rises. Plays on its own (pausable), or step through it with
 * Before / After. With reduced motion it doesn't auto-play.
 */
export function HeroDemo() {
  const reduce = useReducedMotion();
  const [phase, setPhase] = useState<Phase>('before');
  const [playing, setPlaying] = useState(!reduce);

  useEffect(() => {
    if (!playing || reduce) return;
    const t = window.setTimeout(() => setPhase((p) => NEXT[p]), HOLD[phase]);
    return () => window.clearTimeout(t);
  }, [phase, playing, reduce]);

  const after = phase === 'after';
  const p = after ? TIGHT : VAGUE;
  const choose = (next: Phase) => {
    setPlaying(false);
    setPhase(next);
  };

  return (
    <figure className="demo" aria-label="Example: a vague prompt improved by Prompt IQ">
      <div className="demo-bar">
        <span className="demo-meta">Example · Claude · Writing</span>
        <div className="demo-controls">
          <div className="pill-toggle" role="group" aria-label="Show">
            <button type="button" aria-pressed={!after} onClick={() => choose('flag')}>
              Before
            </button>
            <button type="button" aria-pressed={after} onClick={() => choose('after')}>
              After
            </button>
          </div>
          {!reduce && (
            <button
              type="button"
              className="icon-button"
              onClick={() => setPlaying((v) => !v)}
              aria-label={playing ? 'Pause the example' : 'Play the example'}
            >
              <svg viewBox="0 0 24 24" aria-hidden="true">
                {playing ? <path d="M8 5v14M16 5v14" /> : <path d="M7 5l12 7-12 7z" />}
              </svg>
            </button>
          )}
        </div>
      </div>

      <div className="demo-body">
        <div className="demo-prompt" data-phase={phase}>
          {after ? (
            <p className="demo-text demo-text-after" key="after">
              {TIGHT.text}
            </p>
          ) : (
            <MarkedPrompt marked={phase === 'flag'} />
          )}
          <ul
            className="demo-fixes"
            data-on={phase === 'flag' || undefined}
            aria-hidden={!(phase === 'flag')}
          >
            {VAGUE.fixes.map((f, i) => (
              <li key={f.title} style={{ transitionDelay: `${120 + i * 110}ms` }}>
                <span className="fix-points">+{f.points}</span>
                {f.title}
                {f.saves && <span className="saves-tag">Saves tokens</span>}
              </li>
            ))}
          </ul>
        </div>

        <div className="demo-side">
          <ScoreRing score={p.score} />
          <p className={`demo-band band-${after ? 'good' : 'bad'}`}>{p.band}</p>
          <dl className="demo-stats">
            <div>
              <dt>Tokens per call</dt>
              <dd>
                <Counter value={perCall(p)} />
              </dd>
            </div>
            <div>
              <dt>Cost per call</dt>
              <dd>
                <Counter value={p.costPerCall} format={usd(4)} />
              </dd>
            </div>
          </dl>
          <p className="demo-delta" data-on={after || undefined}>
            {Math.round(perCall(VAGUE) / perCall(TIGHT))}× fewer tokens per answer
          </p>
        </div>
      </div>
      <figcaption className="demo-caption">
        Real Prompt IQ results for these two prompts, at Claude Sonnet 5 API prices. Tokens per call
        = prompt + expected answer + thinking.
      </figcaption>
    </figure>
  );
}
