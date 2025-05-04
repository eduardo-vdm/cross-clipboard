import { useState } from 'react';
import { useSession } from '../contexts/SessionContext';
import { copyToClipboard } from '../utils/clipboard';
import { ConflictModal } from './ConflictModal';
import toast from 'react-hot-toast';

const ClipboardItem = ({ item }) => {
  const { deviceId, deleteItem, editItem } = useSession();
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(item.content);
  const [showConflict, setShowConflict] = useState(false);
  const [conflictData, setConflictData] = useState(null);
  
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

  const handleEdit = async () => {
    if (!isEditing) {
      setEditContent(item.content);
      setIsEditing(true);
      return;
    }

    if (editContent === item.content) {
      setIsEditing(false);
      return;
    }

    const result = await editItem(item.id, editContent, item.version);
    
    if (result.success) {
      setIsEditing(false);
    } else if (result.conflict) {
      setConflictData({
        currentContent: result.currentItem.content,
        yourContent: editContent,
        currentVersion: result.currentVersion,
      });
      setShowConflict(true);
    }
  };

  const handleConflictResolve = async (choice) => {
    if (choice === 'yours') {
      const result = await editItem(
        item.id, 
        conflictData.yourContent, 
        conflictData.currentVersion
      );
      if (result.success) {
        setIsEditing(false);
        setShowConflict(false);
        setConflictData(null);
      }
    } else {
      setEditContent(conflictData.currentContent);
      setIsEditing(false);
      setShowConflict(false);
      setConflictData(null);
    }
  };

  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete this item?')) {
      await deleteItem(item.id);
    }
  };

  return (
    <>
      <div className="bg-white rounded-lg shadow-sm border p-4 mb-4">
        <div className="flex justify-between items-start mb-2">
          <div className="text-sm text-gray-500">
            {new Date(item.createdAt).toLocaleString()}
          </div>
          {isOwner && (
            <div className="flex gap-2">
              {item.type === 'text' && (
                <button
                  className="text-blue-500 hover:text-blue-600 text-sm"
                  onClick={handleEdit}
                >
                  {isEditing ? 'Save' : 'Edit'}
                </button>
              )}
              <button
                className="text-red-500 hover:text-red-600 text-sm"
                onClick={handleDelete}
              >
                Delete
              </button>
            </div>
          )}
        </div>

        {item.type === 'text' ? (
          isEditing ? (
            <textarea
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              className="w-full font-mono text-sm bg-gray-50 p-3 rounded-lg border focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={3}
            />
          ) : (
            <div 
              className="font-mono text-sm bg-gray-50 p-3 rounded-lg cursor-pointer hover:bg-gray-100"
              onClick={handleCopy}
              title="Click to copy"
            >
              {item.content}
            </div>
          )
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

      <ConflictModal
        show={showConflict}
        currentContent={conflictData?.currentContent}
        yourContent={conflictData?.yourContent}
        onResolve={handleConflictResolve}
        onCancel={() => {
          setShowConflict(false);
          setIsEditing(false);
          setEditContent(item.content);
          setConflictData(null);
        }}
      />
    </>
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