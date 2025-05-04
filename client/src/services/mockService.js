import { mockItems } from './mockData';

// Simulate network delay
const delay = (ms = 500) => new Promise(resolve => setTimeout(resolve, ms));

// In-memory storage
let items = [...mockItems];
let currentSession = null;

export const mockService = {
  // Create a new session
  createSession: async (deviceId) => {
    await delay();
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    currentSession = { code, deviceId };
    items = [...mockItems]; // Reset items to initial state
    return { code };
  },

  // Join an existing session
  joinSession: async (code, deviceId) => {
    await delay();
    if (code !== currentSession?.code) {
      throw new Error('Invalid session code');
    }
    return { items };
  },

  // Get items for a session
  getItems: async (code) => {
    await delay();
    if (code !== currentSession?.code) {
      throw new Error('Invalid session code');
    }
    return items;
  },

  // Add a new item
  addItem: async (code, content, type, deviceId) => {
    await delay();
    if (code !== currentSession?.code) {
      throw new Error('Invalid session code');
    }

    const newItem = {
      id: Date.now().toString(),
      content,
      type,
      deviceId,
      createdAt: new Date().toISOString(),
    };

    items = [newItem, ...items];
    return newItem;
  },

  // Delete an item
  deleteItem: async (code, itemId, deviceId) => {
    await delay();
    if (code !== currentSession?.code) {
      throw new Error('Invalid session code');
    }

    const item = items.find(i => i.id === itemId);
    if (!item) {
      throw new Error('Item not found');
    }
    if (item.deviceId !== deviceId) {
      throw new Error('Not authorized to delete this item');
    }

    items = items.filter(i => i.id !== itemId);
    return true;
  },
};

// Helper to enable/disable mock service
export const useMockService = (enabled = true) => {
  if (!enabled) return null;
  
  return {
    apiUrl: 'mock://api',
    service: mockService,
  };
}; 