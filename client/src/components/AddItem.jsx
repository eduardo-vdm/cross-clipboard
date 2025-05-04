import { useState } from 'react';
import { useSession } from '../contexts/SessionContext';
import { readFromClipboard, readImageFromClipboard } from '../utils/clipboard';
import toast from 'react-hot-toast';

export const AddItem = () => {
  const { addItem, loading } = useSession();
  const [itemType, setItemType] = useState('text'); // 'text' or 'image'

  const handlePaste = async () => {
    if (loading) return;

    if (itemType === 'text') {
      const { success, content, error } = await readFromClipboard();
      if (success && content.trim()) {
        await addItem(content, 'text');
      } else {
        toast.error(error || 'No text found in clipboard');
      }
    } else {
      const { success, content, error } = await readImageFromClipboard();
      if (success) {
        // Convert blob to base64
        const reader = new FileReader();
        reader.onloadend = async () => {
          await addItem(reader.result, 'image');
        };
        reader.readAsDataURL(content);
      } else {
        toast.error(error || 'No image found in clipboard');
      }
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border p-4 mb-6">
      <div className="flex items-center gap-4">
        <div className="flex rounded-lg overflow-hidden border">
          <button
            className={`px-4 py-2 ${
              itemType === 'text'
                ? 'bg-blue-500 text-white'
                : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
            }`}
            onClick={() => setItemType('text')}
          >
            Text
          </button>
          <button
            className={`px-4 py-2 ${
              itemType === 'image'
                ? 'bg-blue-500 text-white'
                : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
            }`}
            onClick={() => setItemType('image')}
          >
            Image
          </button>
        </div>
        <button
          onClick={handlePaste}
          disabled={loading}
          className={`btn btn-primary flex-1 ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          {loading ? 'Adding...' : `Paste ${itemType === 'text' ? 'Text' : 'Image'}`}
        </button>
      </div>
    </div>
  );
}; 