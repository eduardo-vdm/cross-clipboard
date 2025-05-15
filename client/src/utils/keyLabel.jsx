import { useEffect, useState } from 'react';
import { detectOSGroup, OS_GROUPS } from './detectOSGroup';

// Default class for the key label.
const DEFAULT_KEY_LABEL_CLASS = 'keyTip';
// Symbols that are used to split the key combination.
const COMBINATION_SYMBOLS = ['+', '-', '*', '/', '#'];

/**
 * Returns the label for a given key.
 * @param {string} key - The key to get the label for.
 * @param {string} osGroup - The OS group to get the label for.
 * @returns {string} The label for the key.
 */
function getOSKeyLabel(key, osGroup) {
  if (osGroup === OS_GROUPS.MACOS) {
    return key.replace('Ctrl', '\u2318');
  }
  return key;
}

/**
 * Returns as component the label for a given key or key combination.
 * If the key is a key combination, it will be split into its components and return only keys as formatted text and symbols like +, #, /, etc. as plain text.
 * @param {string} key - The key or key combination to get the label for.
 * @returns {React.ReactNode} The label for the key.
 */
function KeyLabel({ keyString, className = DEFAULT_KEY_LABEL_CLASS }) {
  const [osGroup, setOSGroup] = useState(detectOSGroup());

  useEffect(() => {
    setOSGroup(detectOSGroup());
  }, []);

  const keyParts = keyString.split(/(\+|-|\*|\/|#)/);

  return (
    <span>
      {keyParts.map((part, index) => (
        <span key={index} className={COMBINATION_SYMBOLS.includes(part) ? '' : 'keyTip'}>
          {getOSKeyLabel(part, osGroup)}
        </span>
      ))}
    </span>
  );
}

export default KeyLabel;
