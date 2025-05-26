import { useTranslation } from 'react-i18next';
import { useState, useRef, useEffect } from 'react';
import { GB, BR } from 'country-flag-icons/react/3x2';
import { usePasteSuppress } from '../contexts/PasteSuppressContext';

const languages = [
  { 
    code: 'en', 
    name: 'English',
    shortName: 'En',
    flag: GB,
  },
  { 
    code: 'pt-BR', 
    name: 'Português (BR)',
    shortName: 'Pt',
    flag: BR,
  },
];

export const LanguageSwitcher = () => {
  const { i18n } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);
  const { suppressPaste, enablePaste } = usePasteSuppress();

  // Suppress paste when dropdown is open
  useEffect(() => {
    if (isOpen) {
      suppressPaste();
    } else {
      enablePaste();
    }
    
    return () => {
      enablePaste();
    };
  }, [isOpen, suppressPaste, enablePaste]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const currentLanguage = languages.find(lang => lang.code === i18n.language) || languages[0];
  const Flag = currentLanguage.flag;

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Current Language Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-2 py-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300"
      >
        <Flag className="w-4 h-4" />
        <span className="hidden md:block text-sm font-medium">{currentLanguage.shortName}</span>
        <svg 
          className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          viewBox="0 0 20 20"
          fill="currentColor"
        >
          <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
        </svg>
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 mt-1 bg-white dark:bg-gray-800 rounded-lg shadow-lg border dark:border-gray-700 py-1 min-w-[160px] z-10">
          {languages.map((language) => {
            const FlagComponent = language.flag;
            return (
              <button
                key={language.code}
                onClick={() => {
                  i18n.changeLanguage(language.code);
                  setIsOpen(false);
                }}
                className={`w-full px-4 py-2 text-left flex items-center gap-2 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 ${
                  i18n.language === language.code ? 'bg-gray-50 dark:bg-gray-700' : ''
                }`}
              >
                <FlagComponent className="w-4 h-4" />
                <span className="text-sm">{language.name}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}; 