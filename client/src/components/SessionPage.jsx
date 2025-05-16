import { SessionHeader } from './SessionHeader';
import { AddItem } from './AddItem';
import { ClipboardItems } from './ClipboardItems';
import { ClipboardPermission } from './ClipboardPermission';

function SessionPage() {
  return (
    <>
      <SessionHeader />
      <main className="max-w-4xl mx-auto px-4 py-8">
        <div className="min-w-[24rem] sm:min-w-[36rem] md:min-w-[42rem] lg:min-w-[48rem] xl:min-w-[54rem] 2xl:min-w-[60rem] w-full transition-width duration-300">
          <AddItem />
          <ClipboardItems />
        </div>
      </main>
      <ClipboardPermission />
    </>
  );
}

export default SessionPage; 