import { useEffect, useState } from 'react';
import { getServiceConfig } from '../services/config';

/**
 * Hook to check if the backend is ready
 * @param {number} delayToShow - The delay to show the overlay
 * @returns {Object} - The isWarmingUp state
 */
export function useBackendReady(delayToShow = 1200) {
  const [isWarmingUp, setIsWarmingUp] = useState(true);
  const serviceConfig = getServiceConfig();
  const service = serviceConfig?.service;

  useEffect(() => {
    const controller = new AbortController();
    const showOverlayTimeout = setTimeout(() => {
      setIsWarmingUp(true); // show overlay if delay exceeds
    }, delayToShow);

    const check = async () => {
      try {
        console.log('>>>> Checking if backend is ready...');
        const isReady = await service.ping();
        console.log('>>>> Backend is ready:', isReady);
        if (!isReady) throw new Error('Backend not ready');
      } catch (err) {
        console.warn('>>>> Backend is not ready (error):', err);
      } finally {
        clearTimeout(showOverlayTimeout);
        setIsWarmingUp(false); // hide overlay either way
      }
    };

    check();

    return () => {
      controller.abort();
      clearTimeout(showOverlayTimeout);
    };
  }, [delayToShow]);

  return { isWarmingUp };
}
