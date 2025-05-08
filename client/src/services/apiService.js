/**
 * API Service for interacting with the backend
 * Implements the same interface as mockService for easy swapping
 */
import { API_URL } from '../env';

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
    
    throw new Error(errorData.error || `HTTP error ${response.status}`);
  }
  
  if (response.status === 204) {
    // No content
    return true;
  }
  
  return response.json();
};

export const apiService = {
  /**
   * Create a new session
   * @param {string} deviceId - The device ID
   * @returns {Promise<{code: string}>} Session info
   */
  createSession: async (deviceId) => {
    const response = await fetch(`${API_URL}/api/sessions`, {
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
   * @param {string} code - Session code
   * @param {string} deviceId - The device ID
   * @returns {Promise<{items: Array}>} Session items
   */
  joinSession: async (code, deviceId) => {
    // First try to get the session
    const getResponse = await fetch(`${API_URL}/api/sessions/${code}`);
    const session = await handleResponse(getResponse);
    
    // Then get the items
    const itemsResponse = await fetch(`${API_URL}/api/sessions/${code}/items`);
    const items = await handleResponse(itemsResponse);
    
    return { 
      session, 
      items 
    };
  },
  
  /**
   * Get items from a session
   * @param {string} code - Session code
   * @returns {Promise<Array>} Array of items
   */
  getItems: async (code) => {
    const response = await fetch(`${API_URL}/api/sessions/${code}/items`);
    return handleResponse(response);
  },
  
  /**
   * Add a new item to the session
   * @param {string} code - Session code
   * @param {string} content - Item content
   * @param {string} type - Item type (text or image)
   * @param {string} deviceId - The device ID
   * @returns {Promise<Object>} Created item
   */
  addItem: async (code, content, type, deviceId) => {
    const response = await fetch(`${API_URL}/api/sessions/${code}/items`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ 
        content, 
        type,
        deviceId 
      })
    });
    
    return handleResponse(response);
  },
  
  /**
   * Edit an existing item
   * @param {string} code - Session code
   * @param {string} itemId - Item ID
   * @param {string} content - New content
   * @param {string} deviceId - The device ID
   * @param {number} version - Item version for concurrency control
   * @returns {Promise<Object>} Updated item
   */
  editItem: async (code, itemId, content, deviceId, version) => {
    const response = await fetch(`${API_URL}/api/sessions/${code}/items/${itemId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ 
        content, 
        deviceId,
        version 
      })
    });
    
    return handleResponse(response);
  },
  
  /**
   * Delete an item
   * @param {string} code - Session code
   * @param {string} itemId - Item ID
   * @param {string} deviceId - The device ID
   * @returns {Promise<boolean>} Success indicator
   */
  deleteItem: async (code, itemId, deviceId) => {
    const response = await fetch(`${API_URL}/api/sessions/${code}/items/${itemId}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ deviceId })
    });
    
    return handleResponse(response);
  }
}; 