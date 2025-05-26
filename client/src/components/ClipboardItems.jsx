import { useState, useEffect, useCallback, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useSession } from '../contexts/SessionContext';
import { useHotkeys } from 'react-hotkeys-hook';
import { useElementHeight } from '../hooks/useElementHeight';
import { copyToClipboard } from '../utils/clipboard';
import { ConflictModal } from './ConflictModal';
import { ConfirmationDialog } from './ConfirmationDialog';
import { formatDate } from '../utils/dateFormat';
import toast from 'react-hot-toast';
import KeyLabel from '../utils/keyLabel';
import { UserIcon, ChevronDownIcon, ChevronUpIcon } from '@heroicons/react/24/solid';
import clsx from 'clsx';
import '../styles/custom.css';

// Constants for content display
const MAX_HEIGHT = 40; // tailwind's height scale ({units} / 4 * 10)px
const EXPANDED_HEIGHT = 32; // tailwind's height scale
const RESIZE_MAX_HEIGHT = 48; // tailwind's height scale

const ClipboardContent = ({ content, type, onCopy, isEditing, editContent, onEditChange }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const { t } = useTranslation(['common', 'clipboard']);
  const [outerRef, outerHeight] = useElementHeight();
  const [innerRef, innerHeight] = useElementHeight();

  // // debug
  // useEffect(() => {
  //   console.log('outerHeight (measured):', outerHeight);
  // }, [outerHeight]);
  // useEffect(() => {
  //   console.log('innerHeight (measured):', innerHeight);
  // }, [innerHeight]);
  // useEffect(() => {
  //   console.log('isExpanded:', isExpanded);
  // }, [isExpanded]);

  if (type === 'text') {
    if (isEditing) {
      return (
        <textarea
          value={editContent}
          onChange={(e) => onEditChange(e.target.value)}
          className="w-full font-mono text-sm bg-gray-50 dark:bg-gray-700 p-3 rounded-lg border dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-white"
          rows={3}
        />
      );
    }

    return (
      <div className="relative group">
        <div
          ref={outerRef}
          className={clsx(
            'font-mono text-sm bg-gray-50 dark:bg-gray-700 p-3 rounded-lg cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600 text-gray-900 dark:text-white whitespace-pre',
            isExpanded ? 'h-auto' : 'max-h-[160px]', //`max-h-${MAX_HEIGHT}`,
            'transition-all duration-200 overflow-x-auto overflow-y-clip w-full',
            'scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600 scrollbar-track-gray-100 dark:scrollbar-track-gray-800'
          )}
          onClick={onCopy}
          title={t('common:actions.copy')}
        >
          <div ref={innerRef} className="min-w-0 break-words">
            {content}
          </div>
          
          {/* Gradient fade when content is clipped */}
          {/* {!isExpanded && (
            <div className="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-gray-50 dark:from-gray-700 to-transparent pointer-events-none" />
          )} */}
        </div>

        {/* Controls container */}
        {innerHeight > outerHeight ? (
          <div className="absolute -bottom-8 right-0 translate-x-4 flex items-center justify-center gap-2 p-2">
            <button 
              className="h-5 w-12 rounded bg-gray-200 dark:bg-gray-700 hover:bg-gray-50 flex items-center justify-center shadow-sm border border-gray-400 dark:border-gray-500 hover:border-amber-600 dark:hover:border-amber-300 opacity-80 group-hover:opacity-100"
              onClick={(e) => {
                e.stopPropagation();
                setIsExpanded(!isExpanded);
              }}
              title={t('common:actions.expand')}
            >
              <ChevronDownIcon className="w-5 h-5 text-amber-500 dark:text-amber-400 rounded shadow text-md leading-4 font-bold text-shadow-sm" />
            </button>
          </div>
        ) : (isExpanded && (
          <div className="absolute -bottom-8 right-0 translate-x-4 flex items-center justify-center gap-2 p-2">
            <button 
              className="h-5 w-12 rounded bg-gray-200 dark:bg-gray-700 hover:bg-gray-50 flex items-center justify-center shadow-sm border border-gray-400 dark:border-gray-500 hover:border-amber-600 dark:hover:border-amber-300 opacity-80 group-hover:opacity-100"
              onClick={(e) => {
                e.stopPropagation();
                setIsExpanded(!isExpanded);
              }}
              title={t('common:actions.collapse')}
            >
              <ChevronUpIcon className="w-5 h-5 text-amber-500 dark:text-amber-400 rounded shadow text-md leading-4 font-bold text-shadow-sm" />
            </button>
          </div>
        ))}
      </div>
    );
  } else {
    // return a generic "work in progress" generic text block
    return (
      <div className="w-full h-full flex items-center justify-center">
        <div className="text-gray-500 dark:text-gray-400">
          {t('clipboard:image.workInProgress')}
        </div>
      </div>
    );
  }
};

const ClipboardItem = ({ item, index }) => {
  const { deviceId, deleteItem, editItem } = useSession();
  const { t, i18n } = useTranslation(['common', 'clipboard']);
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(item.content);
  const [showConflict, setShowConflict] = useState(false);
  const [conflictData, setConflictData] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  
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
    setShowDeleteConfirm(true);
  };

  const handleDeleteConfirm = async () => {
    await deleteItem(item.id);
    toast.success(t('clipboard:clipboard.deleted'));
  };

  return (
    <>
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border dark:border-gray-700 p-4 mb-4">
        <div className="flex justify-between items-start mb-2">
          <div className="text-sm text-gray-500 dark:text-gray-400">
            <span className="mr-1">
              {index <= 9 && (
                <KeyLabel keyString={`${index}`} />
              )}
            </span>
            <span>
              {formatDate(item.createdAt, 'PPpp', i18n.language)}
            </span>
            <span className="ml-2 text-gray-400 flex items-center gap-1">
              from{' '}
              {isOwner && (
                <UserIcon className="h-4 w-4 text-blue-600" />
              )}
              <span className={isOwner ? 'font-semibold text-blue-600' : ''}>
                {item.deviceName}
              </span>
            </span>
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

        <ClipboardContent
          content={item.content}
          type={item.type}
          onCopy={handleCopy}
          isEditing={isEditing}
          editContent={editContent}
          onEditChange={setEditContent}
        />
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

      <ConfirmationDialog
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={handleDeleteConfirm}
        title={t('clipboard:clipboard.deleteTitle')}
        message={t('clipboard:clipboard.deleteMessage')}
        type="danger"
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

  // Sort items by latest modified (descending)
  const sortedItems = [...items].sort((a, b) => {
    const aTime = new Date(a.lastModified || a.createdAt).getTime();
    const bTime = new Date(b.lastModified || b.createdAt).getTime();
    return bTime - aTime;
  });

  return (
    <div className="w-full">
      {sortedItems.map((item, index) => (
        <ClipboardItem key={item.id} item={item} index={index + 1} />
      ))}
    </div>
  );
}; 