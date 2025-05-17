import { SessionHeader } from './SessionHeader';
import { AddItem } from './AddItem';
import { ClipboardItems } from './ClipboardItems';
import { ClipboardPermission } from './ClipboardPermission';

function SessionPage() {
  return (
    <>
      <SessionHeader />
      <main className="max-w-[24rem] sm:max-w-[36rem] md:max-w-[42rem] lg:max-w-[48rem] xl:max-w-[54rem] 2xl:max-w-[60rem] 4xl:max-w-[66rem] mx-auto px-4 py-8">
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