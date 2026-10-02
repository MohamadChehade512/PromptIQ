import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { applyThemeChoice, readThemeChoice } from './lib/theme';
import { Root } from './site/Root';
// Inter with optical sizing: tighter, display-cut letterforms at headline sizes.
import '@fontsource-variable/inter/opsz.css';
import './styles.css';

// Apply a saved light/dark choice before the first paint.
applyThemeChoice(readThemeChoice());

const root = document.getElementById('root');
if (!root) throw new Error('Missing #root element');

createRoot(root).render(
  <StrictMode>
    <Root />
  </StrictMode>,
);
