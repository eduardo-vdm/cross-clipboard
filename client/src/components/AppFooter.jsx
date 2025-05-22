import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { MarkGithubIcon } from '@primer/octicons-react'
import { ShieldCheckIcon } from '@heroicons/react/24/outline';
import { InformationCircleIcon } from '@heroicons/react/24/outline';
import { PrivacyDialog } from './PrivacyDialog';

export const AppFooter = () => {
  const { t } = useTranslation('common');
  const [isPrivacyDialogOpen, setIsPrivacyDialogOpen] = useState(false);

  return (
    <footer className="h-8 fixed bottom-0 left-0 right-0 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm border-t border-gray-300 dark:border-gray-700 py-2 px-4 text-sm text-gray-600 dark:text-gray-400 hover:bg-white dark:hover:bg-gray-900 transition-colors">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <span className="text-gray-500 dark:text-gray-500 italic">Work in progress</span>
        <div className="flex items-center">
          <a 
            href={import.meta.env.VITE_APP_REPOSITORY}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center space-x-2 hover:text-gray-900 dark:hover:text-gray-200"
          >
            <span>v{import.meta.env.VITE_APP_VERSION}</span>
            <span><MarkGithubIcon className="size-4" /></span>
            <span>{import.meta.env.VITE_APP_AUTHOR}</span>
          </a>
        </div>
        <a 
          onClick={() => setIsPrivacyDialogOpen(true)}
          className="flex items-center justify-center space-x-1 hover:text-gray-900 dark:hover:text-gray-200 cursor-pointer"
        >
          <span><ShieldCheckIcon className="h-5 w-5" /></span>
          <span>{t('footer.privacy')}</span>
        </a>
      </div>
      <PrivacyDialog isOpen={isPrivacyDialogOpen} onClose={() => setIsPrivacyDialogOpen(false)} />
    </footer>
  );
}; 