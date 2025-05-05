import { Router, Request, Response } from 'express';
import { DataService } from '../types';
import { ItemType } from '../types';

export const createSessionRouter = (dataService: DataService) => {
  const router = Router();

  // Create a new session
  router.post('/sessions', async (req: Request, res: Response) => {
    try {
      const session = await dataService.createSession();
      res.status(201).json(session);
    } catch (error) {
      console.error('Failed to create session:', error);
      res.status(500).json({ error: 'Failed to create session' });
    }
  });

  // Get session details
  router.get('/sessions/:id', async (req: Request, res: Response) => {
    try {
      const session = await dataService.getSession(req.params.id);
      if (!session) {
        return res.status(404).json({ error: 'Session not found' });
      }
      res.json(session);
    } catch (error) {
      console.error('Failed to get session:', error);
      res.status(500).json({ error: 'Failed to get session' });
    }
  });

  // Delete a session
  router.delete('/sessions/:id', async (req: Request, res: Response) => {
    try {
      const success = await dataService.deleteSession(req.params.id);
      if (!success) {
        return res.status(404).json({ error: 'Session not found' });
      }
      res.status(204).send();
    } catch (error) {
      console.error('Failed to delete session:', error);
      res.status(500).json({ error: 'Failed to delete session' });
    }
  });

  // Get all items in a session
  router.get('/sessions/:id/items', async (req: Request, res: Response) => {
    try {
      const session = await dataService.getSession(req.params.id);
      if (!session) {
        return res.status(404).json({ error: 'Session not found' });
      }
      res.json(session.items);
    } catch (error) {
      console.error('Failed to get items:', error);
      res.status(500).json({ error: 'Failed to get items' });
    }
  });

  // Add a new item to a session
  router.post('/sessions/:id/items', async (req: Request, res: Response) => {
    try {
      const { type, content } = req.body;
      if (!type || !content) {
        return res.status(400).json({ error: 'Type and content are required' });
      }

      const item = await dataService.addItem(req.params.id, type as ItemType, content);
      if (!item) {
        return res.status(404).json({ error: 'Session not found' });
      }

      res.status(201).json(item);
    } catch (error) {
      console.error('Failed to add item:', error);
      res.status(500).json({ error: 'Failed to add item' });
    }
  });

  // Update an item in a session
  router.put('/sessions/:id/items/:itemId', async (req: Request, res: Response) => {
    try {
      const { content, version } = req.body;
      if (!content || version === undefined) {
        return res.status(400).json({ error: 'Content and version are required' });
      }

      const result = await dataService.updateItem(
        req.params.id,
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
        return res.status(404).json({ error: 'Session or item not found' });
      }

      res.json({
        version: result.item!.version,
        lastModified: result.item!.lastModified
      });
    } catch (error) {
      console.error('Failed to update item:', error);
      res.status(500).json({ error: 'Failed to update item' });
    }
  });

  // Delete an item from a session
  router.delete('/sessions/:id/items/:itemId', async (req: Request, res: Response) => {
    try {
      const success = await dataService.deleteItem(req.params.id, req.params.itemId);
      if (!success) {
        return res.status(404).json({ error: 'Session or item not found' });
      }
      res.status(204).send();
    } catch (error) {
      console.error('Failed to delete item:', error);
      res.status(500).json({ error: 'Failed to delete item' });
    }
  });

  return router;
}; 