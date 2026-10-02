import { LIMITS } from '@promptgenius/api-contract';
import { useEffect, useState } from 'react';

type CopyState = 'idle' | 'copied' | 'failed';

/** Copies the prompt to the clipboard, confirming in place for a moment. */
function CopyButton({ text }: { text: string }) {
  const [state, setState] = useState<CopyState>('idle');

  useEffect(() => {
    if (state === 'idle') return;
    const t = window.setTimeout(() => setState('idle'), 2000);
    return () => window.clearTimeout(t);
  }, [state]);

  async function copy() {
    try {
      await navigator.clipboard.writeText(text);
      setState('copied');
    } catch {
      setState('failed');
    }
  }

  const label = state === 'copied' ? 'Copied' : state === 'failed' ? 'Couldn’t copy' : 'Copy';
  return (
    <button
      type="button"
      className="button secondary small copy-button"
      onClick={() => void copy()}
      disabled={!text}
    >
      <svg viewBox="0 0 24 24" aria-hidden="true">
        {state === 'copied' ? (
          <path d="m5 12.5 4.5 4.5L19 7.5" />
        ) : (
          <>
            <rect x="8.5" y="8.5" width="11" height="11" rx="2" />
            <path d="M15.5 8.5V6.5a2 2 0 0 0-2-2h-7a2 2 0 0 0-2 2v7a2 2 0 0 0 2 2h2" />
          </>
        )}
      </svg>
      {/* Announced to screen readers when it changes to Copied. */}
      <span aria-live="polite">{label}</span>
    </button>
  );
}

export function PromptEditor(props: {
  value: string;
  onChange: (value: string) => void;
  chars: number;
  words: number;
}) {
  return (
    <div className="editor" data-tour="prompt">
      <div className="editor-head">
        <label htmlFor="prompt" className="editor-label">
          Your prompt
        </label>
        <CopyButton text={props.value} />
      </div>
      <textarea
        id="prompt"
        value={props.value}
        onChange={(e) => props.onChange(e.target.value)}
        placeholder="Type or paste a prompt. Tokens, cost and a score update as you type."
        spellCheck
        maxLength={LIMITS.countChars}
        rows={12}
      />
      <div className="editor-footer">
        <span>
          {props.chars.toLocaleString()} characters · {props.words.toLocaleString()} words
        </span>
        {props.value && (
          <button type="button" className="link-button" onClick={() => props.onChange('')}>
            Clear
          </button>
        )}
      </div>
    </div>
  );
}
