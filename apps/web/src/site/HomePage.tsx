import { linkClick, useDocumentTitle } from '../lib/router';
import { HeroDemo } from './home/HeroDemo';
import { Reveal } from './home/parts';
import { ReadingSteps, RetryCost, TokenizerView } from './home/Sections';

/** The front door: what Prompt IQ does (shown working), and the way into each of its parts. */
export function HomePage() {
  useDocumentTitle('Prompt IQ · Better answers for fewer tokens');
  return (
    <main className="home">
      <section className="hero">
        <div className="hero-copy">
          <p className="eyebrow">
            <span className="dot" aria-hidden="true" /> Private beta
          </p>
          <h1 className="display">Better answers. Fewer tokens.</h1>
          <p className="lede">
            Prompt IQ checks your prompt before you send it to Claude, ChatGPT or Gemini. It shows
            what’s missing, what’s wasting tokens, and what the answer will cost, so you get it
            right the first time.
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
        </div>
        <HeroDemo />
      </section>

      <div className="home-sections">
        <ReadingSteps />

        <Reveal>
          <RetryCost />
        </Reveal>

        <Reveal>
          <TokenizerView />
        </Reveal>

        <Reveal as="section" className="products">
          <div className="section-head">
            <p className="eyebrow">Prompt IQ</p>
            <h2 className="section-title">Three ways in</h2>
          </div>
          <div className="product-grid">
            <article className="product">
              <h3>Docs</h3>
              <p>
                How prompts are scored, how token and cost estimates are made, and what happens to
                your data.
              </p>
              <a className="product-link" href="/docs" onClick={linkClick('/docs')}>
                Read the docs <span aria-hidden="true">→</span>
              </a>
            </article>

            <article className="product product-main">
              <h3>Prompt Workshop</h3>
              <p>
                Score and refine a prompt as you type, with files, project context, and tokens,
                context and cost for each platform.
              </p>
              <a className="product-link" href="/workshop">
                Open the Workshop <span aria-hidden="true">→</span>
              </a>
              <span className="product-note">Access code required</span>
            </article>

            <article className="product product-soon" aria-describedby="studio-status">
              <h3>
                Prompt Studio <span className="soon-tag">Under construction</span>
              </h3>
              <p>
                Talk through what you need, and Studio will turn it into an optimized, ready-to-send
                prompt.
              </p>
              <span className="product-link is-disabled" id="studio-status" aria-disabled="true">
                Not available yet
              </span>
            </article>
          </div>
        </Reveal>

        <Reveal as="section" className="cta">
          <h2 className="section-title">Stop paying for retries.</h2>
          <p className="section-lede">Check your next prompt before you send it.</p>
          <a className="button primary" href="/workshop">
            Open Prompt Workshop
          </a>
        </Reveal>
      </div>
    </main>
  );
}
