/// <reference types="jest" />

import { MockDataService } from '../services/mockDataService';
import fs from 'fs/promises';
import path from 'path';
import { SessionNotFoundError } from '../types/errors';

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
      const beforeCreate = new Date();
      const session = await service.createSession();
      const afterCreate = new Date();
      
      expect(session).toHaveProperty('id');
      expect(session).toHaveProperty('code');
      expect(session.code).toMatch(/^\d{6}$/); // 6-digit code
      expect(session.items).toEqual([]);
      expect(session.version).toBe(1);
      expect(session.createdAt).toBeInstanceOf(Date);
      expect(session.lastModified).toBeInstanceOf(Date);
      
      // Verify timestamps are within expected range
      expect(session.createdAt.getTime()).toBeGreaterThanOrEqual(beforeCreate.getTime());
      expect(session.createdAt.getTime()).toBeLessThanOrEqual(afterCreate.getTime());
      expect(session.lastModified.getTime()).toBe(session.createdAt.getTime());
    });

    it('should persist the session to storage', async () => {
      const session = await service.createSession();
      expect(fs.writeFile).toHaveBeenCalled();
      const writeCallArg = (fs.writeFile as jest.Mock).mock.calls[0][1];
      const writtenData = JSON.parse(writeCallArg);
      expect(writtenData[session.id]).toBeDefined();
    });
  });

  describe('getSession', () => {
    it('should return null for non-existent session', async () => {
      const result = await service.getSession('non-existent-id');
      expect(result).toBeNull();
    });

    it('should return existing session with all properties', async () => {
      const session = await service.createSession();
      const retrieved = await service.getSession(session.id);
      
      expect(retrieved).toEqual(session);
      expect(retrieved?.createdAt).toBeInstanceOf(Date);
      expect(retrieved?.lastModified).toBeInstanceOf(Date);
      expect(retrieved?.version).toBe(1);
    });

    it('should return a copy of the session, not a reference', async () => {
      const session = await service.createSession();
      const retrieved = await service.getSession(session.id);
      
      if (!retrieved) throw new Error('Session not found');
      retrieved.items.push({ 
        id: '123', 
        type: 'text', 
        content: 'test',
        version: 1,
        createdAt: new Date(),
        lastModified: new Date()
      });
      
      const retrievedAgain = await service.getSession(session.id);
      expect(retrievedAgain?.items).toHaveLength(0);
    });
  });

  describe('getSessionById', () => {
    it('should throw SessionNotFoundError for non-existent session', async () => {
      await expect(service.getSessionById('non-existent-id'))
        .rejects
        .toThrow(SessionNotFoundError);
    });

    it('should return existing session', async () => {
      const session = await service.createSession();
      const retrieved = await service.getSessionById(session.id);
      expect(retrieved).toEqual(session);
    });
  });

  describe('getSessionByCode', () => {
    it('should throw SessionNotFoundError for non-existent code', async () => {
      await expect(service.getSessionByCode('123456'))
        .rejects
        .toThrow(SessionNotFoundError);
    });

    it('should return existing session by code', async () => {
      const session = await service.createSession();
      const retrieved = await service.getSessionByCode(session.code);
      expect(retrieved).toEqual(session);
    });
  });

  describe('addItem', () => {
    it('should throw SessionNotFoundError for non-existent session', async () => {
      await expect(service.addItem('fake-id', 'text', 'content'))
        .rejects
        .toThrow(SessionNotFoundError);
    });

    it('should add text item to session with correct metadata', async () => {
      const session = await service.createSession();
      const beforeAdd = new Date();
      const item = await service.addItem(session.id, 'text', 'test content');
      const afterAdd = new Date();

      expect(item).toHaveProperty('id');
      expect(item.type).toBe('text');
      expect(item.content).toBe('test content');
      expect(item.version).toBe(1);
      expect(item.createdAt.getTime()).toBeGreaterThanOrEqual(beforeAdd.getTime());
      expect(item.createdAt.getTime()).toBeLessThanOrEqual(afterAdd.getTime());
      expect(item.lastModified.getTime()).toBe(item.createdAt.getTime());
    });

    it('should increment session version and update lastModified when adding item', async () => {
      const session = await service.createSession();
      const initialVersion = session.version;
      const initialLastModified = session.lastModified;
      
      await new Promise(resolve => setTimeout(resolve, 10)); // Ensure timestamp difference
      const item = await service.addItem(session.id, 'text', 'test');
      
      const updatedSession = await service.getSession(session.id);
      expect(updatedSession?.version).toBe(initialVersion + 1);
      expect(updatedSession?.lastModified.getTime()).toBeGreaterThan(initialLastModified.getTime());
    });
  });

  describe('updateItem', () => {
    it('should throw SessionNotFoundError for non-existent session', async () => {
      await expect(service.updateItem('fake-session', 'fake-item', 'content', 1))
        .rejects
        .toThrow(SessionNotFoundError);
    });

    it('should update existing item with correct version and metadata', async () => {
      const session = await service.createSession();
      const item = await service.addItem(session.id, 'text', 'initial');
      
      await new Promise(resolve => setTimeout(resolve, 10)); // Ensure timestamp difference
      const beforeUpdate = new Date();
      const result = await service.updateItem(
        session.id,
        item.id,
        'updated',
        item.version
      );
      const afterUpdate = new Date();

      expect(result.success).toBe(true);
      expect(result.item).toBeDefined();
      expect(result.item?.content).toBe('updated');
      expect(result.item?.version).toBe(item.version + 1);
      expect(result.item?.lastModified.getTime()).toBeGreaterThanOrEqual(beforeUpdate.getTime());
      expect(result.item?.lastModified.getTime()).toBeLessThanOrEqual(afterUpdate.getTime());
      expect(result.item?.createdAt).toEqual(item.createdAt);
    });

    it('should detect version conflicts with proper conflict data', async () => {
      const session = await service.createSession();
      const item = await service.addItem(session.id, 'text', 'initial');
      
      // First update
      await service.updateItem(session.id, item.id, 'updated once', item.version);
      
      // Try to update with old version
      const result = await service.updateItem(
        session.id,
        item.id,
        'updated twice',
        item.version // Using original version number
      );

      expect(result.success).toBe(false);
      expect(result.item).toBeUndefined();
      expect(result.conflict).toBeDefined();
      expect(result.conflict?.serverVersion).toBe(item.version + 1);
      expect(result.conflict?.serverContent).toBe('updated once');
    });

    it('should return failure for non-existent item', async () => {
      const session = await service.createSession();
      const result = await service.updateItem(session.id, 'fake-item', 'content', 1);
      expect(result.success).toBe(false);
      expect(result.item).toBeUndefined();
      expect(result.conflict).toBeUndefined();
    });
  });

  describe('deleteItem', () => {
    it('should delete existing item and update session metadata', async () => {
      const session = await service.createSession();
      const item = await service.addItem(session.id, 'text', 'test');
      
      if (!item) throw new Error('Failed to create item');
      
      const initialVersion = (await service.getSession(session.id))?.version;
      const initialLastModified = (await service.getSession(session.id))?.lastModified;
      
      await new Promise(resolve => setTimeout(resolve, 10)); // Ensure timestamp difference
      const result = await service.deleteItem(session.id, item.id);
      
      expect(result).toBe(true);
      
      const updatedSession = await service.getSession(session.id);
      expect(updatedSession?.items).toHaveLength(0);
      expect(updatedSession?.version).toBe((initialVersion || 0) + 1);
      expect(updatedSession?.lastModified.getTime()).toBeGreaterThan(initialLastModified?.getTime() || 0);
    });

    it('should return false for non-existent item', async () => {
      const session = await service.createSession();
      const result = await service.deleteItem(session.id, 'fake-item-id');
      expect(result).toBe(false);
    });

    it('should return false for non-existent session', async () => {
      const result = await service.deleteItem('fake-session-id', 'fake-item-id');
      expect(result).toBe(false);
    });
  });

  describe('deleteSession', () => {
    it('should delete existing session and persist changes', async () => {
      const session = await service.createSession();
      const result = await service.deleteSession(session.id);
      
      expect(result).toBe(true);
      const deleted = await service.getSession(session.id);
      expect(deleted).toBeNull();
      
      expect(fs.writeFile).toHaveBeenCalled();
      const writeCallArg = (fs.writeFile as jest.Mock).mock.calls[1][1];
      const writtenData = JSON.parse(writeCallArg);
      expect(writtenData[session.id]).toBeUndefined();
    });

    it('should return false for non-existent session', async () => {
      const result = await service.deleteSession('fake-session-id');
      expect(result).toBe(false);
    });
  });
}); 