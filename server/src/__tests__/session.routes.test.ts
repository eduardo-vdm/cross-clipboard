/// <reference types="jest" />

import request from 'supertest';
import express from 'express';
import { createSessionRouter } from '../routes/session';
import { MockDataService } from '../services/mockDataService';
import { ItemType } from '../types';
import { DatabaseError } from '../types/errors';

jest.mock('../services/mockDataService');

describe('Session Routes', () => {
  let mockDataService: jest.Mocked<MockDataService>;
  let app: express.Application;

  beforeEach(() => {
    jest.clearAllMocks();
    mockDataService = new MockDataService() as jest.Mocked<MockDataService>;
    (MockDataService as jest.Mock).mockImplementation(() => mockDataService);

    app = express();
    app.use(express.json());
    app.use('/api', createSessionRouter(mockDataService));
  });

  describe('POST /api/sessions', () => {
    it('should create a new session', async () => {
      const mockSession = {
        id: 'test-id',
        code: '123456',
        items: [],
        version: 1,
        createdAt: new Date(),
        lastModified: new Date()
      };

      mockDataService.createSession.mockResolvedValue(mockSession);

      const response = await request(app)
        .post('/api/sessions')
        .expect(201);

      expect(response.body).toEqual(expect.objectContaining({
        id: mockSession.id,
        version: mockSession.version
      }));
    });

    it('should handle errors during session creation', async () => {
      mockDataService.createSession.mockRejectedValue(new DatabaseError('session creation', 'Connection failed'));

      await request(app)
        .post('/api/sessions')
        .expect(503)
        .expect((res) => {
          expect(res.body.error).toBe('Database error during session creation: Connection failed');
        });
    });
  });

  describe('GET /api/sessions/:id', () => {
    it('should return session details', async () => {
      const mockSession = {
        id: 'test-id',
        code: '123456',
        items: [],
        version: 1,
        createdAt: new Date(),
        lastModified: new Date()
      };

      mockDataService.getSession.mockResolvedValue(mockSession);

      const response = await request(app)
        .get('/api/sessions/test-id')
        .expect(200);

      expect(response.body).toEqual(expect.objectContaining({
        id: mockSession.id,
        version: mockSession.version
      }));
    });

    it('should return 404 for non-existent session', async () => {
      mockDataService.getSession.mockResolvedValue(null);

      await request(app)
        .get('/api/sessions/non-existent')
        .expect(404)
        .expect((res) => {
          expect(res.body.error).toBe('Session not found');
        });
    });

    it('should handle database errors', async () => {
      mockDataService.getSession.mockRejectedValue(new DatabaseError('session retrieval', 'Connection timeout'));

      await request(app)
        .get('/api/sessions/test-id')
        .expect(503)
        .expect((res) => {
          expect(res.body.error).toBe('Database error during session retrieval: Connection timeout');
        });
    });
  });

  describe('POST /api/sessions/:id/items', () => {
    it('should add an item to session', async () => {
      const mockItem = {
        id: 'item-id',
        type: 'text' as ItemType,
        content: 'test content',
        version: 1,
        createdAt: new Date(),
        lastModified: new Date()
      };

      mockDataService.addItem.mockResolvedValue(mockItem);

      const response = await request(app)
        .post('/api/sessions/test-id/items')
        .send({
          type: 'text',
          content: 'test content'
        })
        .expect(201);

      expect(response.body).toEqual(expect.objectContaining({
        id: mockItem.id,
        type: mockItem.type,
        content: mockItem.content
      }));
    });

    it('should validate required fields', async () => {
      await request(app)
        .post('/api/sessions/test-id/items')
        .send({})
        .expect(400)
        .expect((res) => {
          expect(res.body.error).toBe('Type and content are required');
        });
    });

    it('should handle database errors when adding items', async () => {
      mockDataService.addItem.mockRejectedValue(new DatabaseError('item creation', 'Write operation failed'));

      await request(app)
        .post('/api/sessions/test-id/items')
        .send({
          type: 'text',
          content: 'test content'
        })
        .expect(503)
        .expect((res) => {
          expect(res.body.error).toBe('Database error during item creation: Write operation failed');
        });
    });
  });

  describe('PUT /api/sessions/:id/items/:itemId', () => {
    it('should update an item', async () => {
      const mockUpdateResult = {
        success: true,
        item: {
          id: 'item-id',
          type: 'text' as ItemType,
          content: 'updated content',
          version: 2,
          createdAt: new Date(),
          lastModified: new Date()
        }
      };

      mockDataService.updateItem.mockResolvedValue(mockUpdateResult);

      const response = await request(app)
        .put('/api/sessions/test-id/items/item-id')
        .send({
          content: 'updated content',
          version: 1
        })
        .expect(200);

      expect(response.body).toEqual(expect.objectContaining({
        version: mockUpdateResult.item.version,
        lastModified: expect.any(String)
      }));
    }, 10000); // Increased timeout for this test

    it('should handle version conflicts', async () => {
      const mockConflict = {
        success: false,
        conflict: {
          serverVersion: 2,
          serverContent: 'server content'
        }
      };

      mockDataService.updateItem.mockResolvedValue(mockConflict);

      await request(app)
        .put('/api/sessions/test-id/items/item-id')
        .send({
          content: 'updated content',
          version: 1
        })
        .expect(409)
        .expect((res) => {
          expect(res.body.error).toBe('Version conflict');
          expect(res.body.serverVersion).toBe(2);
          expect(res.body.serverContent).toBe('server content');
        });
    }, 10000); // Increased timeout for this test

    it('should handle database errors when updating items', async () => {
      mockDataService.updateItem.mockRejectedValue(new DatabaseError('item update', 'Lock acquisition timeout'));

      await request(app)
        .put('/api/sessions/test-id/items/item-id')
        .send({
          content: 'updated content',
          version: 1
        })
        .expect(503)
        .expect((res) => {
          expect(res.body.error).toBe('Database error during item update: Lock acquisition timeout');
        });
    });
  });

  describe('DELETE /api/sessions/:id/items/:itemId', () => {
    it('should delete an item', async () => {
      mockDataService.deleteItem.mockResolvedValue(true);

      await request(app)
        .delete('/api/sessions/test-id/items/item-id')
        .expect(204);
    });

    it('should return 404 for non-existent item', async () => {
      mockDataService.deleteItem.mockResolvedValue(false);

      await request(app)
        .delete('/api/sessions/test-id/items/non-existent')
        .expect(404)
        .expect((res) => {
          expect(res.body.error).toBe('Session or item not found');
        });
    });

    it('should handle database errors when deleting items', async () => {
      mockDataService.deleteItem.mockRejectedValue(new DatabaseError('item deletion', 'Transaction failed'));

      await request(app)
        .delete('/api/sessions/test-id/items/item-id')
        .expect(503)
        .expect((res) => {
          expect(res.body.error).toBe('Database error during item deletion: Transaction failed');
        });
    });
  });
}); 