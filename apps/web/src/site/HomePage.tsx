import { linkClick, useDocumentTitle } from '../lib/router';

/** The front door: what Prompt IQ is, and the way into each of its three parts. */
export function HomePage() {
  useDocumentTitle('Prompt IQ · Better prompts, before you send them');
  return (
    <main className="page home">
      <section className="hero">
        <p className="eyebrow">Private beta</p>
        <h1 className="display">Better prompts, before you hit send.</h1>
        <p className="lede">
          Prompt IQ reads your prompt the way Claude, ChatGPT and Gemini will. It scores it, shows
          what it will cost in tokens and context, and tells you exactly what to change, based on
          each vendor’s own published guidance.
        </p>
        <div className="hero-actions">
          <a className="button primary" href="/workshop">
            Open Prompt Workshop
          </a>
          <a className="button secondary" href="/docs" onClick={linkClick('/docs')}>
            How it works
          </a>
        </div>
        <p className="hint">The Workshop needs an access code during the beta.</p>
      </section>

      <section className="products" aria-labelledby="products-title">
        <h2 id="products-title" className="section-title">
          Three ways in
        </h2>
        <div className="product-grid">
          <article className="product">
            <p className="product-kicker">Learn</p>
            <h3>Docs</h3>
            <p>
              How prompts are scored, how token and cost estimates are made, what happens to your
              files, and how the whole system fits together.
            </p>
            <a className="product-link" href="/docs" onClick={linkClick('/docs')}>
              Read the docs <span aria-hidden="true">→</span>
            </a>
          </article>

          <article className="product product-main">
            <p className="product-kicker">Build</p>
            <h3>Prompt Workshop</h3>
            <p>
              Write or paste a prompt and watch it improve as you type: a score out of 100, specific
              suggestions, file context, and tokens, context and cost for each platform.
            </p>
            <a className="product-link" href="/workshop">
              Open the Workshop <span aria-hidden="true">→</span>
            </a>
            <span className="product-note">Access code required</span>
          </article>

          <article className="product product-soon" aria-describedby="studio-status">
            <p className="product-kicker">
              Speak <span className="soon-tag">Under construction</span>
            </p>
            <h3>Prompt Studio</h3>
            <p>
              Talk through what you need. Studio will turn what you say into an optimized,
              ready-to-send prompt, with no typing required.
            </p>
            <span className="product-link is-disabled" id="studio-status" aria-disabled="true">
              Not available yet: still being built
            </span>
          </article>
        </div>
      </section>

      <section className="steps" aria-labelledby="steps-title">
        <h2 id="steps-title" className="section-title">
          How the Workshop works
        </h2>
        <ol className="step-list">
          <li>
            <span className="step-num">1</span>
            <h3>Write</h3>
            <p>Pick the platform and what the prompt is for, then type or paste it.</p>
          </li>
          <li>
            <span className="step-num">2</span>
            <h3>Score</h3>
            <p>Get a score with the few changes that matter most, each linked to its source.</p>
          </li>
          <li>
            <span className="step-num">3</span>
            <h3>Send</h3>
            <p>Copy the improved prompt into Claude, ChatGPT or Gemini, knowing what it’ll use.</p>
          </li>
        </ol>
      </section>
    </main>
  );
}
