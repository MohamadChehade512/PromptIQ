import { useEffect, useRef, useState } from 'react';
import { useInView } from '../../lib/motion';
import { AREA_LABELS, RETRY, TIGHT, TOKEN_PIECES, VAGUE, usd, type Area } from './demoData';
import { Counter, MarkedPrompt, ScoreRing } from './parts';

const STEPS = [
  {
    title: 'Reads it the way the model will',
    body: 'Prompt IQ finds the words that cost tokens without helping (filler and politeness) and the ones that leave the model guessing.',
  },
  {
    title: 'Scores seven areas',
    body: 'Clarity, context, output, structure, examples, token economy and platform fit, weighted for what the prompt is for and checked against each vendor’s guidance.',
  },
  {
    title: 'Predicts what it will cost',
    body: 'Tokens for the prompt, the likely answer and the model’s hidden thinking, and how much of the context window they fill. A vague prompt invites a long, unfocused answer.',
  },
  {
    title: 'Ranks the fixes by impact',
    body: 'Each fix shows the points it’s worth and whether it saves tokens, so the biggest wins come first.',
  },
] as const;

/**
 * "How Prompt IQ reads a prompt": the example stays pinned while the steps scroll past, and
 * each step lights up the matching part of the analysis.
 */
export function ReadingSteps() {
  const [active, setActive] = useState(0);
  const stepRefs = useRef<(HTMLLIElement | null)[]>([]);

  useEffect(() => {
    if (typeof IntersectionObserver === 'undefined') return;
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries)
          if (e.isIntersecting) setActive(Number((e.target as HTMLElement).dataset.step));
      },
      { rootMargin: '-45% 0px -45% 0px' },
    );
    stepRefs.current.forEach((el) => el && io.observe(el));
    return () => io.disconnect();
  }, []);

  const total = VAGUE.promptTokens + VAGUE.answerTokens + VAGUE.thinkingTokens;
  const share = (n: number) => `${(n / total) * 100}%`;

  return (
    <section className="reading" aria-labelledby="reading-title">
      <div className="section-head">
        <p className="eyebrow">The technology</p>
        <h2 id="reading-title" className="section-title">
          How Prompt IQ reads a prompt
        </h2>
      </div>
      <div className="reading-grid">
        <div className="reading-visual" data-step={active} aria-hidden="true">
          <div className="panel">
            <div className="panel-head">
              <span>Your prompt</span>
              <span className="panel-tokens">{VAGUE.promptTokens} tokens</span>
            </div>
            <MarkedPrompt marked={active === 0} />

            <div className="layer layer-areas" data-on={active === 1 || undefined}>
              <div className="layer-head">
                <ScoreRing score={active >= 1 ? VAGUE.score : 0} size={64} />
                <span>{VAGUE.band}: the model would have to guess</span>
              </div>
              <ul className="areas">
                {(Object.keys(AREA_LABELS) as Area[]).map((k) => (
                  <li key={k}>
                    <span>{AREA_LABELS[k]}</span>
                    <span className="area-bar">
                      <span style={{ width: active >= 1 ? `${VAGUE.areas[k]}%` : 0 }} />
                    </span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="layer layer-cost" data-on={active === 2 || undefined}>
              <div className="stack" data-grow={active >= 2 || undefined}>
                <span className="seg seg-prompt" style={{ width: share(VAGUE.promptTokens) }} />
                <span className="seg seg-answer" style={{ width: share(VAGUE.answerTokens) }} />
                <span className="seg seg-thinking" style={{ width: share(VAGUE.thinkingTokens) }} />
              </div>
              <ul className="stack-legend">
                <li>
                  <i className="seg-prompt" /> Prompt {VAGUE.promptTokens}
                </li>
                <li>
                  <i className="seg-answer" /> Answer ≈{VAGUE.answerTokens}
                </li>
                <li>
                  <i className="seg-thinking" /> Thinking ≈{VAGUE.thinkingTokens}
                </li>
              </ul>
              <p className="layer-note">
                The prompt is 3% of the call. The rest is the answer and thinking it invites.
              </p>
            </div>

            <div className="layer layer-fixes" data-on={active === 3 || undefined}>
              <ul className="demo-fixes" data-on>
                {VAGUE.fixes.map((f, i) => (
                  <li key={f.title} style={{ transitionDelay: `${i * 90}ms` }}>
                    <span className="fix-points">+{f.points}</span>
                    {f.title}
                    {f.saves && <span className="saves-tag">Saves tokens</span>}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        <ol className="reading-steps">
          {STEPS.map((s, i) => (
            <li
              key={s.title}
              ref={(el) => {
                stepRefs.current[i] = el;
              }}
              data-step={i}
              className={i === active ? 'active' : undefined}
            >
              <span className="step-num">{i + 1}</span>
              <h3>{s.title}</h3>
              <p>{s.body}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

/** Getting it right the first time vs. paying for retries that resend the whole chat. */
export function RetryCost() {
  const [ref, seen] = useInView<HTMLDivElement>(0.3);
  const max = RETRY.vagueTotal;
  return (
    <section className="retry" aria-labelledby="retry-title">
      <div className="section-head">
        <p className="eyebrow">Why it matters</p>
        <h2 id="retry-title" className="section-title">
          The expensive part is the retry
        </h2>
        <p className="section-lede">
          When an answer misses, you rephrase, and every follow-up resends the whole conversation so
          far. A prompt that’s right the first time skips all of it.
        </p>
      </div>
      <div ref={ref} className="retry-chart" data-in={seen || undefined}>
        <div className="retry-row">
          <div className="retry-label">
            <strong>Vague prompt</strong>
            <span>3 tries to get it right</span>
          </div>
          <div className="retry-track">
            {RETRY.vagueAttempts.map((t, i) => (
              <span
                key={i}
                className="retry-seg retry-bad"
                style={{ width: `${(t / max) * 100}%`, transitionDelay: `${i * 380}ms` }}
              >
                <em>Try {i + 1}</em>
              </span>
            ))}
          </div>
          <div className="retry-total">
            <span className="retry-num">
              <strong>{seen ? <Counter value={RETRY.vagueTotal} ms={1400} /> : 0}</strong> tokens
            </span>
            <span>
              {seen ? <Counter value={RETRY.vagueCost} format={usd(3)} ms={1400} /> : '$0'}
            </span>
          </div>
        </div>
        <div className="retry-row">
          <div className="retry-label">
            <strong>Clear prompt</strong>
            <span>Right the first time</span>
          </div>
          <div className="retry-track">
            <span
              className="retry-seg retry-good"
              style={{ width: `${(RETRY.tightTotal / max) * 100}%`, transitionDelay: '200ms' }}
            />
          </div>
          <div className="retry-total">
            <span className="retry-num">
              <strong>{seen ? <Counter value={RETRY.tightTotal} ms={900} /> : 0}</strong> tokens
            </span>
            <span>
              {seen ? <Counter value={RETRY.tightCost} format={usd(3)} ms={900} /> : '$0'}
            </span>
          </div>
        </div>
        <p className="retry-callout" data-in={seen || undefined}>
          <strong>{Math.round(RETRY.vagueTotal / RETRY.tightTotal)}× fewer tokens</strong> to get
          the answer you wanted.
        </p>
        <p className="hint">
          Illustrative: the vague example needing two follow-ups, using Prompt IQ’s estimates at
          Claude Sonnet 5 API prices. The Workshop shows the cost of a retry for your own prompt.
        </p>
      </div>
    </section>
  );
}

/** Every model splits text into tokens differently, so Prompt IQ counts per platform. */
export function TokenizerView() {
  const [ref, seen] = useInView<HTMLDivElement>(0.3);
  const t = TIGHT.platformTokens;
  return (
    <section className="tokens" aria-labelledby="tokens-title">
      <div className="section-head">
        <p className="eyebrow">Counted per platform</p>
        <h2 id="tokens-title" className="section-title">
          Every model counts differently
        </h2>
        <p className="section-lede">
          Models read text in tokens: pieces of words. Each vendor splits text its own way, so the
          same prompt costs a different amount on each. Prompt IQ counts it the way each platform
          does.
        </p>
      </div>
      <div ref={ref} className="tokens-view" data-in={seen || undefined}>
        <p className="chips" aria-label="The start of the clear prompt, split into ChatGPT tokens">
          {TOKEN_PIECES.map((piece, i) => (
            <span key={i} className="chip" style={{ animationDelay: `${i * 55}ms` }}>
              {piece.replace(/ /g, '·')}
            </span>
          ))}
          <span className="chip chip-more">…</span>
        </p>
        <dl className="platform-counts">
          <div>
            <dt>Claude</dt>
            <dd>
              ≈{seen ? <Counter value={t.claude} /> : 0} <span>tokens · estimate</span>
            </dd>
          </div>
          <div>
            <dt>ChatGPT</dt>
            <dd>
              {seen ? <Counter value={t.chatgpt} /> : 0} <span>tokens · exact</span>
            </dd>
          </div>
          <div>
            <dt>Gemini</dt>
            <dd>
              ≈{seen ? <Counter value={t.gemini} /> : 0} <span>tokens · estimate</span>
            </dd>
          </div>
        </dl>
      </div>
    </section>
  );
}
