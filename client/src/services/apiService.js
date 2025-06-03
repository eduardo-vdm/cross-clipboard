/**
 * API Service for interacting with the backend
 * Implements the same interface as mockService for easy swapping
 */
import { API_URL } from '../env';

//// TODO: Auth helpers to be refactored in a more modular way
// Internal token store
let authToken = null;
let authTokenExpiresAt = null;

// Validate the token is still fresh
const getValidToken = () => {
  if (!authToken || !authTokenExpiresAt) return null;
  const now = Date.now();
  const expires = new Date(authTokenExpiresAt).getTime();
  return now < expires ? authToken : null;
};

// Pull token and expiration from server response headers
const updateTokenFromHeaders = (headers) => {
  const newToken = headers.get('X-Token');
  const newExpiresAt = headers.get('X-Token-Expires-At');
  if (newToken && newExpiresAt) {
    authToken = newToken;
    authTokenExpiresAt = newExpiresAt;
  }
};

const fetchWithAuth = async (url, options = {}) => {
  const token = getValidToken();
  const headers = new Headers(options.headers || {});

  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const response = await fetch(url, {
    ...options,
    headers
  });
  
  updateTokenFromHeaders(response.headers);
  return response;
};
//// -> End of auth helpers (to be refactored)

// Helper function to handle API responses and errors
const handleResponse = async (response) => {
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({
      error: `HTTP error ${response.status}`
    }));
    
    if (response.status === 409) {
      // Special case for conflict errors
      throw {
        type: 'CONFLICT',
        message: 'Item has been modified',
        currentItem: {
          content: errorData.serverContent
        },
        currentVersion: errorData.serverVersion
      };
    }
    
    // Handle specific session errors
    if (response.status === 404 && errorData.name === 'SessionNotFoundError') {
      throw {
        type: 'SESSION_NOT_FOUND',
        message: errorData.error || 'Session not found'
      };
    }
    
    if (response.status === 410 && errorData.name === 'SessionArchivedException') {
      throw {
        type: 'SESSION_ARCHIVED',
        message: errorData.error || 'Session has expired'
      };
    }
    
    // Handle specific item errors
    if (response.status === 404 && errorData.name === 'ItemNotFoundError') {
      throw {
        type: 'ITEM_NOT_FOUND',
        message: errorData.error || 'Item not found'
      };
    }
    
    throw new Error(errorData.error || `HTTP error ${response.status}`);
  } else {
    // If the response is ok, update the token (this maybe needs revision, also can be done if the response is not ok)
    updateTokenFromHeaders(response.headers); 
  }
  
  if (response.status === 204) {
    // No content
    return true;
  }
  
  return response.json();
};

