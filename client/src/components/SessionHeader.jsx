import { useSession } from '../contexts/SessionContext';
import { useTranslation } from 'react-i18next';
import { LanguageSwitcher } from './LanguageSwitcher';
import { toast } from 'react-hot-toast';
import { ShareIcon, TrashIcon, SunIcon, MoonIcon } from '@heroicons/react/24/outline';
import { FireIcon, ClipboardDocumentListIcon, ChevronLeftIcon, UserIcon, EllipsisVerticalIcon } from '@heroicons/react/24/solid';
import { useState, useEffect } from 'react';
import { ConfirmationDialog } from './ConfirmationDialog';
import { useTheme } from '../contexts/ThemeContext';
import { clsx } from 'clsx';
import { Menu, MenuButton, MenuItems, MenuItem } from '@headlessui/react';
import ShareDialog from './ShareDialog';

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
    <header className="h-16 z-30 bg-white dark:bg-gray-800 border-b-4 border-gray-300 dark:border-gray-700 p-1 flex justify-between items-center">
      <div className="flex items-center gap-2 -ml-2">
        <a href="/" className="flex items-center gap-0 ml-2 -mr-3 text-gray-500 hover:text-amber-500 dark:text-gray-500 dark:hover:text-amber-500 transition-colors">
          <ChevronLeftIcon className="h-5 w-5 " />
          <ClipboardDocumentListIcon className="h-10 w-10" />
        </a>        
        <h1 className="text-xl font-semibold text-gray-500 flex flex-col items-center justify-center -mt-1 ml-1">
          {/* <span className="text-gray-500 -mb-1 z-10 pb-1 text-shadow-hard-black dark:text-shadow-hard-white">{t('clipboard:session.title')}</span> */}
          <span className="w-full flex flex-row items-center justify-end gap-0">
            <span className="text-right text-xl font-bold text-amber-500 dark:text-amber-500 text-shadow-hard-black-sm dark:text-shadow-hard-white-sm">Cross</span>
            <span className="text-right text-xl font-bold text-blue-500 dark:text-blue-500 text-shadow-hard-black-sm dark:text-shadow-hard-white-sm">Clip</span>
          </span>
          <span className="session-code-dashed-box ml-2 -mt-1" onClick={handleCopySessionCode} onKeyDown={e => { if (e.key === 'Enter') handleCopySessionCode(); }} tabIndex={0} role="button">{sessionCode}</span>
        </h1>
        <div className="flex items-center gap-1 ml-1">
          <ShareDialog />
        </div>

        <div className="flex items-center gap-2 ml-0">
          {/* Inline buttons: visible on md and above */}
          <div className="hidden md:flex items-center gap-2">
            <button
              onClick={() => setShowRemoveMyItemsConfirm(true)}
              disabled={!hasMyItems}
              className={`p-2 text-gray-500 hover:text-red-600 rounded-lg hover:bg-gray-100 transition-colors ${
                !hasMyItems ? 'opacity-50 cursor-not-allowed' : ''
              }`}
              title={t('clipboard:session.removeMyItemsTitle')}
              aria-label={t('clipboard:session.removeMyItemsTitle')}
            >
              <div className="relative w-5 h-5">
                <UserIcon className="w-full h-full" />
                <FireIcon className="w-4 h-4 text-red-500 absolute -bottom-1 -right-1" />
              </div>
            </button>
            <button
              onClick={() => setShowWipeConfirm(true)}
              disabled={!isSessionCreator || !hasItems}
              className={`p-2 text-red-500 hover:text-red-600 rounded-lg hover:bg-gray-100 transition-colors ${
                (!isSessionCreator || !hasItems) ? 'opacity-50 cursor-not-allowed' : ''
              }`}
              title={t('clipboard:session.wipeTitle')}
              aria-label={t('clipboard:session.wipeTitle')}
            >
              <FireIcon className="h-5 w-5" />
            </button>
          </div>

          {/* 3-dots menu + dropdown: visible below md */}
          <div className="md:hidden">
            <Menu as="div" className="relative">
              <MenuButton
                className="p-2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-600 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                title="More actions"
              >
                <EllipsisVerticalIcon className="h-6 w-6" />
              </MenuButton>
              <MenuItems className="absolute right-0 mt-2 w-48 origin-top-right bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md shadow-lg focus:outline-none z-50">
                <div className="py-1">
                  <MenuItem disabled={!hasMyItems}>
                    {({ active, disabled }) => (
                      <button
                        onClick={() => setShowRemoveMyItemsConfirm(true)}
                        disabled={disabled}
                        className={`flex items-center w-full text-left px-4 py-2 text-sm ${
                          disabled
                            ? 'opacity-50 cursor-not-allowed text-gray-400'
                            : active
                            ? 'bg-gray-100 dark:bg-gray-700 text-red-600'
                            : 'text-gray-700 dark:text-gray-400'
                        }`}
                      >
                        <div className="relative w-5 h-5">
                          <UserIcon className="w-full h-full" />
                          <FireIcon className="w-4 h-4 text-red-500 absolute -bottom-1 -right-1" />
                        </div>
                        <span className="ml-2">{t('clipboard:session.removeMyItemsTitle')}</span>
                      </button>
                    )}
                  </MenuItem>
                  <MenuItem disabled={!isSessionCreator || !hasItems}>
                    {({ active, disabled }) => (
                      <button
                        onClick={() => setShowWipeConfirm(true)}
                        disabled={disabled}
                        className={`flex items-center w-full text-left px-4 py-2 text-sm ${
                          disabled
                            ? 'opacity-50 cursor-not-allowed text-gray-400'
                            : active
                            ? 'bg-gray-100 dark:bg-gray-700 text-red-600'
                            : 'text-red-500'
                        }`}
                      >
                        <div className="relative w-5 h-5">
                          <FireIcon className="h-5 w-5" />
                        </div>
                        <span className="ml-2">{t('clipboard:session.wipeTitle')}</span>
                      </button>
                    )}
                  </MenuItem>
                </div>
              </MenuItems>
            </Menu>
          </div>
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
    </header>
  );
}; 