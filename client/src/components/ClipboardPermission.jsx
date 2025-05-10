import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';

/**
 * Gets the browser name from user agent
 * @returns {string} Browser name
 */
const getBrowserName = () => {
  const userAgent = navigator.userAgent.toLowerCase();
  
  if (userAgent.includes('firefox')) return 'Firefox';
  if (userAgent.includes('chrome') && !userAgent.includes('edg')) return 'Chrome';
  if (userAgent.includes('safari') && !userAgent.includes('chrome')) return 'Safari';
  if (userAgent.includes('edg')) return 'Edge';
  if (userAgent.includes('opera') || userAgent.includes('opr')) return 'Opera';
  if (userAgent.includes('vivaldi')) return 'Vivaldi';
  
  return ''; // Return empty string if browser not detected
};

/**
 * Gets the OS name from user agent
 * @returns {string} OS name
 */
const getOSName = () => {
  const userAgent = navigator.userAgent.toLowerCase();
  const platform = navigator.platform.toLowerCase();
  
  if (userAgent.includes('android')) return 'Android';
  if (userAgent.includes('iphone') || userAgent.includes('ipad') || userAgent.includes('ipod')) return 'iOS';
  if (userAgent.includes('windows') || platform.includes('win')) return 'Windows';
  if (userAgent.includes('mac') || platform.includes('mac')) return 'macOS';
  if (userAgent.includes('linux') || platform.includes('linux')) return 'Linux';
  
  return ''; // Return empty string if OS not detected
};

/**
 * ClipboardPermission component handles requesting and checking clipboard permissions
 * @returns {JSX.Element} The clipboard permission UI component
 */
export const ClipboardPermission = () => {
  const { t } = useTranslation('common');
  const [permissionState, setPermissionState] = useState('unknown');

  // Check for clipboard permission on mount
  useEffect(() => {
    checkPermission();
  }, []);

  /**
   * Checks the current status of clipboard permissions
   */
  const checkPermission = async () => {
    try {
      // Try to read clipboard as a permission check
      const result = await navigator.permissions.query({ name: 'clipboard-read' });
      setPermissionState(result.state);

      // Listen for changes to the permission
      result.addEventListener('change', () => {
        setPermissionState(result.state);
      });
    } catch (error) {
      // Fallback for browsers that don't support the permissions API
      try {
        await navigator.clipboard.read();
        setPermissionState('granted');
      } catch (error) {
        // Check if it's explicitly denied vs just not granted yet
        if (error.name === 'NotAllowedError') {
          setPermissionState('denied');
        } else {
          setPermissionState('prompt');
        }
      }
    }
  };

  /**
   * Requests clipboard permission from the user
   */
  const requestPermission = async () => {
    try {
      // Try to read from clipboard to trigger the permission prompt
      await navigator.clipboard.read();
      setPermissionState('granted');
    } catch (error) {
      // Update state if permission was denied
      if (error.name === 'NotAllowedError') {
        setPermissionState('denied');
      }
    }
  };

  // If permission is already granted or still checking, don't show anything
  if (permissionState === 'granted' || permissionState === 'unknown') {
    return null;
  }

  const isDenied = permissionState === 'denied';
  const browserName = getBrowserName();
  const osName = getOSName();
  
  // Build search query with available information
  let searchQuery = t('permissions.clipboard.searchQuery');
  if (browserName) searchQuery += ` ${browserName}`;
  if (osName) searchQuery += ` ${osName}`;

  return (
    <div className={`fixed bottom-0 left-0 right-0 ${isDenied ? 'bg-red-50 border-red-200' : 'bg-blue-50 border-blue-200'} p-4 border-t flex justify-between items-center`}>
      <div>
        <h3 className={`font-medium ${isDenied ? 'text-red-800' : 'text-blue-800'}`}>
          {t(isDenied ? 'permissions.clipboard.deniedTitle' : 'permissions.clipboard.title')}
        </h3>
        <p className={`text-sm ${isDenied ? 'text-red-600' : 'text-blue-600'}`}>
          {t(isDenied ? 'permissions.clipboard.deniedDescription' : 'permissions.clipboard.description')}
        </p>
      </div>
      {isDenied ? (
        <a 
          href="#" 
          onClick={(e) => {
            e.preventDefault();
            // Open a Google search for how to enable clipboard permissions
            window.open(`https://www.google.com/search?q=${encodeURIComponent(searchQuery)}`, '_blank');
          }}
          className="bg-red-600 hover:bg-red-700 text-white py-2 px-4 rounded-lg flex items-center gap-2"
        >
          {t('permissions.clipboard.searchHelp')}
          <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
          </svg>
        </a>
      ) : (
        <button
          onClick={requestPermission}
          className="bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg"
        >
          {t('permissions.clipboard.allow')}
        </button>
      )}
    </div>
  );
}; 