export const apiService = {

  /**
   * Ping the backend to check if it's ready
   * @returns {Promise<boolean>} True if backend is ready, false otherwise
   */
  ping: async () => {
    const response = await fetch(`${API_URL}/ping`);
    return response.ok;
  },

  /**
   * Create a new session
   * @param {string} deviceId - The device ID
   * @returns {Promise<{code: string}>} Session info with 6-digit code
   */
  createSession: async (deviceId) => {
    const response = await fetchWithAuth(`${API_URL}/api/sessions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ deviceId })
    });
    
    return handleResponse(response);
  },
  
  /**
   * Join an existing session
   * @param {string} code - 6-digit session code
   * @param {string} deviceId - The device ID
   * @returns {Promise<{session: Object, items: Array}>} Session and items
   */
  joinSession: async (code, deviceId) => {
    try {
      // First try to get the session by code
      const getResponse = await fetchWithAuth(`${API_URL}/api/sessions/${code}`);
      const session = await handleResponse(getResponse);
      
      // Then get the items
      const itemsResponse = await fetchWithAuth(`${API_URL}/api/sessions/${code}/items`);
      const items = await handleResponse(itemsResponse);
      
      return { 
        session, 
        items 
      };
    } catch (error) {
      // Improve error handling for session-related errors
      if (error.type === 'SESSION_NOT_FOUND') {
        throw error;
      }
      
      if (error.type === 'SESSION_ARCHIVED') {
        throw error;
      }
      
      throw error;
    }
  },
  
  /**
   * Get items from a session
   * @param {string} code - 6-digit session code
   * @returns {Promise<Array>} Array of items
   */
  getItems: async (code) => {
    const response = await fetchWithAuth(`${API_URL}/api/sessions/${code}/items`);
    return handleResponse(response);
  },
  
  /**
   * Add a new item to the session
   * @param {string} code - 6-digit session code
   * @param {string} content - Item content
   * @param {string} type - Item type (text or image)
   * @param {string} deviceId - The device ID
   * @returns {Promise<Object>} Created item
   */
  addItem: async (code, content, type, deviceId, deviceName) => {
    // The server now requires deviceId for ownership tracking
    const response = await fetchWithAuth(`${API_URL}/api/sessions/${code}/items`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ 
        content, 
        type,
        deviceId,
        deviceName
      })
    });
    
    return handleResponse(response);
  },
  
  /**
   * Edit an existing item
   * @param {string} code - 6-digit session code
   * @param {string} itemId - Item ID
   * @param {string} content - New content
   * @param {string} deviceId - The device ID
   * @param {number} version - Item version for concurrency control
   * @returns {Promise<Object>} Updated item with new version
   */
  editItem: async (code, itemId, content, deviceId, version) => {
    // The server now requires deviceId for ownership verification
    const response = await fetchWithAuth(`${API_URL}/api/sessions/${code}/items/${itemId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ 
        content,
        version,
        deviceId
      })
    });
    
    return handleResponse(response);
  },
  
  /**
   * Delete an item
   * @param {string} code - 6-digit session code
   * @param {string} itemId - Item ID
   * @param {string} deviceId - The device ID
   * @returns {Promise<boolean>} Success indicator
   */
  deleteItem: async (code, itemId, deviceId) => {
    // The server now requires deviceId for ownership verification
    const response = await fetchWithAuth(`${API_URL}/api/sessions/${code}/items/${itemId}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ deviceId })
    });
    
    return handleResponse(response);
  },

  /**
   * Check if a session exists by code and it's valid
   * @param {string} sessionCode - 6-digit session code
   * @returns {Promise<boolean>} True if session is valid, false otherwise
   * @throws {Error} If session not found or not valid
   */
  checkSession: async (sessionCode) => {
    try {
      // First try to get the session by code
      const getResponse = await fetchWithAuth(`${API_URL}/api/sessions/${sessionCode}`);
      const session = await handleResponse(getResponse);
      
      // Check if the session is valid
      if (session.isArchived) {
        throw new Error('SESSION_ARCHIVED');
      }
      
      return true;
    } catch (error) {
      // Improve error handling for session-related errors
      if (error.type === 'SESSION_NOT_FOUND') {
        throw error;
      }
      
      if (error.type === 'SESSION_ARCHIVED') {
        throw error;
      }
      
      throw error;
    }
  },

  /**
   * Wipe all items from a session
   * @param {string} sessionCode - 6-digit session code
   * @param {string} deviceId - The device ID
   * @returns {Promise<{success: boolean}>} Success indicator
   * @throws {Error} If session not found or user is not the creator
   */
  wipeSession: async (sessionCode, deviceId) => {
    const response = await fetchWithAuth(`${API_URL}/api/sessions/${sessionCode}/wipe`, {
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

    return handleResponse(response);
  },

  /**
   * Remove all items owned by the current device from a session
   * @param {string} sessionCode - 6-digit session code
   * @param {string} deviceId - The device ID
   * @returns {Promise<{success: boolean}>} Success indicator
   * @throws {Error} If session not found
   */
  removeMyItems: async (sessionCode, deviceId) => {
    const response = await fetchWithAuth(`${API_URL}/api/sessions/${sessionCode}/remove-my-items`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ deviceId }),
    });

    return handleResponse(response);
  }
};
