import { cleanup } from '@testing-library/react';
import { afterEach, vi } from 'vitest';

// jsdom has no <dialog> modal support.
if (!('showModal' in HTMLDialogElement.prototype)) {
  Object.assign(HTMLDialogElement.prototype, {
    showModal(this: HTMLDialogElement) {
      this.open = true;
    },
    close(this: HTMLDialogElement) {
      this.open = false;
    },
  });
}

// jsdom doesn't scroll; the tutorial jumps to each part it explains.
window.scrollTo = () => {};

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  localStorage.clear();
  sessionStorage.clear();
});
