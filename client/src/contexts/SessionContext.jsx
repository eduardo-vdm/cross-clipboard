import { createContext, useContext, useState, useEffect, useRef } from 'react';
import toast from 'react-hot-toast';
import { getServiceConfig } from '../services/config';

const SessionContext = createContext(null);
const POLLING_INTERVAL = 5000; // 5 seconds

export const useSession = () => {
  const context = useContext(SessionContext);
  if (!context) {
    throw new Error('useSession must be used within a SessionProvider');
  }
  return context;
};

export const SessionProvider = ({ children }) => {
  // Move service config inside the component for better testability
  const serviceConfig = getServiceConfig();
  const apiUrl = serviceConfig?.apiUrl;
  const service = serviceConfig?.service;

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
          if (!response.ok) {
            const errorData = await response.json().catch(() => ({
              error: `HTTP error ${response.status}`
            }));
            
            // Handle session errors
            if (response.status === 404 && errorData.name === 'SessionNotFoundError') {
              setError('Session not found');
              return;
            }
            
            if (response.status === 410 && errorData.name === 'SessionArchivedException') {
              setError('Session has expired');
              return;
            }
            
            throw new Error('Failed to fetch items');
          }
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
  }, [sessionCode, service, apiUrl]);

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
      
      // Make sure we have the 6-digit code
      if (!data.code || data.code.length !== 6) {
        throw new Error('Invalid session code received from server');
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
      let sessionData, itemsData;
      
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
          const urlParams = new URLSearchParams(window.location.search);
          const codeFromUrl = urlParams.get('session');

          if (codeFromUrl) {
            try {
              // Validate if session code is in the correct format (6 digits)
              if (!/^\d{6}$/.test(codeFromUrl)) {
                throw new Error('Invalid session code format');
              }
              
              await joinSession(codeFromUrl);
            } catch (err) {
              // If session doesn't exist or is invalid, show message and create new one
              toast.error(`${err.message}, creating a new session for you`);
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
          toast.error(`Error initializing: ${error.message}`);
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
          body: JSON.stringify({ content, type }),
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
          
          throw new Error('Failed to add item');
        }
        data = await response.json();
      }
      setItems(prev => [data, ...prev]);
      setError(null);
      toast.success('Item added successfully!');
    } catch (err) {
      setError(err.message);
      toast.error(`Failed to add item: ${err.message}`);
      
      // If session is missing or expired, force user to create a new one
      if (err.message === 'Session not found' || err.message === 'Session has expired') {
        const url = new URL(window.location);
        url.searchParams.delete('session');
        window.history.replaceState({}, '', url);
        setSessionCode(null);
        
        // Wait a bit before showing the creation toast to avoid toast overlap
        setTimeout(() => {
          toast.error('Starting a new session...');
          createSession();
        }, 2000);
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
            }
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
          
          throw new Error('Failed to delete item');
        }
      }
      setItems(prev => prev.filter(item => item.id !== itemId));
      toast.success('Item deleted successfully!');
    } catch (err) {
      setError(err.message);
      toast.error(`Failed to delete item: ${err.message}`);
      
      // If session is missing or expired, force user to create a new one
      if (err.message === 'Session not found' || err.message === 'Session has expired') {
        const url = new URL(window.location);
        url.searchParams.delete('session');
        window.history.replaceState({}, '', url);
        setSessionCode(null);
        
        // Wait a bit before showing the creation toast to avoid toast overlap
        setTimeout(() => {
          toast.error('Starting a new session...');
          createSession();
        }, 2000);
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
            body: JSON.stringify({ content, version }),
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
          
          if (response.status === 409) {
            throw errorData;
          }
          
          throw new Error('Failed to edit item');
        }
        data = await response.json();
      }
      
      // Update the UI with the new version received from server
      setItems(prev => prev.map(item => 
        item.id === itemId ? { ...item, version: data.version, lastModified: data.lastModified } : item
      ));
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
      
      // If session is missing or expired, force user to create a new one
      if (err.message === 'Session not found' || err.message === 'Session has expired') {
        const url = new URL(window.location);
        url.searchParams.delete('session');
        window.history.replaceState({}, '', url);
        setSessionCode(null);
        
        // Wait a bit before showing the creation toast to avoid toast overlap
        setTimeout(() => {
          toast.error('Starting a new session...');
          createSession();
        }, 2000);
      }
      
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