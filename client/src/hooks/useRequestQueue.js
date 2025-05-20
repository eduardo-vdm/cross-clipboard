// hooks/useRequestQueue.js
import { useEffect, useState } from 'react';

/**
 * Execute requests in order and not in parallel.
 * @returns {Object} - The queue, results, and isProcessing state.
 * @example
 * const { enqueue, results, isProcessing } = useRequestQueue();
 * enqueue(service.addItem, code, content, type, ...args);
 */
export function useRequestQueue() {
  const [queue, setQueue] = useState([]);
  const [results, setResults] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);

  const enqueue = (requestFn, ...args) => {
    setQueue(prev => [...prev, { requestFn, args }]);
  };

  useEffect(() => {
    if (queue.length === 0 || isProcessing) return;

    const processNext = async () => {
      setIsProcessing(true);
      const [{ requestFn, args }, ...rest] = queue;

      try {
        const result = await requestFn(...args);
        setResults(prev => [...prev, result]);
      } catch (error) {
        console.error('Request failed:', error);
        setResults(prev => [...prev, { error }]);
      } finally {
        setQueue(rest);
        setIsProcessing(false);
      }
    };

    processNext();
  }, [queue, isProcessing]);

  return {
    enqueue,
    results,
    isProcessing,
  };
}
