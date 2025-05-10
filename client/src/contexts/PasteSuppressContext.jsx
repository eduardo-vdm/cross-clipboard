import { createContext, useContext, useState, useEffect } from 'react';

/**
 * Context for globally suppressing paste operations in the application
 */
const PasteSuppressContext = createContext({
  isPasteSuppressed: false,
  suppressPaste: () => {},
  enablePaste: () => {},
});

/**
 * Hook to access paste suppression state and functions
 * @returns {Object} Object containing isPasteSuppressed state and control functions
 */
export const usePasteSuppress = () => {
  const context = useContext(PasteSuppressContext);
  if (!context) {
    throw new Error('usePasteSuppress must be used within a PasteSuppressProvider');
  }
  return context;
};

/**
 * Provider component that allows children to access paste suppression state
 * @param {Object} props - Component props
 * @param {React.ReactNode} props.children - Child components
 */
export const PasteSuppressProvider = ({ children }) => {
  const [isPasteSuppressed, setIsPasteSuppressed] = useState(false);

  // Global event listener to handle paste events
  useEffect(() => {
    if (!isPasteSuppressed) return;

    const handlePaste = (e) => {
      // Prevent the default paste action when suppressed
      e.preventDefault();
      e.stopPropagation();
    };

    // Capture in the capturing phase to ensure it runs before other handlers
    document.addEventListener('paste', handlePaste, { capture: true });
    
    return () => {
      document.removeEventListener('paste', handlePaste, { capture: true });
    };
  }, [isPasteSuppressed]);

  const suppressPaste = () => setIsPasteSuppressed(true);
  const enablePaste = () => setIsPasteSuppressed(false);

  const value = {
    isPasteSuppressed,
    suppressPaste,
    enablePaste,
  };

  return (
    <PasteSuppressContext.Provider value={value}>
      {children}
    </PasteSuppressContext.Provider>
  );
}; 