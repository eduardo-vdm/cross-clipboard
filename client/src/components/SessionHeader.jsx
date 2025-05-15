import { useSession } from '../contexts/SessionContext';
import { useTranslation } from 'react-i18next';
import { LanguageSwitcher } from './LanguageSwitcher';
import { toast } from 'react-hot-toast';
import { ShareIcon, TrashIcon, SunIcon, MoonIcon } from '@heroicons/react/24/outline';
import { FireIcon, ClipboardDocumentListIcon, ChevronLeftIcon } from '@heroicons/react/24/solid';
import { useState, useEffect } from 'react';
import { ConfirmationDialog } from './ConfirmationDialog';
import { useTheme } from '../contexts/ThemeContext';

export const SessionHeader = () => {
  const { sessionCode, deviceId, items, createdBy, wipeSession, removeMyItems } = useSession();
  const { t } = useTranslation(['common', 'clipboard']);
  const [showWipeConfirm, setShowWipeConfirm] = useState(false);
  const [showRemoveMyItemsConfirm, setShowRemoveMyItemsConfirm] = useState(false);
  const { currentTheme, toggleTheme } = useTheme();

  const handleCopyLink = async () => {
    const url = new URL(window.location);
    await navigator.clipboard.writeText(url.toString());
    toast.success(t('clipboard:clipboard.copied'));
  };

  const handleWipeSession = async () => {
    try {
      await wipeSession();
      setShowWipeConfirm(false);
    } catch (err) {
      // Error is already handled in the context
    }
  };  

  const handleRemoveMyItems = async () => {
    try {
      await removeMyItems();
      setShowRemoveMyItemsConfirm(false);
    } catch (err) {
      // Error is already handled in the context
    }
  };

  const handleCopySessionCode = async () => {
    await navigator.clipboard.writeText(sessionCode);
    toast.success(t('clipboard:clipboard.copied'));
  };

  const hasMyItems = items.some(item => item.deviceId === deviceId);
  const isSessionCreator = deviceId === createdBy;
  const hasItems = items.length > 0;

  if (!sessionCode) return null;

  return (
    <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-1 flex justify-between items-center">
      <div className="flex items-center gap-2 -ml-2">
        <a href="/" className="flex items-center gap-0 ml-2 -mr-3 text-gray-500 hover:text-amber-500 dark:text-gray-500 dark:hover:text-amber-500 transition-colors">
          <ChevronLeftIcon className="h-5 w-5 " />
          <ClipboardDocumentListIcon className="h-10 w-10" />
        </a>        
        <h1 className="text-xl font-semibold text-gray-500 flex flex-col items-center justify-center -mt-1 ml-1">
          <span className="text-gray-500 -mb-1 z-10 pb-1">{t('clipboard:session.title')}</span>
          <span className="text-amber-500 z-0 hover:text-blue-500 tracking-wider ml-2 -mt-1 font-mono border-2 border-gray-500 dark:border-gray-600 hover:border-blue-500 dark:hover:border-blue-500 border-dashed px-1.5 pt-0.5 leading-none" onClick={handleCopySessionCode} onKeyDown={e => { if (e.key === 'Enter') handleCopySessionCode(); }} tabIndex={0} role="button">{sessionCode}</span>
        </h1>
        <div className="flex items-center gap-2 ml-4">
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
      <div className="flex  items-center gap-2">
      <button
        onClick={toggleTheme}
        className="p-2 text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
        title={currentTheme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
        aria-label={currentTheme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
      >
        {currentTheme === 'dark' ? (
          <SunIcon className="h-5 w-5" />
        ) : (
          <MoonIcon className="h-5 w-5" />
        )}
      </button>
        <LanguageSwitcher />
      </div>

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