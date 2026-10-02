import { Component, Suspense, lazy, type ReactNode } from 'react';
import { usePath } from '../lib/router';
import { DocsPage } from './DocsPage';
import { HomePage } from './HomePage';
import { SiteFooter, SiteHeader } from './SiteHeader';
import { NotFoundPage, StudioPage } from './SimplePages';

const WorkshopPage = lazy(() => import('./WorkshopPage'));

function Loading() {
  return (
    <div className="page-loading" role="status">
      Loading Prompt Workshop…
    </div>
  );
}

/** If the Workshop's code can't load (offline, or the access check), offer a clean retry. */
class WorkshopBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  override state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  override render() {
    if (!this.state.failed) return this.props.children;
    return (
      <main className="page notice-page">
        <h1 className="display">The Workshop didn’t load.</h1>
        <p className="lede">Check your connection, then try again.</p>
        <a className="button primary" href="/workshop">
          Try again
        </a>
      </main>
    );
  }
}

function page(path: string) {
  switch (path) {
    case '/':
      return <HomePage />;
    case '/docs':
      return <DocsPage />;
    case '/workshop':
      return (
        <WorkshopBoundary>
          <Suspense fallback={<Loading />}>
            <WorkshopPage />
          </Suspense>
        </WorkshopBoundary>
      );
    case '/studio':
      return <StudioPage />;
    default:
      return <NotFoundPage />;
  }
}

export function Root() {
  const path = usePath();
  return (
    <div className="site">
      <SiteHeader path={path} />
      {page(path)}
      <SiteFooter />
    </div>
  );
}
