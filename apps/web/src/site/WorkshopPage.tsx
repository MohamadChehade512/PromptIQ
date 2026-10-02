import { App } from '../App';
import { EntryGate } from '../components/EntryGate';
import { useDocumentTitle } from '../lib/router';

/**
 * The Prompt Workshop: terms (first visit only), then the tool. Loaded as its own bundle, so
 * the scoring engine is only downloaded by people the access-code gate lets in.
 */
export default function WorkshopPage() {
  useDocumentTitle('Prompt Workshop · Prompt IQ');
  return (
    <EntryGate>
      {(agreement, withdraw) => <App agreement={agreement} onWithdraw={withdraw} />}
    </EntryGate>
  );
}
