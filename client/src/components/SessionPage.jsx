import { AddItem } from './AddItem';
import { ClipboardItems } from './ClipboardItems';
import { ClipboardPermission } from './ClipboardPermission';
import clsx from 'clsx';

function SessionPage() {
  return (
    <>
      <div className={clsx(
        'max-w-[24rem] md:max-w-[42rem] 2xl:max-w-[60rem] mx-auto px-4 py-8 transition-width duration-300',
        // 'outline outline-red-500 outline-2 border-4 border-dashed border-red-500', // debug
      )}>
          <AddItem />
          <ClipboardItems />
      </div>
      <ClipboardPermission />
    </>
  );
}

export default SessionPage; 