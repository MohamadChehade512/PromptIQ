import { useEffect, useSyncExternalStore, type MouseEvent } from 'react';

/**
 * A tiny pathname router: the site has a handful of fixed pages, so a router library would be
 * more than it needs. Pages link with `navigate` (history.pushState); the Workshop is always
 * opened with a full page load instead, so the access-code gate on the server sees the request.
 */
const listeners = new Set<() => void>();
const notify = () => listeners.forEach((l) => l());

function subscribe(listener: () => void) {
  listeners.add(listener);
  window.addEventListener('popstate', listener);
  return () => {
    listeners.delete(listener);
    window.removeEventListener('popstate', listener);
  };
}

/** The current path without a trailing slash ("/" stays "/"). */
export function currentPath(): string {
  const p = window.location.pathname.replace(/\/+$/, '');
  return p === '' ? '/' : p;
}

export function usePath(): string {
  return useSyncExternalStore(subscribe, currentPath, () => '/');
}

export function navigate(to: string) {
  if (to === currentPath()) return;
  window.history.pushState(null, '', to);
  window.scrollTo({ top: 0, behavior: 'instant' });
  notify();
}

/** onClick for in-site links: plain clicks navigate in place; modified clicks open normally. */
export function linkClick(to: string) {
  return (e: MouseEvent<HTMLAnchorElement>) => {
    if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey)
      return;
    e.preventDefault();
    navigate(to);
  };
}

export function useDocumentTitle(title: string) {
  useEffect(() => {
    document.title = title;
  }, [title]);
}
