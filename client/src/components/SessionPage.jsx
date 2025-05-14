import { SessionHeader } from './SessionHeader';
import { AddItem } from './AddItem';
import { ClipboardItems } from './ClipboardItems';
import { ClipboardPermission } from './ClipboardPermission';

function SessionPage() {
  return (
    <>
      <SessionHeader />
      <main className="max-w-4xl mx-auto px-4 py-8">
        <AddItem />
        <ClipboardItems />
      </main>
      <ClipboardPermission />
    </>
  );
}

export default SessionPage; 