import { useSession } from '../contexts/SessionContext';
import { copyToClipboard } from '../utils/clipboard';
import toast from 'react-hot-toast';

const ClipboardItem = ({ item }) => {
  const { deviceId, deleteItem } = useSession();
  const isOwner = item.deviceId === deviceId;

  const handleCopy = async () => {
    if (item.type === 'text') {
      const success = await copyToClipboard(item.content);
      if (success) {
        toast.success('Copied to clipboard!');
      } else {
        toast.error('Failed to copy to clipboard');
      }
    }
  };

  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete this item?')) {
      await deleteItem(item.id);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border p-4 mb-4">
      <div className="flex justify-between items-start mb-2">
        <div className="text-sm text-gray-500">
          {new Date(item.createdAt).toLocaleString()}
        </div>
        {isOwner && (
          <button
            className="text-red-500 hover:text-red-600 text-sm"
            onClick={handleDelete}
          >
            Delete
          </button>
        )}
      </div>

      {item.type === 'text' ? (
        <div 
          className="font-mono text-sm bg-gray-50 p-3 rounded-lg cursor-pointer hover:bg-gray-100"
          onClick={handleCopy}
          title="Click to copy"
        >
          {item.content}
        </div>
      ) : (
        <div className="relative">
          <img 
            src={item.content} 
            alt="Clipboard content"
            className="max-w-full rounded-lg"
          />
          <a 
            href={item.content}
            download="clipboard-image"
            className="absolute top-2 right-2 bg-white rounded-lg shadow-sm px-3 py-1 text-sm hover:bg-gray-50"
          >
            Download
          </a>
        </div>
      )}
    </div>
  );
};

export const ClipboardItems = () => {
  const { items, loading, error } = useSession();

  if (error) {
    return (
      <div className="text-center text-red-500 my-8">
        Error: {error}
      </div>
    );
  }

  if (loading && items.length === 0) {
    return (
      <div className="text-center text-gray-500 my-8">
        Loading...
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="text-center text-gray-500 my-8">
        No items yet. Paste something to get started!
      </div>
    );
  }

  return (
    <div>
      {items.map(item => (
        <ClipboardItem key={item.id} item={item} />
      ))}
    </div>
  );
}; 