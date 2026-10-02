import { fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { Root } from './Root';

function at(path: string) {
  window.history.replaceState(null, '', path);
  return render(<Root />);
}

afterEach(() => {
  window.history.replaceState(null, '', '/');
});

describe('Site', () => {
  it('opens on the home page with the three parts of Prompt IQ', () => {
    at('/');
    expect(screen.getByRole('heading', { level: 1 }).textContent).toMatch(/Better answers/);
    expect(screen.getByRole('heading', { name: 'Docs' })).toBeTruthy();
    expect(screen.getByRole('heading', { name: 'Prompt Workshop' })).toBeTruthy();
    expect(screen.getByRole('heading', { name: /^Prompt Studio/ })).toBeTruthy();
    expect(screen.getAllByText('Under construction').length).toBeGreaterThan(0);
  });

  it('never links to Prompt Studio while it is under construction', () => {
    at('/');
    const studio = screen.getByRole('heading', { name: /^Prompt Studio/ }).closest('article')!;
    expect(within(studio).queryByRole('link')).toBeNull();
    const nav = screen.getByRole('navigation', { name: 'Main' });
    expect(within(nav).queryByRole('link', { name: /Studio/ })).toBeNull();
  });

  it('opens the Workshop with a full page load, so the access check runs', () => {
    at('/');
    const links = screen.getAllByRole('link', { name: /Workshop/ });
    for (const link of links) expect(link.getAttribute('href')).toBe('/workshop');
  });

  it('navigates to the docs in place', () => {
    at('/');
    fireEvent.click(screen.getAllByRole('link', { name: 'Docs' })[0]!);
    expect(window.location.pathname).toBe('/docs');
    expect(screen.getByRole('heading', { level: 1, name: 'How Prompt IQ works' })).toBeTruthy();
    expect(document.title).toBe('Docs · Prompt IQ');
  });

  it('asks for the terms only when entering the Workshop', async () => {
    at('/');
    expect(screen.queryByText('Before you start')).toBeNull();
    at('/workshop');
    expect(
      await screen.findByRole('heading', { name: 'Before you start' }, { timeout: 3000 }),
    ).toBeTruthy();
  });

  it('shows Studio as under construction and unknown pages as not found', () => {
    const { unmount } = at('/studio');
    expect(screen.getByRole('heading', { level: 1 }).textContent).toMatch(/Coming soon/);
    unmount();
    at('/nope');
    expect(screen.getByRole('heading', { level: 1 }).textContent).toMatch(/doesn’t exist/);
  });

  it('shows the version in the footer', () => {
    at('/');
    expect(screen.getByText(`Version ${__APP_VERSION__}`)).toBeTruthy();
  });

  it('switches light/dark, applies it to the page and remembers it', () => {
    const { unmount } = at('/');
    const toggle = screen.getByRole('switch', { name: 'Dark mode' });
    // jsdom has no matchMedia, so the system default is light.
    expect(toggle.getAttribute('aria-checked')).toBe('false');
    fireEvent.click(toggle);
    expect(toggle.getAttribute('aria-checked')).toBe('true');
    expect(document.documentElement.dataset.theme).toBe('dark');
    unmount();

    at('/');
    const again = screen.getByRole('switch', { name: 'Dark mode' });
    expect(again.getAttribute('aria-checked')).toBe('true');
    fireEvent.click(again);
    expect(document.documentElement.dataset.theme).toBe('light');
    delete document.documentElement.dataset.theme;
  });
});
