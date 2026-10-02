import { callCost, type AnalysisResult } from '@promptgenius/core';
import type { ExactStatus } from '../hooks/useExactTokenCount';
import { formatPct, formatRange, formatTokens, formatUsd } from '../lib/format';
import { SessionChart } from './SessionChart';
import { SourceLinks } from './SourceLinks';
import { TokenBadge } from './TokenBadge';

function ContextBar({ a }: { a: AnalysisResult }) {
  const { usedPct, windowTokens, windowLabel, windowVerified } = a.context;
  const mid = Math.min(100, usedPct.mid);
  const high = Math.min(100, usedPct.high);
  return (
    <div className="context">
      <div className="meter-row">
        <span className="meter-label">Context window</span>
        <span className="meter-value">
          {formatPct(usedPct.mid)} <span className="muted">of {formatTokens(windowTokens)}</span>
        </span>
      </div>
      <div
        className="bar"
        role="meter"
        aria-label="Context window used"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(mid)}
      >
        <div className="bar-range" style={{ width: `${high}%` }} />
        <div className="bar-fill" style={{ width: `${mid}%` }} />
      </div>
      <p className="hint">
        Prompt{a.fileTokens > 0 ? ' + files' : ''}
        {a.historyTokens > 0 ? ' + conversation' : ''} + expected answer
        {a.reasoning ? ' + thinking' : ''} vs the {windowLabel} window
        {windowVerified ? '' : ' (window size unverified)'}.
        {usedPct.high > 80 &&
          ' Close to full: long chats will start dropping or summarizing early turns.'}
      </p>
    </div>
  );
}

/** A typical "that's not what I meant…" follow-up. */
const FOLLOW_UP_TOKENS = 25;

/**
 * What it costs if this prompt misses and you rephrase: the follow-up resends this message and
 * its answer, then gets a new answer (and thinking). Worked out from this message's own numbers.
 */
function RetryCost({ a, advanced }: { a: AnalysisResult; advanced: boolean }) {
  const out = a.output;
  const thinking = a.reasoning ? out.thinking.mid : 0;
  const thisCall = a.inputTokens + out.visible.mid + thinking;
  const retryInput = a.inputTokens + out.visible.mid + FOLLOW_UP_TOKENS;
  const retryTokens = retryInput + out.visible.mid + thinking;
  const retryUsd = callCost(a.model, {
    inputTokens: retryInput,
    outputTokens: out.visible.mid,
    thinkingTokens: thinking,
  }).total;
  const retryTypical = thisCall > 0 ? (a.typicalMessages * retryTokens) / thisCall : 0;
  return (
    <div className="retry-cost">
      <div className="retry-cost-head">
        <span className="retry-cost-label">Cost of a retry</span>
        <span className="retry-cost-value">
          ≈ {formatTokens(retryTokens)} <span className="unit">tokens</span>
          {advanced ? (
            <span className="unit"> · {formatUsd(retryUsd)}</span>
          ) : (
            <span className="unit">
              {' '}
              · ≈ {retryTypical < 10 ? retryTypical.toFixed(1) : Math.round(retryTypical)} typical
              messages
            </span>
          )}
        </span>
      </div>
      <p className="hint">
        If the answer misses and you rephrase, the follow-up resends this message and its answer.
        Fixing the suggestions first is the cheapest way to avoid it.
      </p>
    </div>
  );
}

