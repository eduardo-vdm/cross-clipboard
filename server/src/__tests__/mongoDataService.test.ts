/// <reference types="jest" />

import { MongoDataService } from '../services/mongoDataService';
import { mongoConnection } from '../db/connection';
import { Session } from '../db/schemas';
import { getTestDataService, cleanupTestDataService } from '../test/config';
import { SessionNotFoundError, DatabaseError } from '../types/errors';
import mongoose from 'mongoose';

describe('MongoDataService', () => {
  let service: MongoDataService;
  const testCollectionName = 'sessions';

  // Use TEST_MODE=mongo to run these tests
  const testMode = process.env.TEST_MODE;
  const testFn = testMode === 'mongo' ? describe : describe.skip;

  testFn('with MongoDB connection', () => {
    beforeAll(async () => {
      // Get the data service from test config
      const dataService = await getTestDataService();
      
      // Ensure we're using MongoDataService
      if (!(dataService instanceof MongoDataService)) {
        throw new Error('Expected MongoDataService, got different implementation');
      }
      
      service = dataService;
    });

    afterAll(async () => {
      await cleanupTestDataService();
    });

    beforeEach(async () => {
      // Clean collections before each test
      if (!mongoose.connection.db) {
        throw new Error('MongoDB connection not established');
      }
      
      const collections = await mongoose.connection.db.collections();
      for (const collection of collections) {
        if (collection.collectionName === testCollectionName) {
          await collection.deleteMany({});
        }
      }
    });

    describe('createSession', () => {
      it('should create a new session with correct initial values', async () => {
        const session = await service.createSession();
        
        expect(session).toHaveProperty('id');
        expect(session).toHaveProperty('code');
        expect(session.code).toMatch(/^\d{6}$/); // 6-digit code
        expect(session.items).toEqual([]);
        expect(session.version).toBe(1);
        expect(session.createdAt).toBeInstanceOf(Date);
        expect(session.lastModified).toBeInstanceOf(Date);
      });

      it('should persist the session to MongoDB', async () => {
        const session = await service.createSession();
        
        // Verify directly with Mongoose model
        const dbSession = await Session.findOne({ id: session.id });
        expect(dbSession).not.toBeNull();
        expect(dbSession?.code).toBe(session.code);
      });
    });

    describe('getSessionByCode', () => {
      it('should retrieve a session by its code', async () => {
        const session = await service.createSession();
        
        // Get session by code
        const retrievedSession = await service.getSessionByCode(session.code);
        
        expect(retrievedSession.id).toBe(session.id);
        expect(retrievedSession.code).toBe(session.code);
      });

      it('should throw SessionNotFoundError for non-existent code', async () => {
        await expect(service.getSessionByCode('999999')).rejects.toThrow(SessionNotFoundError);
      });
    });

    describe('getSessionById', () => {
      it('should retrieve a session by its ID', async () => {
        const session = await service.createSession();
        
        // Get session by ID
        const retrievedSession = await service.getSessionById(session.id);
        
        expect(retrievedSession.id).toBe(session.id);
        expect(retrievedSession.code).toBe(session.code);
      });

      it('should throw SessionNotFoundError for non-existent ID', async () => {
        await expect(service.getSessionById('non-existent')).rejects.toThrow(SessionNotFoundError);
      });
    });

    describe('deleteSession', () => {
      it('should mark a session as archived', async () => {
        const session = await service.createSession();
        
        // Delete (archive) the session
        const result = await service.deleteSession(session.id);
        expect(result).toBe(true);
        
        // Verify the session is archived in the database
        const dbSession = await Session.findOne({ id: session.id });
        expect(dbSession?.isArchived).toBe(true);
        
        // Verify getSession returns null for archived session
        const retrievedSession = await service.getSession(session.id);
        expect(retrievedSession).toBeNull();
      });
    });

    describe('addItem', () => {
      it('should add an item to a session', async () => {
        const session = await service.createSession();
        const item = await service.addItem(session.id, 'text', 'test content');
        
        expect(item.id).toBeDefined();
        expect(item.type).toBe('text');
        expect(item.content).toBe('test content');
        expect(item.version).toBe(1);
        
        // Verify the item was added to the session in the database
        const dbSession = await Session.findOne({ id: session.id });
        expect(dbSession?.items).toHaveLength(1);
        expect(dbSession?.items[0].content).toBe('test content');
      });
    });

    describe('updateItem', () => {
      it('should update an existing item', async () => {
        // Create session and add an item
        const session = await service.createSession();
        const item = await service.addItem(session.id, 'text', 'initial content');
        
        // Update the item
        const result = await service.updateItem(
          session.id,
          item.id,
          'updated content',
          1
        );
        
        expect(result.success).toBe(true);
        expect(result.item?.content).toBe('updated content');
        expect(result.item?.version).toBe(2);
        
        // Verify the item was updated in the database
        const dbSession = await Session.findOne({ id: session.id });
        const dbItem = dbSession?.items.find(i => i.id === item.id);
        expect(dbItem?.content).toBe('updated content');
      });

      it('should detect version conflicts', async () => {
        // Create session and add an item
        const session = await service.createSession();
        const item = await service.addItem(session.id, 'text', 'initial content');
        
        // Update the item once
        await service.updateItem(session.id, item.id, 'first update', 1);
        
        // Try to update with outdated version
        const result = await service.updateItem(
          session.id,
          item.id,
          'second update',
          1  // Should be 2 now
        );
        
        expect(result.success).toBe(false);
        expect(result.conflict).toBeDefined();
        expect(result.conflict?.serverVersion).toBe(2);
        expect(result.conflict?.serverContent).toBe('first update');
      });
    });

    describe('deleteItem', () => {
      it('should delete an item from a session', async () => {
        // Create session and add an item
        const session = await service.createSession();
        const item = await service.addItem(session.id, 'text', 'test content');
        
        // Delete the item
        const result = await service.deleteItem(session.id, item.id);
        expect(result).toBe(true);
        
        // Verify the item was deleted in the database
        const dbSession = await Session.findOne({ id: session.id });
        expect(dbSession?.items).toHaveLength(0);
      });
    });

    describe('connection handling', () => {
      it('should handle connection errors gracefully', async () => {
        // Force a connection error by messing with the connection
        const originalConnect = mongoConnection.connect;
        mongoConnection.connect = jest.fn().mockRejectedValue(new Error('Connection failure'));
        
        // Attempt an operation that requires a connection
        await expect(service.createSession()).rejects.toThrow(DatabaseError);
        
        // Restore the original connect method
        mongoConnection.connect = originalConnect;
      });
    });
  });
}); 