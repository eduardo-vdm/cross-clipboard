import React from 'react';
import { useTranslation } from 'react-i18next';

export const ConflictModal = ({ 
  show, 
  currentContent, 
  yourContent, 
  onResolve,
  onCancel 
}) => {
  const { t } = useTranslation(['common', 'clipboard']);
  
  if (!show) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full p-6">
        <h2 className="text-xl font-semibold mb-4">
          {t('clipboard:conflict.title')}
        </h2>
        <p className="text-gray-600 mb-6">
          {t('clipboard:conflict.description')}
        </p>

        <div className="grid grid-cols-2 gap-4 mb-6">
          <div>
            <h3 className="font-medium mb-2">{t('clipboard:conflict.current')}</h3>
            <div className="bg-gray-50 p-3 rounded border">
              {currentContent}
            </div>
          </div>
          <div>
            <h3 className="font-medium mb-2">{t('clipboard:conflict.yours')}</h3>
            <div className="bg-gray-50 p-3 rounded border">
              {yourContent}
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3">
          <button
            onClick={onCancel}
            className="btn btn-secondary"
          >
            {t('common:actions.cancel')}
          </button>
          <button
            onClick={() => onResolve('current')}
            className="btn btn-secondary"
          >
            {t('clipboard:conflict.keepCurrent')}
          </button>
          <button
            onClick={() => onResolve('yours')}
            className="btn btn-primary"
          >
            {t('clipboard:conflict.useYours')}
          </button>
        </div>
      </div>
    </div>
  );
}; 