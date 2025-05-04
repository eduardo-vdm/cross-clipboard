import { useSession } from '../contexts/SessionContext';
import { copyToClipboard } from '../utils/clipboard';

export const SessionHeader = () => {
  const { sessionCode } = useSession();

  const handleCopyLink = async () => {
    const url = `${window.location.origin}?session=${sessionCode}`;
    const success = await copyToClipboard(url);
    if (success) {
      // TODO: Show success toast
      console.log('Link copied!');
    }
  };

  const handleCopyCode = async () => {
    const success = await copyToClipboard(sessionCode);
    if (success) {
      // TODO: Show success toast
      console.log('Code copied!');
    }
  };

  if (!sessionCode) return null;

  return (
    <div className="bg-white shadow-sm border-b">
      <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h1 className="text-xl font-semibold">Session</h1>
          <div className="flex items-center gap-2">
            <code className="bg-gray-100 px-3 py-1 rounded-lg font-mono text-lg">
              {sessionCode}
            </code>
            <button
              onClick={handleCopyCode}
              className="btn btn-secondary text-sm"
            >
              Copy Code
            </button>
          </div>
        </div>
        <button
          onClick={handleCopyLink}
          className="btn btn-primary"
        >
          Share Link
        </button>
      </div>
    </div>
  );
}; 