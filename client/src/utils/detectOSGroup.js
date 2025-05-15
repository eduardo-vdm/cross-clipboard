import Bowser from 'bowser';

/**
 * Operating system groups names
 */
export const OS_GROUPS = {
  MOBILE: 'mobile',
  MACOS: 'macOS',
  WINDOWS_LINUX: 'Windows/Linux',
  OTHER: 'other',
};

/**
 * Cached operating system group value to avoid recomputing it on every call
 */
let cachedOSGroup = null;

/**
 * Detects the operating system group of the current device.
 * @returns {string} The operating system group.
 */
export function detectOSGroup() {
  if (cachedOSGroup) return cachedOSGroup;

  const browser = Bowser.getParser(window.navigator.userAgent);
  if (browser.getPlatformType(true) === 'mobile') {
    cachedOSGroup = OS_GROUPS.MOBILE;
  } else {
    const osName = browser.getOSName(true);
    if (osName === 'macos') cachedOSGroup = OS_GROUPS.MACOS;
    else if (['windows', 'linux'].includes(osName)) cachedOSGroup = OS_GROUPS.WINDOWS_LINUX;
    else cachedOSGroup = OS_GROUPS.OTHER;
  }

  return cachedOSGroup;
}