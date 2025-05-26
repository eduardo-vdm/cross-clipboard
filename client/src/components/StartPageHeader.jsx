import { useTranslation } from 'react-i18next';
import { LanguageSwitcher } from './LanguageSwitcher';
import { SunIcon, MoonIcon } from '@heroicons/react/24/outline';
import { useTheme } from '../contexts/ThemeContext';

export const StartPageHeader = () => {
  const { t } = useTranslation(['common', 'clipboard']);
  const { currentTheme, toggleTheme } = useTheme();

  return (
    <header className="h-16 z-30 bg-white dark:bg-gray-800 border-b-4 border-gray-300 dark:border-gray-700 p-1 flex justify-end items-center">
      <div className="flex items-center gap-2">
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
    </header>
  );
};