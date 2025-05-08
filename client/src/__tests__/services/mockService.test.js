import { describe, it, expect, beforeEach, vi } from 'vitest';
import { mockService } from '../../services/mockService';

describe('Mock Service', () => {
  const deviceId = 'test-device-id';
  let sessionCode;

  beforeEach(async () => {
    // Create a fresh session for each test
    vi.spyOn(Math, 'random').mockReturnValue(0.123456);
    const response = await mockService.createSession(deviceId);
    sessionCode = response.code;
  });

  it('should create a session with a 6-digit code', async () => {
    // Math.random is mocked to return 0.123456
    // The actual implementation uses: Math.floor(100000 + Math.random() * 900000).toString()
    // So with 0.123456, it should be: Math.floor(100000 + 0.123456 * 900000) = 211110
    expect(sessionCode).toBe('211110');
  });

  it('should add an item to the session', async () => {
    const content = 'Test content';
    const type = 'text';
    
    const newItem = await mockService.addItem(sessionCode, content, type, deviceId);
    
    expect(newItem).toHaveProperty('id');
    expect(newItem).toHaveProperty('content', content);
    expect(newItem).toHaveProperty('type', type);
    expect(newItem).toHaveProperty('deviceId', deviceId);
    expect(newItem).toHaveProperty('version', 1);
    expect(newItem).toHaveProperty('createdAt');
    
    // Verify the item was added by getting all items
    const items = await mockService.getItems(sessionCode);
    // The mock service initializes with mock items from mockData.js
    // We'll check if our item is in the list instead of checking the exact count
    const addedItem = items.find(item => item.content === content);
    expect(addedItem).toBeDefined();
    expect(addedItem.content).toBe(content);
  });

  it('should edit an item in the session', async () => {
    // First add an item
    const originalContent = 'Original content';
    const newContent = 'Updated content';
    const type = 'text';
    
    const newItem = await mockService.addItem(sessionCode, originalContent, type, deviceId);
    
    // Then edit it
    const updatedItem = await mockService.editItem(
      sessionCode, 
      newItem.id, 
      newContent, 
      deviceId,
      1 // Expected version
    );
    
    expect(updatedItem.content).toBe(newContent);
    expect(updatedItem.version).toBe(2);
    expect(updatedItem).toHaveProperty('updatedAt');
    
    // Verify the item was updated by getting all items
    const items = await mockService.getItems(sessionCode);
    const editedItem = items.find(item => item.id === newItem.id);
    expect(editedItem).toBeDefined();
    expect(editedItem.content).toBe(newContent);
  });

  it('should detect version conflicts when editing', async () => {
    // First add an item
    const originalContent = 'Original content';
    const type = 'text';
    
    const newItem = await mockService.addItem(sessionCode, originalContent, type, deviceId);
    
    // Try to edit with wrong version number
    await expect(
      mockService.editItem(
        sessionCode, 
        newItem.id, 
        'New content', 
        deviceId,
        999 // Wrong version
      )
    ).rejects.toMatchObject({
      type: 'CONFLICT',
      message: 'Item has been modified',
      currentItem: expect.any(Object),
      currentVersion: 1
    });
  });

  it('should delete an item from the session', async () => {
    // First add an item
    const content = 'Content to delete';
    const type = 'text';
    
    const newItem = await mockService.addItem(sessionCode, content, type, deviceId);
    
    // Verify item exists
    let items = await mockService.getItems(sessionCode);
    const addedItem = items.find(item => item.id === newItem.id);
    expect(addedItem).toBeDefined();
    
    // Delete the item
    const result = await mockService.deleteItem(sessionCode, newItem.id, deviceId);
    expect(result).toBe(true);
    
    // Verify item was deleted
    items = await mockService.getItems(sessionCode);
    const deletedItem = items.find(item => item.id === newItem.id);
    expect(deletedItem).toBeUndefined();
  });

  it('should throw error when accessing invalid session', async () => {
    const invalidCode = '999999';
    
    await expect(
      mockService.getItems(invalidCode)
    ).rejects.toThrow('Invalid session code');
    
    await expect(
      mockService.addItem(invalidCode, 'content', 'text', deviceId)
    ).rejects.toThrow('Invalid session code');
  });

  it('should prevent unauthorized edits', async () => {
    // Add an item with the original device
    const content = 'Original content';
    const type = 'text';
    const newItem = await mockService.addItem(sessionCode, content, type, deviceId);
    
    // Try to edit with a different device
    const differentDeviceId = 'different-device';
    await expect(
      mockService.editItem(sessionCode, newItem.id, 'New content', differentDeviceId, 1)
    ).rejects.toThrow('Not authorized to edit this item');
  });
}); 