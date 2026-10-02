import react from '@vitejs/plugin-react';
import type { Plugin } from 'vite';
import { defineConfig } from 'vitest/config';
import pkg from './package.json' with { type: 'json' };

const apiPort = process.env.API_PORT ?? '8787';

/**
 * The Content-Security-Policy, as a <meta> tag in the built page. CloudFront's free plan can't
 * send custom headers. Build only: the dev server needs inline scripts for hot reload.
 * (frame-ancestors is ignored in a meta tag; the managed SecurityHeadersPolicy's
 * X-Frame-Options covers framing.)
 */
const CSP = [
  "default-src 'self'",
  "script-src 'self'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob:",
  "font-src 'self' data:",
  "connect-src 'self'",
  "worker-src 'self'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  'upgrade-insecure-requests',
].join('; ');

const cspMeta: Plugin = {
  name: 'csp-meta',
  apply: 'build',
  transformIndexHtml: () => [
    {
      tag: 'meta',
      attrs: { 'http-equiv': 'Content-Security-Policy', content: CSP },
      injectTo: 'head-prepend',
    },
  ],
};

export default defineConfig({
  plugins: [react(), cspMeta],
  // Shown in the footer; bump "version" in apps/web/package.json for each release.
  define: { __APP_VERSION__: JSON.stringify(pkg.version) },
  server: {
    port: 5173,
    strictPort: true,
    // Same-origin /api in dev, mirroring CloudFront routing in production (PLAN.md §3.3).
    proxy: { '/api': `http://127.0.0.1:${apiPort}` },
  },
  // The file readers are imported only when a file is attached; pre-bundle them so the dev
  // server doesn't re-optimize (and break the in-flight import) on first use.
  optimizeDeps: { include: ['pdfjs-dist', 'mammoth'] },
  build: {
    sourcemap: false,
    // The o200k tokenizer (~2 MB) is its own lazily-loaded chunk, fetched only when the
    // ChatGPT platform is used; the app entry stays small.
    chunkSizeWarningLimit: 2_100,
  },
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
  },
});
