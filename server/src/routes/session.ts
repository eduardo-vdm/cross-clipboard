import { Router, Request, Response, NextFunction } from 'express';
import { DataService } from '../types';
import { ItemType } from '../types';

/**
 * Helper function to create an async Express route handler that passes errors to next()
 */
const asyncHandler = (fn: (req: Request, res: Response, next: NextFunction) => Promise<any>) => 
  (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };

export const createSessionRouter = (dataService: DataService) => {
  const router = Router();

  // Create a new session
  router.post('/sessions', asyncHandler(async (req: Request, res: Response) => {
    const session = await dataService.createSession();
    res.status(201).json(session);
  }));

  // Get session details by code
  router.get('/sessions/:code', asyncHandler(async (req: Request, res: Response) => {
    const session = await dataService.getSessionByCode(req.params.code);
    res.json(session);
  }));

  // Delete a session by code
  router.delete('/sessions/:code', asyncHandler(async (req: Request, res: Response) => {
    // First get the session by code to find its ID
    const session = await dataService.getSessionByCode(req.params.code);
    await dataService.deleteSession(session.id);
    res.status(204).send();
  }));

  // Get all items in a session by code
  router.get('/sessions/:code/items', asyncHandler(async (req: Request, res: Response) => {
    const session = await dataService.getSessionByCode(req.params.code);
    res.json(session.items);
  }));

  // Add a new item to a session by code
  router.post('/sessions/:code/items', asyncHandler(async (req: Request, res: Response) => {
    const { type, content } = req.body;
    if (!type || !content) {
      return res.status(400).json({ error: 'Type and content are required' });
    }

    // First get the session by code to find its ID
    const session = await dataService.getSessionByCode(req.params.code);
    const item = await dataService.addItem(session.id, type as ItemType, content);
    res.status(201).json(item);
  }));

  // Update an item in a session by code
  router.put('/sessions/:code/items/:itemId', asyncHandler(async (req: Request, res: Response) => {
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
  }));

  // Delete an item from a session by code
  router.delete('/sessions/:code/items/:itemId', asyncHandler(async (req: Request, res: Response) => {
    // First get the session by code to find its ID
    const session = await dataService.getSessionByCode(req.params.code);
    const success = await dataService.deleteItem(session.id, req.params.itemId);
    
    if (!success) {
      return res.status(404).json({ error: 'Item not found' });
    }
    
    res.status(204).send();
  }));

  return router;
}; 