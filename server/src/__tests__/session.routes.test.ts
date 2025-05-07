/// <reference types="jest" />

import request from 'supertest';
import express from 'express';
import { createSessionRouter } from '../routes/session';
import { DataService } from '../types';
import { ItemType } from '../types';
import { DatabaseError } from '../types/errors';
import { getTestDataService, cleanupTestDataService } from '../test/config';

describe('Session Routes', () => {
  let dataService: DataService;
  let app: express.Application;

  beforeAll(async () => {
    dataService = await getTestDataService();
  });

  afterAll(async () => {
    await cleanupTestDataService();
  });

  beforeEach(() => {
    app = express();
    app.use(express.json());
    app.use('/api', createSessionRouter(dataService));
  });

  // We'll keep console.error enabled for debugging
  // but we'll spy on it to see what errors occur
  beforeEach(() => {
    jest.spyOn(console, 'error');
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('POST /api/sessions', () => {
    it('should create a new session', async () => {
      const response = await request(app)
        .post('/api/sessions')
        .expect(201)
        .catch(error => {
          // Log the full response for debugging
          console.log('Full response:', error.response?.body);
          console.log('Console errors during test:', (console.error as jest.Mock).mock.calls);
          throw error;
        });

      expect(response.body).toEqual(expect.objectContaining({
        id: expect.any(String),
        code: expect.any(String),
        version: expect.any(Number),
        items: expect.any(Array)
      }));
    });

    it('should handle database errors during session creation', async () => {
      // Mock the createSession method to throw a DatabaseError
      jest.spyOn(dataService, 'createSession').mockRejectedValueOnce(
        new DatabaseError('session creation', 'Connection failed')
      );

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
      // First create a session
      const createResponse = await request(app)
        .post('/api/sessions')
        .expect(201);

      const sessionId = createResponse.body.id;

      // Then get the session details
      const response = await request(app)
        .get(`/api/sessions/${sessionId}`)
        .expect(200);

      expect(response.body).toEqual(expect.objectContaining({
        id: sessionId,
        version: expect.any(Number),
        items: expect.any(Array)
      }));
    });

    it('should return 404 for non-existent session', async () => {
      await request(app)
        .get('/api/sessions/non-existent')
        .expect(404)
        .expect((res) => {
          expect(res.body.error).toBe('Session not found');
        });
    });
  });

  describe('POST /api/sessions/:id/items', () => {
    let sessionId: string;

    beforeEach(async () => {
      const response = await request(app)
        .post('/api/sessions')
        .expect(201);
      sessionId = response.body.id;
    });

    it('should add an item to session', async () => {
      const response = await request(app)
        .post(`/api/sessions/${sessionId}/items`)
        .send({
          type: 'text' as ItemType,
          content: 'test content'
        })
        .expect(201);

      expect(response.body).toEqual(expect.objectContaining({
        id: expect.any(String),
        type: 'text',
        content: 'test content',
        version: expect.any(Number)
      }));
    });

    it('should validate required fields', async () => {
      await request(app)
        .post(`/api/sessions/${sessionId}/items`)
        .send({})
        .expect(400)
        .expect((res) => {
          expect(res.body.error).toBe('Type and content are required');
        });
    });
  });

  describe('PUT /api/sessions/:id/items/:itemId', () => {
    let sessionId: string;
    let itemId: string;

    beforeEach(async () => {
      // Create session
      const sessionResponse = await request(app)
        .post('/api/sessions')
        .expect(201);
      sessionId = sessionResponse.body.id;

      // Add item
      const itemResponse = await request(app)
        .post(`/api/sessions/${sessionId}/items`)
        .send({
          type: 'text' as ItemType,
          content: 'initial content'
        })
        .expect(201);
      itemId = itemResponse.body.id;
    });

    it('should update an item', async () => {
      const response = await request(app)
        .put(`/api/sessions/${sessionId}/items/${itemId}`)
        .send({
          content: 'updated content',
          version: 1
        })
        .expect(200);

      expect(response.body).toEqual(expect.objectContaining({
        version: 2,
        lastModified: expect.any(String)
      }));
    });

    it('should handle version conflicts', async () => {
      // First update
      await request(app)
        .put(`/api/sessions/${sessionId}/items/${itemId}`)
        .send({
          content: 'first update',
          version: 1
        })
        .expect(200);

      // Second update with old version
      await request(app)
        .put(`/api/sessions/${sessionId}/items/${itemId}`)
        .send({
          content: 'second update',
          version: 1
        })
        .expect(409)
        .expect((res) => {
          expect(res.body.error).toBe('Version conflict');
          expect(res.body.serverVersion).toBe(2);
        });
    });
  });

  describe('DELETE /api/sessions/:id/items/:itemId', () => {
    let sessionId: string;
    let itemId: string;

    beforeEach(async () => {
      // Create session
      const sessionResponse = await request(app)
        .post('/api/sessions')
        .expect(201);
      sessionId = sessionResponse.body.id;

      // Add item
      const itemResponse = await request(app)
        .post(`/api/sessions/${sessionId}/items`)
        .send({
          type: 'text' as ItemType,
          content: 'test content'
        })
        .expect(201);
      itemId = itemResponse.body.id;
    });

    it('should delete an item', async () => {
      await request(app)
        .delete(`/api/sessions/${sessionId}/items/${itemId}`)
        .expect(204);

      // Verify item is deleted
      const response = await request(app)
        .get(`/api/sessions/${sessionId}`)
        .expect(200);

      expect(response.body.items).toHaveLength(0);
    });

    it('should return 404 for non-existent item', async () => {
      await request(app)
        .delete(`/api/sessions/${sessionId}/items/non-existent`)
        .expect(404)
        .expect((res) => {
          expect(res.body.error).toBe('Session or item not found');
        });
    });
  });
}); 