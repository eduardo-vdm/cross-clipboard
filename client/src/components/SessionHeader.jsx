import { useSession } from '../contexts/SessionContext';
import { useTranslation } from 'react-i18next';
import { LanguageSwitcher } from './LanguageSwitcher';
import { toast } from 'react-hot-toast';
import { ShareIcon, TrashIcon } from '@heroicons/react/24/outline';
import { FireIcon } from '@heroicons/react/24/solid';
import { useState } from 'react';
import { ConfirmationDialog } from './ConfirmationDialog';

export const SessionHeader = () => {
  const { sessionCode, deviceId, items, createdBy } = useSession();
  const { t } = useTranslation(['common', 'clipboard']);
  const [showWipeConfirm, setShowWipeConfirm] = useState(false);
  const [showRemoveMyItemsConfirm, setShowRemoveMyItemsConfirm] = useState(false);

  const handleCopyLink = async () => {
    const url = new URL(window.location);
    url.searchParams.set('session', sessionCode);
    await navigator.clipboard.writeText(url.toString());
    toast.success(t('clipboard:clipboard.copied'));
  };

  const handleWipeSession = () => {
    // TODO: Implement wipe session functionality
    console.log('Wipe session functionality to be implemented');
  };

  const handleRemoveMyItems = () => {
    // TODO: Implement remove my items functionality
    console.log('Remove my items functionality to be implemented');
  };

  const hasMyItems = items.some(item => item.deviceId === deviceId);
  const isSessionCreator = deviceId === createdBy;
  const hasItems = items.length > 0;

  if (!sessionCode) return null;

  return (
    <div className="bg-white border-b p-4 flex justify-between items-center">
      <div className="flex items-center gap-4">
        <h1 className="text-xl font-semibold">
          {t('clipboard:session.title')} 
          <span className="font-mono ml-2">{sessionCode}</span>
        </h1>
        <div className="flex items-center gap-2">
          <button
            onClick={handleCopyLink}
            className="p-2 text-gray-500 hover:text-blue-600 rounded-lg hover:bg-gray-100 transition-colors"
            title={t('clipboard:session.copyLink')}
            aria-label={t('clipboard:session.copyLink')}
          >
            <ShareIcon className="h-5 w-5" />
          </button>
          <button
            onClick={() => setShowRemoveMyItemsConfirm(true)}
            disabled={!hasMyItems}
            className={`p-2 text-gray-500 hover:text-red-600 rounded-lg hover:bg-gray-100 transition-colors ${
              !hasMyItems ? 'opacity-50 cursor-not-allowed' : ''
            }`}
            title={t('clipboard:session.removeMyItemsTitle')}
            aria-label={t('clipboard:session.removeMyItemsTitle')}
          >
            <TrashIcon className="h-5 w-5" />
          </button>
          <button
            onClick={() => setShowWipeConfirm(true)}
            disabled={!isSessionCreator || !hasItems}
            className={`p-2 text-gray-500 hover:text-red-600 rounded-lg hover:bg-gray-100 transition-colors ${
              (!isSessionCreator || !hasItems) ? 'opacity-50 cursor-not-allowed' : ''
            }`}
            title={t('clipboard:session.wipeTitle')}
            aria-label={t('clipboard:session.wipeTitle')}
          >
            <FireIcon className="h-5 w-5" />
          </button>
        </div>
      </div>
      <LanguageSwitcher />

      <ConfirmationDialog
        isOpen={showWipeConfirm}
        onClose={() => setShowWipeConfirm(false)}
        onConfirm={handleWipeSession}
        title={t('clipboard:session.wipeTitle')}
        message={t('clipboard:session.wipeMessage')}
        type="danger"
      />

      <ConfirmationDialog
        isOpen={showRemoveMyItemsConfirm}
        onClose={() => setShowRemoveMyItemsConfirm(false)}
        onConfirm={handleRemoveMyItems}
        title={t('clipboard:session.removeMyItemsTitle')}
        message={t('clipboard:session.removeMyItemsMessage')}
        type="danger"
      />
    </div>
  );
}; 