export function UsagePanel(props: {
  a: AnalysisResult;
  advanced: boolean;
  exactStatus: ExactStatus;
  lastVerified: string;
}) {
  const { a, advanced } = props;
  const out = a.output;
  const b = a.cost.breakdown;

  return (
    <section className="card usage" aria-labelledby="usage-title" data-tour="usage">
      <h2 id="usage-title">Usage</h2>
      {a.warnings.map((w) => (
        <div key={w.id} className={`warning warning-${w.id}`} role="note">
          <p>
            <strong>{w.id === 'context-rot' ? 'Long conversation.' : 'Context window.'}</strong>{' '}
            {w.message}
          </p>
          <SourceLinks sources={w.sources} />
        </div>
      ))}
      <dl className="stats">
        <div>
          <dt>Prompt tokens</dt>
          <dd>
            {a.promptTokens.tokens.toLocaleString()}{' '}
            <TokenBadge count={a.promptTokens} status={props.exactStatus} />
          </dd>
        </div>
        {a.fileTokens > 0 && (
          <div>
            <dt>
              Attached file{a.files.length === 1 ? '' : 's'} ({a.files.length})
            </dt>
            <dd>
              {a.fileTokens.toLocaleString()} <span className="unit">tokens</span>
            </dd>
          </div>
        )}
        {a.historyTokens > 0 && (
          <div>
            <dt>Earlier conversation (resent)</dt>
            <dd>
              {a.historyTokens.toLocaleString()} <span className="unit">tokens</span>
            </dd>
          </div>
        )}
        <div>
          <dt>Expected answer</dt>
          <dd>
            {formatRange(out.visible.low, out.visible.high)} <span className="unit">tokens</span>
          </dd>
        </div>
        {a.reasoning && (
          <div>
            <dt>Thinking (billed as output)</dt>
            <dd>
              {formatRange(out.thinking.low, out.thinking.high)}{' '}
              <span className="unit">tokens</span>
            </dd>
          </div>
        )}
        <div>
          {advanced ? (
            <>
              <dt>Cost per call</dt>
              <dd>
                {formatUsd(a.cost.mid)}{' '}
                <span className="unit">({formatRange(a.cost.low, a.cost.high, formatUsd)})</span>
              </dd>
            </>
          ) : (
            <>
              <dt>Relative usage</dt>
              <dd>
                ≈{' '}
                {a.typicalMessages < 10
                  ? a.typicalMessages.toFixed(1)
                  : Math.round(a.typicalMessages)}{' '}
                <span className="unit">typical messages</span>
              </dd>
            </>
          )}
        </div>
      </dl>
      <p className="hint">{out.detail}</p>
      {a.promptTokens.tokens > 0 && <RetryCost a={a} advanced={advanced} />}
      {a.workspace && (
        <p className="hint">
          Coding tools and Projects also read your files as they work, so real usage will be higher
          than this message alone. Pointing at the right files keeps it down.
        </p>
      )}

      <ContextBar a={a} />

      {advanced && (
        <>
          <table className="breakdown">
            <caption>Cost breakdown for one call on {a.model.label} (most likely case)</caption>
            <tbody>
              <tr>
                <th scope="row">
                  Input ({a.inputTokens.toLocaleString()} tokens
                  {a.historyTokens > 0 || a.fixedTokens > 0 || a.fileTokens > 0
                    ? `: ${[
                        `prompt ${a.promptTokens.tokens.toLocaleString()}`,
                        a.fileTokens > 0 && `files ${a.fileTokens.toLocaleString()}`,
                        a.fixedTokens > 0 && `system/attachments ${a.fixedTokens.toLocaleString()}`,
                        a.historyTokens > 0 && `conversation ${a.historyTokens.toLocaleString()}`,
                      ]
                        .filter(Boolean)
                        .join(', ')}`
                    : ''}
                  )
                </th>
                <td>{formatUsd(b.input)}</td>
              </tr>
              <tr>
                <th scope="row">Output ({out.visible.mid.toLocaleString()} tokens)</th>
                <td>{formatUsd(b.output)}</td>
              </tr>
              {a.reasoning && (
                <tr>
                  <th scope="row">Thinking ({out.thinking.mid.toLocaleString()} tokens)</th>
                  <td>{formatUsd(b.thinking)}</td>
                </tr>
              )}
              <tr className="total">
                <th scope="row">Total</th>
                <td>{formatUsd(b.total)}</td>
              </tr>
              {a.cost.cacheApplies && (
                <tr>
                  <th scope="row">With prompt caching (earlier conversation read from cache)</th>
                  <td>{formatUsd(a.cost.midWithCache)}</td>
                </tr>
              )}
            </tbody>
          </table>
          {b.longContext && (
            <p className="hint">
              Input is over the long-context threshold, so the whole request is billed at
              long-context rates.
            </p>
          )}
          {a.session && <SessionChart session={a.session} />}
          <p className="hint">
            Prices as of {props.lastVerified} (per 1M tokens: ${a.model.pricing.input} in / $
            {a.model.pricing.output} out).
            {a.model.notes ? ` ${a.model.notes}` : ''}
          </p>
        </>
      )}
      {!advanced && (
        <p className="hint">
          Chat apps don't bill per token; they use opaque usage limits. This compares your message
          {a.historyTokens > 0 || a.fileTokens > 0
            ? ` (including ${[a.fileTokens > 0 && 'attached files', a.historyTokens > 0 && 'the earlier conversation it resends'].filter(Boolean).join(' and ')})`
            : ''}{' '}
          with a typical message (about 500 tokens in, 700 out) on the same model.
        </p>
      )}
    </section>
  );
}
