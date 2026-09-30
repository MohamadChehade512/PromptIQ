import { useId } from 'react';

/**
 * "The AI can already see my project": for coding agents (Claude Code, Cursor, Copilot,
 * Codex) and Claude/ChatGPT Projects. The score stops asking for pasted code and checks
 * for what those tools need instead: where to look, what's wrong, how to verify.
 */
export function WorkspaceToggle(props: { value: boolean; onChange: (value: boolean) => void }) {
  const hintId = useId();
  return (
    <div className="workspace" data-tour="workspace">
      <label className="check">
        <input
          type="checkbox"
          role="switch"
          checked={props.value}
          onChange={(e) => props.onChange(e.target.checked)}
          aria-describedby={hintId}
        />
        <span>The AI can already see my project files</span>
      </label>
      <p className="hint" id={hintId}>
        Turn on for coding tools like Claude Code, Cursor, Copilot or Codex, or a Claude/ChatGPT
        Project. Referring to files it can read is fine; the score checks instead that you say where
        to look, what's wrong, and how to check the work.
      </p>
    </div>
  );
}
