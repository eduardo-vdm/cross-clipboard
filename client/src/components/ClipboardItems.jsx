import { useState, useEffect } from 'react';
import { useSession } from '../contexts/SessionContext';
import { copyToClipboard } from '../utils/clipboard';
import { ConflictModal } from './ConflictModal';
import { useTranslation } from 'react-i18next';
import { formatDate } from '../utils/dateFormat';
import toast from 'react-hot-toast';
import { useHotkeys } from 'react-hotkeys-hook';

const ClipboardItem = ({ item, index }) => {
  const { deviceId, deleteItem, editItem } = useSession();
  const { t, i18n } = useTranslation(['common', 'clipboard']);
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(item.content);
  const [showConflict, setShowConflict] = useState(false);
  const [conflictData, setConflictData] = useState(null);
  
  const isOwner = item.deviceId === deviceId;

  const handleCopy = async () => {
    if (item.type === 'text') {
      const success = await copyToClipboard(item.content);
      if (success) {
        toast.success(t('clipboard:clipboard.copied'));
      } else {
        toast.error(t('clipboard:clipboard.copyFailed'));
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
      toast.success(t('clipboard:clipboard.updated'));
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
    if (window.confirm(t('common:confirmations.delete'))) {
      await deleteItem(item.id);
      toast.success(t('clipboard:clipboard.deleted'));
    }
  };

  return (
    <>
      <div className="bg-white rounded-lg shadow-sm border p-4 mb-4">
        <div className="flex justify-between items-start mb-2">
          <div className="text-sm text-gray-500">
            {index <= 9 && (
              <span className="inline-block bg-blue-600 text-white font-semibold rounded-full w-5 h-5 text-xs leading-5 text-center mr-2">
                {index}
              </span>
            )}
            {formatDate(item.createdAt, 'PPpp', i18n.language)}
          </div>
          {isOwner && (
            <div className="flex gap-2">
              {item.type === 'text' && (
                <button
                  className="text-blue-500 hover:text-blue-600 text-sm"
                  onClick={handleEdit}
                >
                  {t(isEditing ? 'common:actions.save' : 'common:actions.edit')}
                </button>
              )}
              <button
                className="text-red-500 hover:text-red-600 text-sm"
                onClick={handleDelete}
              >
                {t('common:actions.delete')}
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
              title={t('common:actions.copy')}
            >
              {item.content}
            </div>
          )
        ) : (
          <div className="relative">
            <img 
              src={item.content} 
              alt={t('clipboard:image.clipboardContent')}
              className="max-w-full rounded-lg"
            />
            <a 
              href={item.content}
              download="clipboard-image"
              className="absolute top-2 right-2 bg-white rounded-lg shadow-sm px-3 py-1 text-sm hover:bg-gray-50"
            >
              {t('common:actions.download')}
            </a>
          </div>
        )}
      </div>

      <ConflictModal
        show={showConflict}
        currentContent={conflictData?.currentContent}
        yourContent={conflictData?.yourContent}
        currentVersion={conflictData?.currentVersion}
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
  const { t } = useTranslation('common');
  const [permissionState, setPermissionState] = useState('unknown');

  // Check clipboard write permission
  useEffect(() => {
    const checkPermission = async () => {
      try {
        // Try to check clipboard-write permission if supported
        if (navigator.permissions && navigator.permissions.query) {
          try {
            const result = await navigator.permissions.query({ name: 'clipboard-write' });
            setPermissionState(result.state);
            
            result.addEventListener('change', () => {
              setPermissionState(result.state);
            });
            return;
          } catch (e) {
            // Some browsers don't support clipboard-write permission query
            console.log('Clipboard-write permission query not supported');
          }
        }
        
        // Fallback: Test by writing to clipboard
        const testWrite = await copyToClipboard('test');
        if (testWrite) {
          setPermissionState('granted');
        } else {
          setPermissionState('denied');
        }
      } catch (error) {
        console.error('Permission check error:', error);
        setPermissionState('denied');
      }
    };
    
    checkPermission();
  }, []);

  // Setup hotkeys for copying items by number (1-9)
  useHotkeys('1,2,3,4,5,6,7,8,9', (event) => {
    const index = parseInt(event.key) - 1;
    
    // Only try to copy if permission is granted or unknown (for browsers that don't support permission API)
    if (permissionState !== 'denied' && items[index] && items[index].type === 'text') {
      copyToClipboard(items[index].content).then(success => {
        if (success) {
          toast.success(t('clipboard:clipboard.copied'));
        } else {
          setPermissionState('denied');
          toast.error(t('clipboard:clipboard.copyFailed'));
        }
      });
    } else if (permissionState === 'denied') {
      // If permission is denied, show error message
      toast.error(t('clipboard:clipboard.copyFailed'));
    }
  }, { enableOnFormTags: false });

  if (error) {
    return (
      <div className="text-center text-red-500 my-8">
        {t('errors.generic', { message: error })}
      </div>
    );
  }

  if (loading && items.length === 0) {
    return (
      <div className="text-center text-gray-500 my-8">
        {t('errors.loading')}
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="text-center text-gray-500 my-8">
        {t('empty.items')}
      </div>
    );
  }

  return (
    <div>
      {items.map((item, index) => (
        <ClipboardItem key={item.id} item={item} index={index + 1} />
      ))}
    </div>
  );
}; 