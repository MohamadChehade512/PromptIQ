import { linkClick, useDocumentTitle } from '../lib/router';

/** Prompt Studio isn't built yet; this only answers someone who types the address. */
export function StudioPage() {
  useDocumentTitle('Prompt Studio · Prompt IQ');
  return (
    <main className="page notice-page">
      <p className="eyebrow">
        Prompt Studio <span className="soon-tag">Under construction</span>
      </p>
      <h1 className="display">Speak your prompt. Coming soon.</h1>
      <p className="lede">
        Prompt Studio will turn what you say into an optimized prompt. It’s still being built and
        isn’t available yet.
      </p>
      <a className="button secondary" href="/" onClick={linkClick('/')}>
        Back to Prompt IQ
      </a>
    </main>
  );
}

export function NotFoundPage() {
  useDocumentTitle('Page not found · Prompt IQ');
  return (
    <main className="page notice-page">
      <p className="eyebrow">404</p>
      <h1 className="display">This page doesn’t exist.</h1>
      <a className="button secondary" href="/" onClick={linkClick('/')}>
        Back to Prompt IQ
      </a>
    </main>
  );
}
