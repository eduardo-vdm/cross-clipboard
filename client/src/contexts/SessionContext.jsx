import { createContext, useContext, useState, useEffect, useRef } from 'react';
import toast from 'react-hot-toast';
import { getServiceConfig } from '../services/config';
import { useNavigate } from 'react-router-dom';
import { useSessionHistory } from '../hooks/useSessionHistory';

const SessionContext = createContext(null);
const POLLING_INTERVAL = 5000; // milliseconds

export const useSession = () => {
  const context = useContext(SessionContext);
  if (!context) {
    throw new Error('useSession must be used within a SessionProvider');
  }
  return context;
};

const getDeviceName = () => {
  const userAgent = navigator.userAgent;
  let deviceName = 'Unknown Device';
  
  // Try to get OS name
  if (userAgent.includes('Windows')) {
    deviceName = 'Windows';
  } else if (userAgent.includes('Mac')) {
    deviceName = 'Mac';
  } else if (userAgent.includes('Linux')) {
    deviceName = 'Linux';
  } else if (userAgent.includes('Android')) {
    deviceName = 'Android';
  } else if (userAgent.includes('iOS')) {
    deviceName = 'iOS';
  }
  
  return deviceName;
};

// Check if a session code has the right format
const isSessionCodeFormatValid = (code) => {
  return /^\d{6}$/.test(code);
};

