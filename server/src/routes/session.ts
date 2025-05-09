import { Router, Request, Response } from 'express';
import { DataService } from '../types';
import { ItemType } from '../types';
import { DatabaseError, SessionNotFoundError } from '../types/errors';

export const createSessionRouter = (dataService: DataService) => {
  const router = Router();

  // Create a new session
  router.post('/sessions', async (req: Request, res: Response) => {
    try {
      const session = await dataService.createSession();
      res.status(201).json(session);
    } catch (error) {
      console.error('Failed to create session:', error);
      if (error instanceof DatabaseError) {
        res.status(503).json({ error: error.message });
      } else {
        res.status(500).json({ error: 'Failed to create session' });
      }
    }
  });

  // Get session details by code
  router.get('/sessions/:code', async (req: Request, res: Response) => {
    try {
      const session = await dataService.getSessionByCode(req.params.code);
      res.json(session);
    } catch (error) {
      console.error('Failed to get session:', error);
      if (error instanceof SessionNotFoundError) {
        res.status(404).json({ error: 'Session not found' });
      } else if (error instanceof DatabaseError) {
        res.status(503).json({ error: error.message });
      } else {
        res.status(500).json({ error: 'Failed to get session' });
      }
    }
  });

  // Delete a session by code
  router.delete('/sessions/:code', async (req: Request, res: Response) => {
    try {
      // First get the session by code to find its ID
      const session = await dataService.getSessionByCode(req.params.code);
      const success = await dataService.deleteSession(session.id);
      res.status(204).send();
    } catch (error) {
      console.error('Failed to delete session:', error);
      if (error instanceof SessionNotFoundError) {
        res.status(404).json({ error: 'Session not found' });
      } else if (error instanceof DatabaseError) {
        res.status(503).json({ error: error.message });
      } else {
        res.status(500).json({ error: 'Failed to delete session' });
      }
    }
  });

  // Get all items in a session by code
  router.get('/sessions/:code/items', async (req: Request, res: Response) => {
    try {
      const session = await dataService.getSessionByCode(req.params.code);
      res.json(session.items);
    } catch (error) {
      console.error('Failed to get items:', error);
      if (error instanceof SessionNotFoundError) {
        res.status(404).json({ error: 'Session not found' });
      } else if (error instanceof DatabaseError) {
        res.status(503).json({ error: error.message });
      } else {
        res.status(500).json({ error: 'Failed to get items' });
      }
    }
  });

  // Add a new item to a session by code
  router.post('/sessions/:code/items', async (req: Request, res: Response) => {
    try {
      const { type, content } = req.body;
      if (!type || !content) {
        return res.status(400).json({ error: 'Type and content are required' });
      }

      // First get the session by code to find its ID
      const session = await dataService.getSessionByCode(req.params.code);
      const item = await dataService.addItem(session.id, type as ItemType, content);

      res.status(201).json(item);
    } catch (error) {
      console.error('Failed to add item:', error);
      if (error instanceof SessionNotFoundError) {
        res.status(404).json({ error: 'Session not found' });
      } else if (error instanceof DatabaseError) {
        res.status(503).json({ error: error.message });
      } else {
        res.status(500).json({ error: 'Failed to add item' });
      }
    }
  });

  // Update an item in a session by code
  router.put('/sessions/:code/items/:itemId', async (req: Request, res: Response) => {
    try {
      const { content, version } = req.body;
      if (!content || version === undefined) {
        return res.status(400).json({ error: 'Content and version are required' });
      }

      // First get the session by code to find its ID
      const session = await dataService.getSessionByCode(req.params.code);
      const result = await dataService.updateItem(
        session.id,
        req.params.itemId,
        content,
        version
      );

      if (!result.success) {
        if (result.conflict) {
          return res.status(409).json({
            error: 'Version conflict',
            serverVersion: result.conflict.serverVersion,
            serverContent: result.conflict.serverContent
          });
        }
        return res.status(404).json({ error: 'Item not found' });
      }

      res.json({
        version: result.item!.version,
        lastModified: result.item!.lastModified
      });
    } catch (error) {
      console.error('Failed to update item:', error);
      if (error instanceof SessionNotFoundError) {
        res.status(404).json({ error: 'Session not found' });
      } else if (error instanceof DatabaseError) {
        res.status(503).json({ error: error.message });
      } else {
        res.status(500).json({ error: 'Failed to update item' });
      }
    }
  });

  // Delete an item from a session by code
  router.delete('/sessions/:code/items/:itemId', async (req: Request, res: Response) => {
    try {
      // First get the session by code to find its ID
      const session = await dataService.getSessionByCode(req.params.code);
      const success = await dataService.deleteItem(session.id, req.params.itemId);
      
      if (!success) {
        return res.status(404).json({ error: 'Item not found' });
      }
      
      res.status(204).send();
    } catch (error) {
      console.error('Failed to delete item:', error);
      if (error instanceof SessionNotFoundError) {
        res.status(404).json({ error: 'Session not found' });
      } else if (error instanceof DatabaseError) {
        res.status(503).json({ error: error.message });
      } else {
        res.status(500).json({ error: 'Failed to delete item' });
      }
    }
  });

  return router;
}; 