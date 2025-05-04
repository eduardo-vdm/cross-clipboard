import { useSession } from '../contexts/SessionContext';
import { useTranslation } from 'react-i18next';

export const AddItem = () => {
  const { addItem } = useSession();
  const { t } = useTranslation('clipboard');

  const handlePaste = async (e) => {
    e.preventDefault();
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
  };

  return (
    <div 
      onPaste={handlePaste}
      className="bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer mb-8"
    >
      <p className="text-gray-500">
        {t('addItem.pastePrompt')}
      </p>
      <p className="text-sm text-gray-400 mt-2">
        {t('addItem.supportedTypes')}
      </p>
    </div>
  );
}; 