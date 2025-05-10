import { useSession } from '../contexts/SessionContext';
import { usePasteSuppress } from '../contexts/PasteSuppressContext';
import { useTranslation } from 'react-i18next';
import { useHotkeys } from 'react-hotkeys-hook';
import { useState, useEffect } from 'react';

export const AddItem = () => {
  const { addItem } = useSession();
  const { isPasteSuppressed } = usePasteSuppress();
  const { t } = useTranslation('clipboard');
  const [clipboardState, setClipboardState] = useState('unknown');

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

  const handlePaste = async (e) => {
    if (e) e.preventDefault();
    
    // Don't process paste if suppressed
    if (isPasteSuppressed) return;
    
    try {
      const clipboardItems = await navigator.clipboard.read();

      for (const clipboardItem of clipboardItems) {
        // Handle images
        if (clipboardItem.types.includes('image/png') || 
            clipboardItem.types.includes('image/jpeg')) {
          const blob = await clipboardItem.getType(
            clipboardItem.types.find(type => type.startsWith('image/'))
          );
          const reader = new FileReader();
          reader.onload = async (e) => {
            await addItem(e.target.result, 'image');
          };
          reader.readAsDataURL(blob);
          return;
        }

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
      onPaste={handlePaste}
      className={`bg-gray-50 border-2 border-dashed ${
        isDenied ? 'border-red-300' : isGranted ? 'border-green-300' : 'border-gray-300'
      } rounded-lg p-8 text-center cursor-pointer mb-8 transition-colors`}
    >
      <p className={`${isDenied ? 'text-red-500' : 'text-gray-500'}`}>
        {isDenied 
          ? t('addItem.permissionDenied') 
          : t('addItem.pastePrompt')}
      </p>
      <p className="text-sm text-gray-400 mt-2">
        {t('addItem.supportedTypes')}
      </p>
    </div>
  );
}; 