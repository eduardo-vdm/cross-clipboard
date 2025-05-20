import { useState, useEffect, useCallback } from 'react';
import { getServiceConfig } from '../services/config';

// import { useRequestQueue } from './useRequestQueue';
// TODO: Refactor to use useRequestQueue

const MAX_HISTORY_LENGTH = 20;
const MAX_CACHE_LENGTH = 100;
const USE_LOCAL_STORAGE_CACHE = false;
const HISTORY_KEY = 'sessionHistory';
const CACHE_KEY = 'sessionValidityCache';

function loadFromStorage(key, fallback) {
  try {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : fallback;
  } catch {
    return fallback;
  }
}

function saveToStorage(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {}
}

export function useSessionHistory({
  maxHistoryLength = MAX_HISTORY_LENGTH,
  maxCacheLength = MAX_CACHE_LENGTH,
  useLocalStorageCache = USE_LOCAL_STORAGE_CACHE,
} = {}) {
  const serviceConfig = getServiceConfig();
  const service = serviceConfig?.service;

  const [allCodes, setAllCodes] = useState(() => loadFromStorage(HISTORY_KEY, []));
  const [validityCache, setValidityCache] = useState(() =>
    useLocalStorageCache ? loadFromStorage(CACHE_KEY, []) : []
  );
  const [validCodes, setValidCodes] = useState([]);
  const [invalidCodes, setInvalidCodes] = useState([]);

  // Save history and cache to localStorage if enabled
  useEffect(() => {
    saveToStorage(HISTORY_KEY, allCodes);
  }, [allCodes]);
  useEffect(() => {
    if (useLocalStorageCache) saveToStorage(CACHE_KEY, validityCache);
  }, [validityCache, useLocalStorageCache]);

  // Add or update a code in history
  const addCode = useCallback((code) => {
    setAllCodes(prev => {
      const filtered = prev.filter(c => c !== code);
      const updated = [code, ...filtered].slice(-maxHistoryLength);
      return updated;
    });
  }, [maxHistoryLength]);

  // Remove a code from history and cache
  const removeCode = useCallback((code) => {
    setAllCodes(prev => prev.filter(c => c !== code));
    setValidityCache(prev => prev.filter(entry => entry.code !== code));
  }, []);

  // Refresh the validity cache for all codes
  const refreshCache = useCallback(async () => {
    const results = await Promise.all(
      allCodes.map(async (code) => {
        try {
          const valid = await service.checkSession(code);
          return { code, valid: !!valid, checkDatetime: new Date().toISOString() };
        } catch {
          return { code, valid: false, checkDatetime: new Date().toISOString() };
        }
      })
    );
    setValidityCache(results.slice(-maxCacheLength));
  }, [allCodes, service, maxCacheLength]);

  // Return if the code is in the history and it is valid
  const isCodeValid = useCallback((code) => {
    return allCodes.includes(code) && validityCache.find(e => e.code === code)?.valid;
  }, [allCodes, validityCache]);

  // On allCodes change, check validity for new codes
  useEffect(() => {
    let isMounted = true;
    const checkCodes = async () => {
      const now = new Date().toISOString();
      const newEntries = [];
      for (const code of allCodes) {
        let entry = validityCache.find(e => e.code === code);
        if (!entry) {
          try {
            const valid = await service.checkSession(code);
            entry = { code, valid: !!valid, checkDatetime: now };
          } catch {
            entry = { code, valid: false, checkDatetime: now };
          }
          newEntries.push(entry);
        }
      }
      if (isMounted && newEntries.length > 0) {
        setValidityCache(prev => {
          const filtered = prev.filter(e => !newEntries.some(ne => ne.code === e.code));
          return [...filtered, ...newEntries].slice(-maxCacheLength);
        });
      }
    };
    checkCodes();
    return () => { isMounted = false; };
  }, [allCodes, validityCache, service, maxCacheLength]);

  // Update valid/invalid arrays when cache or allCodes changes
  useEffect(() => {
    const valid = [];
    const invalid = [];
    for (const code of allCodes) {
      const entry = validityCache.find(e => e.code === code);
      if (entry) {
        if (entry.valid) valid.push(code);
        else invalid.push(code);
      }
    }
    setValidCodes(valid);
    setInvalidCodes(invalid);
  }, [allCodes, validityCache]);

  return {
    allHistoryCodes: allCodes,
    allHistoryValidCodes: validCodes,
    allHistoryInvalidCodes: invalidCodes,
    addHistoryCode: addCode,
    removeHistoryCode: removeCode,
    refreshHistoryCache: refreshCache,
    isHistoryCodeValid: isCodeValid,
  };
} 