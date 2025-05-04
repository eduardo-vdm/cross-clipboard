import { createContext, useContext, useState, useEffect, useRef } from 'react';
import toast from 'react-hot-toast';
import { getServiceConfig } from '../services/config';

const SessionContext = createContext(null);
const POLLING_INTERVAL = 5000; // 5 seconds

const { apiUrl, service } = getServiceConfig();

export const useSession = () => {
  const context = useContext(SessionContext);
  if (!context) {
    throw new Error('useSession must be used within a SessionProvider');
  }
  return context;
};

export const SessionProvider = ({ children }) => {
  const [sessionCode, setSessionCode] = useState(null);
  const [deviceId, setDeviceId] = useState(null);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // Refs to track initialization state
  const isInitialized = useRef(false);
  const initializationPromise = useRef(null);

  // Handle URL updates when session changes
  useEffect(() => {
    if (sessionCode) {
      const url = new URL(window.location);
      url.searchParams.set('session', sessionCode);
      window.history.replaceState({}, '', url);
    }
  }, [sessionCode]);

  // Setup polling for updates
  useEffect(() => {
    if (!sessionCode) return;

    const pollItems = async () => {
      try {
        let data;
        if (service) {
          data = await service.getItems(sessionCode);
        } else {
          const response = await fetch(`${apiUrl}/api/sessions/${sessionCode}/items`);
          if (!response.ok) throw new Error('Failed to fetch items');
          data = await response.json();
        }
        setItems(data);
        setError(null);
      } catch (err) {
        console.error('Polling error:', err);
        setError(err.message);
      }
    };

    const interval = setInterval(pollItems, POLLING_INTERVAL);
    pollItems(); // Initial poll

    return () => clearInterval(interval);
  }, [sessionCode]);

  const createSession = async () => {
    setLoading(true);
    try {
      let data;
      if (service) {
        data = await service.createSession(deviceId);
      } else {
        const response = await fetch(`${apiUrl}/api/sessions`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ deviceId }),
        });
        if (!response.ok) throw new Error('Failed to create session');
        data = await response.json();
      }
      setSessionCode(data.code);
      setError(null);
      toast.success('Session created successfully!');
      return data;
    } catch (err) {
      setError(err.message);
      toast.error(`Failed to create session: ${err.message}`);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const joinSession = async (code) => {
    setLoading(true);
    try {
      let data;
      if (service) {
        data = await service.joinSession(code, deviceId);
      } else {
        const response = await fetch(`${apiUrl}/api/sessions/${code}/join`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ deviceId }),
        });
        if (!response.ok) throw new Error('Failed to join session');
        data = await response.json();
      }
      setSessionCode(code);
      setItems(data.items);
      setError(null);
      toast.success('Joined session successfully!');
      return data;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Initialize deviceId and check for session code in URL
  useEffect(() => {
    const initializeSession = async () => {
      if (isInitialized.current) return;
      
      // If there's already an initialization in progress, wait for it
      if (initializationPromise.current) {
        await initializationPromise.current;
        return;
      }

      const promise = (async () => {
        try {
          // Generate or retrieve deviceId
          const storedDeviceId = localStorage.getItem('deviceId');
          const newDeviceId = storedDeviceId || Math.random().toString(36).substring(2, 15);
          
          if (!storedDeviceId) {
            localStorage.setItem('deviceId', newDeviceId);
          }
          setDeviceId(newDeviceId);

          // Check URL for session code
          const urlParams = new URLSearchParams(window.location.search);
          const codeFromUrl = urlParams.get('session');

          if (codeFromUrl) {
            try {
              await joinSession(codeFromUrl);
            } catch (err) {
              // If session doesn't exist, show message and create new one
              toast.error("That session doesn't exist, creating a new one for you");
              // Clear the URL
              const url = new URL(window.location);
              url.searchParams.delete('session');
              window.history.replaceState({}, '', url);
              // Create new session
              await createSession();
            }
          } else {
            await createSession();
          }
          
          isInitialized.current = true;
        } catch (error) {
          console.error('Initialization error:', error);
        }
      })();

      initializationPromise.current = promise;
      await promise;
      initializationPromise.current = null;
    };

    initializeSession();
  }, []); // Empty dependency array as this should only run once

  const addItem = async (content, type) => {
    setLoading(true);
    try {
      let data;
      if (service) {
        data = await service.addItem(sessionCode, content, type, deviceId);
      } else {
        const response = await fetch(`${apiUrl}/api/sessions/${sessionCode}/items`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ content, type, deviceId }),
        });
        if (!response.ok) throw new Error('Failed to add item');
        data = await response.json();
      }
      setItems(prev => [data, ...prev]);
      setError(null);
      toast.success('Item added successfully!');
    } catch (err) {
      setError(err.message);
      toast.error(`Failed to add item: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const deleteItem = async (itemId) => {
    try {
      if (service) {
        await service.deleteItem(sessionCode, itemId, deviceId);
      } else {
        const response = await fetch(
          `${apiUrl}/api/sessions/${sessionCode}/items/${itemId}`,
          {
            method: 'DELETE',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ deviceId }),
          }
        );
        if (!response.ok) throw new Error('Failed to delete item');
      }
      setItems(prev => prev.filter(item => item.id !== itemId));
      toast.success('Item deleted successfully!');
    } catch (err) {
      toast.error(`Failed to delete item: ${err.message}`);
    }
  };

  const editItem = async (itemId, content, version) => {
    setLoading(true);
    try {
      let data;
      if (service) {
        data = await service.editItem(sessionCode, itemId, content, deviceId, version);
      } else {
        const response = await fetch(
          `${apiUrl}/api/sessions/${sessionCode}/items/${itemId}`,
          {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ content, deviceId, version }),
          }
        );
        if (!response.ok) {
          const errorData = await response.json();
          if (errorData.type === 'CONFLICT') {
            throw errorData;
          }
          throw new Error('Failed to edit item');
        }
        data = await response.json();
      }
      
      setItems(prev => prev.map(item => 
        item.id === itemId ? data : item
      ));
      setError(null);
      toast.success('Item updated successfully!');
      return { success: true, data };
    } catch (err) {
      setError(err.message);
      if (err.type === 'CONFLICT') {
        return { 
          success: false, 
          conflict: true, 
          currentItem: err.currentItem,
          currentVersion: err.currentVersion 
        };
      }
      toast.error(`Failed to edit item: ${err.message}`);
      return { success: false, conflict: false };
    } finally {
      setLoading(false);
    }
  };

  const value = {
    sessionCode,
    deviceId,
    items,
    loading,
    error,
    createSession,
    joinSession,
    addItem,
    deleteItem,
    editItem,
  };

  return (
    <SessionContext.Provider value={value}>
      {children}
    </SessionContext.Provider>
  );
}; 