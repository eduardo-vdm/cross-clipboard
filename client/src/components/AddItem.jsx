import { useSession } from '../contexts/SessionContext';
import { usePasteSuppress } from '../contexts/PasteSuppressContext';
import { useTranslation } from 'react-i18next';
import { useHotkeys } from 'react-hotkeys-hook';
import { useState, useEffect, useRef } from 'react';
import { ExclamationTriangleIcon } from '@heroicons/react/24/solid';
import KeyLabel from '../utils/keyLabel';
import '../styles/custom.css';

export const AddItem = () => {
  const { addItem } = useSession();
  const { isPasteSuppressed } = usePasteSuppress();
  const { t } = useTranslation('clipboard');
  const [clipboardState, setClipboardState] = useState('unknown');
  const [hasKeyboard, setHasKeyboard] = useState(false);
  const pasteAreaRef = useRef(null);

  // Check clipboard permission status on mount
  useEffect(() => {
    const checkPermission = async () => {
      try {
        const result = await navigator.permissions.query({ name: 'clipboard-read' });
        setClipboardState(result.state);
        
        // Listen for permission changes
        result.addEventListener('change', () => {
          setClipboardState(result.state);
        });
      } catch (error) {
        // Fallback for browsers without permissions API
        try {
          await navigator.clipboard.read();
          setClipboardState('granted');
        } catch (error) {
          if (error.name === 'NotAllowedError') {
            setClipboardState('denied');
          } else {
            setClipboardState('prompt');
          }
        }
      }
    };
    
    checkPermission();
  }, []);

  useEffect(() => {
    const checkKeyboard = () => {
      const hasPhysicalKeyboard = /keyboard|keypad|physical/i.test(navigator.userAgent);
      const isDesktop = !/android|iphone|ipad|ipod|mobile/i.test(navigator.userAgent);
      setHasKeyboard(hasPhysicalKeyboard || isDesktop);
    };
  
    checkKeyboard();
    window.addEventListener('resize', checkKeyboard);
    return () => window.removeEventListener('resize', checkKeyboard);
  }, []);

  const handlePaste = async (e) => {
    if (e) e.preventDefault();
    
    // Don't process paste if suppressed
    if (isPasteSuppressed) return;
    
    try {
      const clipboardItems = await navigator.clipboard.read();

      for (const clipboardItem of clipboardItems) {
        // TODO: Handle images

        // Handle text
        if (clipboardItem.types.includes('text/plain')) {
          const blob = await clipboardItem.getType('text/plain');
          const text = await blob.text();
          if (text.trim()) {
            await addItem(text, 'text');
          }
          return;
        }
      }
    } catch (error) {
      console.error('Paste error:', error);
      // Update permission state if it was denied during paste attempt
      if (error.name === 'NotAllowedError') {
        setClipboardState('denied');
      }
    }
  };

  // Setup global hotkey for pasting that respects the paste suppression
  useHotkeys('ctrl+v', (event) => {
    if (!isPasteSuppressed) {
      handlePaste(event);
    }
  }, { enableOnFormTags: false });

  const isDenied = clipboardState === 'denied';
  const isGranted = clipboardState === 'granted';

  return (
    <div
      ref={pasteAreaRef}
      onPaste={handlePaste}
      tabIndex={0}
      role="button"
      aria-label={t('addItem.pastePrompt')}
      className={`relative bg-gray-50 dark:bg-gray-800 border-2 border-dashed ${
        isDenied ? 'border-red-300 dark:border-red-500' : isGranted ? 'border-green-300 dark:border-green-500' : 'border-gray-300 dark:border-gray-600'
      } ${!isPasteSuppressed ? 'ring-2 ring-blue-500 ring-opacity-100' : ''} rounded-lg p-8 text-center cursor-pointer mb-8 transition-all duration-200 focus:outline-none focus:ring-4 focus:ring-blue-500 focus:ring-opacity-100`}
    >
      <p className={`${isDenied ? 'text-red-500 dark:text-red-400' : 'text-gray-500 dark:text-gray-400'}`}>
        {isDenied
          ? t('addItem.permissionDenied')
          : t('addItem.pastePrompt')}
      </p>
      <p className="text-sm text-gray-400 dark:text-gray-500 mt-2">
        {t('addItem.supportedTypes')}
      </p>
      {hasKeyboard && !isPasteSuppressed && (
        <div className={`absolute bottom-2 right-2 flex items-center gap-1`}>
          <div className='text-sm text-gray-400 dark:text-gray-500 flex items-center gap-1'>
            <KeyLabel keyString='Ctrl+V' />{t('addItem.keyboardShortcutAppend')}
            {isDenied && (
              <ExclamationTriangleIcon title={t('addItem.permissionDenied')} className="h-4 w-4 text-red-500 dark:text-red-400" />
            )}
          </div>
        </div>
      )}
    </div>
  );
}; 