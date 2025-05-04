import { useSession } from '../contexts/SessionContext';
import { useTranslation } from 'react-i18next';
import { LanguageSwitcher } from './LanguageSwitcher';
import { toast } from 'react-hot-toast';

export const SessionHeader = () => {
  const { sessionCode } = useSession();
  const { t } = useTranslation('clipboard');

  const handleCopyLink = async () => {
    const url = new URL(window.location);
    url.searchParams.set('session', sessionCode);
    await navigator.clipboard.writeText(url.toString());
    toast.success(t('clipboard.copied'));
  };

  if (!sessionCode) return null;

  return (
    <div className="bg-white border-b p-4 flex justify-between items-center">
      <div className="flex items-center gap-4">
        <h1 className="text-xl font-semibold">
          {t('session.title')} 
          <span className="font-mono ml-2">{sessionCode}</span>
        </h1>
        <button
          onClick={handleCopyLink}
          className="text-blue-500 hover:text-blue-600 text-sm"
        >
          {t('session.copyLink')}
        </button>
      </div>
      <LanguageSwitcher />
    </div>
  );
}; 