export const SessionProvider = ({ children }) => {
  // Move service config inside the component for better testability
  const serviceConfig = getServiceConfig();
  const apiUrl = serviceConfig?.apiUrl;
  const service = serviceConfig?.service;
  const { addHistoryCode } = useSessionHistory();

  const [sessionCode, setSessionCode] = useState(null);
  const [deviceId, setDeviceId] = useState(null);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [deviceName, setDeviceName] = useState(getDeviceName());
  const [createdBy, setCreatedBy] = useState(null);

  // Refs to track initialization state
  const isInitialized = useRef(false);
  const initializationPromise = useRef(null);

  const navigate = useNavigate();
  const goToStart = (replace = true) => {
    setSessionCode(null);
    navigate('/start', { replace });
  }

  const goToSession = (code, replace = false) => {
    navigate(`/${code}`, { replace });
  }

  const setDeviceNameFromItems = (items) => {
    for (const item of items) {
      if (item?.deviceId === deviceId) {
        setDeviceName(item.deviceName);
        return;
      }
    }
  };

  useEffect(() => {
    setDeviceNameFromItems(items);
  }, [items]);

  useEffect(() => {
    console.log('deviceName', deviceName);
  }, [deviceName]);

  // Handle URL updates when session changes
  useEffect(() => {
    if (sessionCode) {
      goToSession(sessionCode);
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
          if (!response.ok) {
            const errorData = await response.json().catch(() => ({
              error: `HTTP error ${response.status}`
            }));
            
            // Handle session errors
            if (response.status === 404 && errorData.name === 'SessionNotFoundError') {
              setError('Session not found');
              
              // Clear the URL and session code
              goToStart();
              
              return;
            }
            
            if (response.status === 410 && errorData.name === 'SessionArchivedException') {
              setError('Session has expired');
              
              // Clear the URL and session code
              goToStart();
              
              return;
            }
            
            throw new Error(errorData.error || `HTTP error ${response.status}`);
          }
          data = await response.json();
        }
        
        setItems(data);
        setError(null);
      } catch (err) {
        setError(err.message);
        console.error('Error polling items:', err);
      }
    };

    // Initial poll
    pollItems();

    // Setup polling interval
    const interval = setInterval(pollItems, 2000);

    return () => clearInterval(interval);
  }, [sessionCode, apiUrl, service]);

  const createSession = async (explicitDeviceId = deviceId) => {
    setLoading(true);
    try {
      let data;
      if (service) {
        data = await service.createSession(explicitDeviceId);
      } else {
        const response = await fetch(`${apiUrl}/api/sessions`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ explicitDeviceId }),
        });
        if (!response.ok) throw new Error('Failed to create session');
        data = await response.json();
      }
      
      // Make sure code has the right format
      if (!isSessionCodeFormatValid(data?.code)) {
        throw new Error('Invalid session code received from server');
      }
      // add the code to the history if it has the right format, regardless of whether the session is valid or not
      addHistoryCode(data.code);

      setSessionCode(data.code);
      setCreatedBy(data.createdBy);
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
      let sessionData, itemsData;

      // add the code to the history if it has the right format, regardless of whether the session is valid or not
      if (isSessionCodeFormatValid(code)) {
        addHistoryCode(code);
      }

      if (service) {
        const result = await service.joinSession(code, deviceId);
        sessionData = result.session;
        itemsData = result.items;
      } else {
        // First try to get the session by code
        const sessionResponse = await fetch(`${apiUrl}/api/sessions/${code}`);
        if (!sessionResponse.ok) {
          const errorData = await sessionResponse.json().catch(() => ({
            error: `HTTP error ${sessionResponse.status}`
          }));
          
          if (sessionResponse.status === 404) {
            throw new Error('Session not found');
          }
          
          if (sessionResponse.status === 410) {
            throw new Error('Session has expired');
          }
          
          throw new Error('Failed to join session');
        }
        sessionData = await sessionResponse.json();
        
        // Then get the items
        const itemsResponse = await fetch(`${apiUrl}/api/sessions/${code}/items`);
        if (!itemsResponse.ok) throw new Error('Failed to get session items');
        itemsData = await itemsResponse.json();
      }
      
      setSessionCode(code);
      setItems(itemsData);
      setCreatedBy(sessionData.createdBy);
      setError(null);
      toast.success('Joined session successfully!');
      return {
        session: sessionData,
        items: itemsData
      };
    } catch (err) {
      setError(err.message);
      toast.error(`Failed to join session: ${err.message}`);
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
          let codeFromUrl = window.location.pathname.substring(1);
          // Only if the code is a valid 6-digit number string
          codeFromUrl = isSessionCodeFormatValid(codeFromUrl) ? codeFromUrl : null;

          if (codeFromUrl) {
            try {
              await joinSession(codeFromUrl);
            }  catch (err) {
              // If session doesn't exist or is invalid, redirect to start page
              toast.error(`${err.message}, session not found`);
              goToStart();
            }
          } else {
            goToStart();
          }
          
          isInitialized.current = true;
        } catch (error) {
          console.error('Initialization error:', error);
          toast.error(`Error initializing: ${error.message}`);
        }
      })();

      initializationPromise.current = promise;
      await promise;
    };

    initializeSession();
  }, []);

  const addItem = async (type, content) => {
    setLoading(true);
    try {
      let data;
      if (service) {
        data = await service.addItem(sessionCode, type, content, deviceId, deviceName);
      } else {
        const response = await fetch(`${apiUrl}/api/sessions/${sessionCode}/items`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ type, content, deviceId, deviceName }),
        });
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({
            error: `HTTP error ${response.status}`
          }));
          
          // Handle session errors
          if (response.status === 404 && errorData.name === 'SessionNotFoundError') {
            throw new Error('Session not found');
          }
          
          if (response.status === 410 && errorData.name === 'SessionArchivedException') {
            throw new Error('Session has expired');
          }
          
          throw new Error(errorData.error || `HTTP error ${response.status}`);
        }
        data = await response.json();
      }
      
      setItems(prev => [...prev, data]);
      setError(null);
      return data;
    } catch (err) {
      setError(err.message);
      toast.error(`Failed to add item: ${err.message}`);
      
      // If session doesn't exist or is invalid, redirect to start page
      if (err.message === 'Session not found' || err.message === 'Session has expired') {
        goToStart();
      }
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
            // Include deviceId for ownership verification
            body: JSON.stringify({ deviceId })
          }
        );
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({
            error: `HTTP error ${response.status}`
          }));
          
          // Handle session errors
          if (response.status === 404 && errorData.name === 'SessionNotFoundError') {
            throw new Error('Session not found');
          }
          
          if (response.status === 410 && errorData.name === 'SessionArchivedException') {
            throw new Error('Session has expired');
          }

          // Handle item not found
          if (response.status === 404 && errorData.name === 'ItemNotFoundError') {
            throw new Error('Item not found');
          }
          
          // Handle permission error
          if (response.status === 403) {
            throw new Error('You do not have permission to delete this item');
          }
          
          throw new Error('Failed to delete item');
        }
      }
      setItems(prev => prev.filter(item => item.id !== itemId));
      toast.success('Item deleted successfully!');
    } catch (err) {
      setError(err.message);
      toast.error(`Failed to delete item: ${err.message}`);
      
      // If session doesn't exist or is invalid, redirect to start page
      if (err.message === 'Session not found' || err.message === 'Session has expired') {
        goToStart();
      }
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
            // Include deviceId for ownership verification
            body: JSON.stringify({ content, version, deviceId }),
          }
        );
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({
            error: `HTTP error ${response.status}`
          }));
          
          // Handle session errors
          if (response.status === 404 && errorData.name === 'SessionNotFoundError') {
            throw new Error('Session not found');
          }
          
          if (response.status === 410 && errorData.name === 'SessionArchivedException') {
            throw new Error('Session has expired');
          }
          
          // Handle item not found
          if (response.status === 404 && errorData.name === 'ItemNotFoundError') {
            throw new Error('Item not found');
          }
          
          // Handle permission error
          if (response.status === 403) {
            throw new Error('You do not have permission to edit this item');
          }
          
          if (response.status === 409) {
            throw errorData;
          }
          
          throw new Error('Failed to edit item');
        }
        data = await response.json();
      }
      
      // Update the item in the list and resort to ensure correct order
      setItems(prev => {
        const updated = prev.map(item => 
          item.id === itemId ? { 
            ...item, 
            content, 
            version: data.version, 
            lastModified: data.lastModified,
            deviceId: item.deviceId // Keep the deviceId for ownership tracking
          } : item
        );
        
        // Sort by lastModified in descending order
        return updated.sort((a, b) => 
          new Date(b.lastModified) - new Date(a.lastModified)
        );
      });
      
      setError(null);
      toast.success('Item updated successfully!');
      return { success: true, data };
    } catch (err) {
      setError(err.message);
      
      // Handle conflict error
      if (err.type === 'CONFLICT') {
        return { 
          success: false, 
          conflict: true, 
          currentItem: err.currentItem,
          currentVersion: err.currentVersion 
        };
      }
      
      toast.error(`Failed to edit item: ${err.message}`);
      
      // If session doesn't exist or is invalid, redirect to start page
      if (err.message === 'Session not found' || err.message === 'Session has expired') {
        goToStart();
      }
      
      return { success: false, conflict: false };
    } finally {
      setLoading(false);
    }
  };

  const checkSession = async (code) => {
    setLoading(true);
    try {
      let result;
      if (service) {
        result = await service.checkSession(code);
      } else {
        throw new Error('Service not found');
      }
      
      setError(null);
      return result;
    } catch (err) {
      throw err;
    } finally {
      setLoading(false);
    }
  }

  const wipeSession = async () => {
    setLoading(true);
    try {
      if (service) {
        await service.wipeSession(sessionCode, deviceId);
      } else {
        const response = await fetch(`${apiUrl}/api/sessions/${sessionCode}/wipe`, {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ deviceId }),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({
            error: `HTTP error ${response.status}`
          }));
          
          if (response.status === 404) {
            throw new Error('Session not found');
          }
          
          if (response.status === 403) {
            throw new Error('Only the session creator can wipe all items');
          }
          
          throw new Error('Failed to wipe session');
        }
      }

      setItems([]);
      toast.success('Session wiped successfully!');
    } catch (err) {
      setError(err.message);
      toast.error(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const removeMyItems = async () => {
    setLoading(true);
    try {
      if (service) {
        await service.removeMyItems(sessionCode, deviceId);
      } else {
        const response = await fetch(`${apiUrl}/api/sessions/${sessionCode}/remove-my-items`, {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ deviceId }),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({
            error: `HTTP error ${response.status}`
          }));
          
          if (response.status === 404) {
            throw new Error('Session not found');
          }
          
          throw new Error('Failed to remove your items');
        }
      }

      // Remove items owned by this device
      setItems(prev => prev.filter(item => item.deviceId !== deviceId));
      toast.success('Your items have been removed successfully!');
    } catch (err) {
      setError(err.message);
      toast.error(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const value = {
    sessionCode,
    deviceId,
    deviceName,
    items,
    loading,
    error,
    createdBy,
    createSession,
    joinSession,
    addItem,
    deleteItem,
    editItem,
    wipeSession,
    removeMyItems,
    checkSession,
    isSessionCodeFormatValid,
  };

  return (
    <SessionContext.Provider value={value}>
      {children}
    </SessionContext.Provider>
  );
}; 