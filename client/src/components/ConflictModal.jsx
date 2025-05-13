import React from 'react';
import { useTranslation } from 'react-i18next';

export const ConflictModal = ({ 
  show, 
  currentContent, 
  yourContent, 
  currentVersion,
  onResolve,
  onCancel 
}) => {
  const { t } = useTranslation(['common', 'clipboard']);
  
  if (!show) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 dark:bg-opacity-75 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full p-6 border dark:border-gray-700">
        <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">
          {t('clipboard:conflict.title')}
        </h2>
        <p className="text-gray-600 dark:text-gray-300 mb-6">
          {t('clipboard:conflict.description')}
        </p>

        <div className="grid grid-cols-2 gap-4 mb-6">
          <div>
            <h3 className="font-medium mb-2 text-gray-900 dark:text-white">
              {t('clipboard:conflict.current')} 
              <span className="text-sm text-gray-500 dark:text-gray-400 ml-2">
                ({t('clipboard:conflict.version')} {currentVersion})
              </span>
            </h3>
            <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded border dark:border-gray-600 h-40 overflow-y-auto whitespace-pre-wrap text-gray-900 dark:text-white">
              {currentContent}
            </div>
          </div>
          <div>
            <h3 className="font-medium mb-2 text-gray-900 dark:text-white">
              {t('clipboard:conflict.yours')}
              <span className="text-sm text-gray-500 dark:text-gray-400 ml-2">
                ({t('clipboard:conflict.edited')})
              </span>
            </h3>
            <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded border dark:border-gray-600 h-40 overflow-y-auto whitespace-pre-wrap text-gray-900 dark:text-white">
              {yourContent}
            </div>
          </div>
        </div>

        <div className="text-sm text-gray-500 dark:text-gray-400 mb-4">
          {t('clipboard:conflict.explanation')}
        </div>

        <div className="flex justify-end gap-3">
          <button
            onClick={onCancel}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700"
          >
            {t('common:actions.cancel')}
          </button>
          <button
            onClick={() => onResolve('current')}
            className="px-4 py-2 border border-blue-300 dark:border-blue-600 rounded-md text-blue-700 dark:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-900/30"
          >
            {t('clipboard:conflict.keepCurrent')}
          </button>
          <button
            onClick={() => onResolve('yours')}
            className="px-4 py-2 bg-blue-600 dark:bg-blue-500 border border-transparent rounded-md text-white hover:bg-blue-700 dark:hover:bg-blue-600"
          >
            {t('clipboard:conflict.useYours')}
          </button>
        </div>
      </div>
    </div>
  );
}; 