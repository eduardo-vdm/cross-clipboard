import { mockItems } from './mockData';

// Simulate network delay
const delay = (ms = 500) => new Promise(resolve => setTimeout(resolve, ms));

// In-memory storage
let items = [...mockItems];
let currentSession = null;
let itemVersions = new Map(); // Track item versions for conflict detection

export const mockService = {
  // Create a new session
  createSession: async (deviceId) => {
    await delay();
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    currentSession = { code, deviceId };
    items = [...mockItems];
    // Initialize versions for all items
    itemVersions = new Map(items.map(item => [item.id, 1]));
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
      version: 1,
    };

    items = [newItem, ...items];
    itemVersions.set(newItem.id, 1);
    return newItem;
  },

  // Edit an item
  editItem: async (code, itemId, content, deviceId, expectedVersion) => {
    await delay();
    if (code !== currentSession?.code) {
      throw new Error('Invalid session code');
    }

    const itemIndex = items.findIndex(i => i.id === itemId);
    if (itemIndex === -1) {
      throw new Error('Item not found');
    }

    const item = items[itemIndex];
    if (item?.deviceId !== deviceId) {
      throw new Error('Not authorized to edit this item');
    }

    const currentVersion = itemVersions.get(itemId);
    if (expectedVersion !== currentVersion) {
      // Return current item state along with conflict error
      throw {
        type: 'CONFLICT',
        message: 'Item has been modified',
        currentItem: item,
        currentVersion,
      };
    }

    const updatedItem = {
      ...item,
      content,
      version: currentVersion + 1,
      updatedAt: new Date().toISOString(),
    };

    items = [
      ...items.slice(0, itemIndex),
      updatedItem,
      ...items.slice(itemIndex + 1),
    ];
    itemVersions.set(itemId, currentVersion + 1);

    return updatedItem;
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
    itemVersions.delete(itemId);
    return true;
  },

  checkSession: async (sessionCode) => {
    const session = mockSessions.get(sessionCode);
    if (!session) {
      throw new Error('Session not found');
    }
    if (session.isExpired) {
      throw new Error('Session expired');
    }
    return true;
  },

  wipeSession: async (sessionCode, deviceId) => {
    const session = mockSessions.get(sessionCode);
    if (!session) {
      throw new Error('Session not found');
    }

    if (session.createdBy !== deviceId) {
      throw new Error('Only the session creator can wipe all items');
    }

    session.items = [];
    mockSessions.set(sessionCode, session);
    return { success: true };
  },

  removeMyItems: async (sessionCode, deviceId) => {
    const session = mockSessions.get(sessionCode);
    if (!session) {
      throw new Error('Session not found');
    }

    session.items = session.items.filter(item => item.deviceId !== deviceId);
    mockSessions.set(sessionCode, session);
    return { success: true };
  }
};

// Helper to enable/disable mock service
export const useMockService = (enabled = true) => {
  if (!enabled) return null;
  
  return {
    apiUrl: 'mock://api',
    service: mockService,
  };
}; 