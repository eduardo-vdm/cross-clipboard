import { MockDataService } from '../services/mockDataService';
import fs from 'fs/promises';
import path from 'path';

jest.mock('fs/promises');

describe('MockDataService', () => {
  let service: MockDataService;
  
  beforeEach(() => {
    // Reset all mocks before each test
    jest.resetAllMocks();
    (fs.access as jest.Mock).mockResolvedValue(undefined);
    (fs.readFile as jest.Mock).mockResolvedValue('{}');
    service = new MockDataService();
  });

  describe('createSession', () => {
    it('should create a new session with correct initial values', async () => {
      const session = await service.createSession();
      
      expect(session).toHaveProperty('id');
      expect(session.items).toEqual([]);
      expect(session.version).toBe(1);
      expect(session.createdAt).toBeInstanceOf(Date);
      expect(session.lastModified).toBeInstanceOf(Date);
    });

    it('should persist the session to storage', async () => {
      await service.createSession();
      expect(fs.writeFile).toHaveBeenCalled();
    });
  });

  describe('getSession', () => {
    it('should return null for non-existent session', async () => {
      const result = await service.getSession('non-existent-id');
      expect(result).toBeNull();
    });

    it('should return existing session', async () => {
      const session = await service.createSession();
      const retrieved = await service.getSession(session.id);
      expect(retrieved).toEqual(session);
    });
  });

  describe('addItem', () => {
    it('should add text item to session', async () => {
      const session = await service.createSession();
      const item = await service.addItem(session.id, 'text', 'test content');

      expect(item).toHaveProperty('id');
      expect(item?.type).toBe('text');
      expect(item?.content).toBe('test content');
      expect(item?.version).toBe(1);
    });

    it('should return null for non-existent session', async () => {
      const result = await service.addItem('fake-id', 'text', 'content');
      expect(result).toBeNull();
    });

    it('should increment session version when adding item', async () => {
      const session = await service.createSession();
      const initialVersion = session.version;
      await service.addItem(session.id, 'text', 'test');
      
      const updatedSession = await service.getSession(session.id);
      expect(updatedSession?.version).toBe(initialVersion + 1);
    });
  });

  describe('updateItem', () => {
    it('should update existing item with correct version', async () => {
      const session = await service.createSession();
      const item = await service.addItem(session.id, 'text', 'initial');
      
      if (!item) throw new Error('Failed to create item');
      
      const result = await service.updateItem(
        session.id,
        item.id,
        'updated',
        item.version
      );

      expect(result.success).toBe(true);
      expect(result.item?.content).toBe('updated');
      expect(result.item?.version).toBe(item.version + 1);
    });

    it('should detect version conflicts', async () => {
      const session = await service.createSession();
      const item = await service.addItem(session.id, 'text', 'initial');
      
      if (!item) throw new Error('Failed to create item');
      
      const result = await service.updateItem(
        session.id,
        item.id,
        'updated',
        item.version - 1
      );

      expect(result.success).toBe(false);
      expect(result.conflict).toBeDefined();
      expect(result.conflict?.serverVersion).toBe(item.version);
      expect(result.conflict?.serverContent).toBe('initial');
    });
  });

  describe('deleteItem', () => {
    it('should delete existing item', async () => {
      const session = await service.createSession();
      const item = await service.addItem(session.id, 'text', 'test');
      
      if (!item) throw new Error('Failed to create item');
      
      const result = await service.deleteItem(session.id, item.id);
      expect(result).toBe(true);
      
      const updatedSession = await service.getSession(session.id);
      expect(updatedSession?.items).toHaveLength(0);
    });

    it('should return false for non-existent item', async () => {
      const session = await service.createSession();
      const result = await service.deleteItem(session.id, 'fake-item-id');
      expect(result).toBe(false);
    });
  });

  describe('deleteSession', () => {
    it('should delete existing session', async () => {
      const session = await service.createSession();
      const result = await service.deleteSession(session.id);
      
      expect(result).toBe(true);
      const deleted = await service.getSession(session.id);
      expect(deleted).toBeNull();
    });

    it('should return false for non-existent session', async () => {
      const result = await service.deleteSession('fake-session-id');
      expect(result).toBe(false);
    });
  });
}); 