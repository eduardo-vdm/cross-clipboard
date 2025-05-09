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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full p-6">
        <h2 className="text-xl font-semibold mb-4">
          {t('clipboard:conflict.title')}
        </h2>
        <p className="text-gray-600 mb-6">
          {t('clipboard:conflict.description')}
        </p>

        <div className="grid grid-cols-2 gap-4 mb-6">
          <div>
            <h3 className="font-medium mb-2">
              {t('clipboard:conflict.current')} 
              <span className="text-sm text-gray-500 ml-2">
                ({t('clipboard:conflict.version')} {currentVersion})
              </span>
            </h3>
            <div className="bg-gray-50 p-3 rounded border h-40 overflow-y-auto whitespace-pre-wrap">
              {currentContent}
            </div>
          </div>
          <div>
            <h3 className="font-medium mb-2">
              {t('clipboard:conflict.yours')}
              <span className="text-sm text-gray-500 ml-2">
                ({t('clipboard:conflict.edited')})
              </span>
            </h3>
            <div className="bg-gray-50 p-3 rounded border h-40 overflow-y-auto whitespace-pre-wrap">
              {yourContent}
            </div>
          </div>
        </div>

        <div className="text-sm text-gray-500 mb-4">
          {t('clipboard:conflict.explanation')}
        </div>

        <div className="flex justify-end gap-3">
          <button
            onClick={onCancel}
            className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
          >
            {t('common:actions.cancel')}
          </button>
          <button
            onClick={() => onResolve('current')}
            className="px-4 py-2 border border-blue-300 rounded-md text-blue-700 hover:bg-blue-50"
          >
            {t('clipboard:conflict.keepCurrent')}
          </button>
          <button
            onClick={() => onResolve('yours')}
            className="px-4 py-2 bg-blue-600 border border-transparent rounded-md text-white hover:bg-blue-700"
          >
            {t('clipboard:conflict.useYours')}
          </button>
        </div>
      </div>
    </div>
  );
}; 