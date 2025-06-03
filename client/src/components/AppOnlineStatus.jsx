import { useBackendReady } from '../hooks/useBackendReady';
import { useTranslation } from 'react-i18next'

const AppOnlineStatus = ({ children }) => {
  const { isWarmingUp } = useBackendReady();
  const { t } = useTranslation('common');

  return (
    <>
      {isWarmingUp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm">
          <div className="flex flex-col items-center justify-center gap-4">
            <div className="w-10 h-10 border-4 border-white border-t-transparent rounded-full animate-spin" />
            <p className="text-white text-sm font-mono">{t('app.warmingUp')}</p>
          </div>
        </div>
      )}
      {children}
    </>
  );
};

export default AppOnlineStatus;