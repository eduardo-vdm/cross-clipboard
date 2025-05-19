import { Router, Request, Response } from 'express';
import { DataService } from '../types';
import { ItemType } from '../types';
import { asyncHandler } from '../helpers/asyncHandler';

export const createSessionRouter = (dataService: DataService) => {
  const router = Router();

  // Create a new session
  router.post('/sessions', asyncHandler(async (req: Request, res: Response) => {
    const { deviceId } = req.body;
    if (!deviceId) {
      return res.status(400).json({ error: 'DeviceId is required' });
    }
    const session = await dataService.createSession(deviceId);
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
    const { type, content, deviceId, deviceName } = req.body;
    if (!type || !content) {
      return res.status(400).json({ error: 'Type and content are required' });
    }
    
    if (!deviceId) {
      return res.status(400).json({ error: 'DeviceId is required' });
    }

    // First get the session by code to find its ID
    const session = await dataService.getSessionByCode(req.params.code);
    const item = await dataService.addItem(session.id, type as ItemType, content, deviceId, deviceName);
    res.status(201).json(item);
  }));

  // Update an item in a session by code
  router.put('/sessions/:code/items/:itemId', asyncHandler(async (req: Request, res: Response) => {
    const { content, version, deviceId } = req.body;
    if (!content || version === undefined) {
      return res.status(400).json({ error: 'Content and version are required' });
    }

    // First get the session by code to find its ID
    const session = await dataService.getSessionByCode(req.params.code);
    
    // Check if user has permission to edit this item
    const item = session.items.find(item => item.id === req.params.itemId);
    if (item && item.deviceId && deviceId && item.deviceId !== deviceId) {
      return res.status(403).json({ error: 'You do not have permission to edit this item' });
    }
    
    const result = await dataService.updateItem(
      session.id,
      req.params.itemId,
      content,
      version,
      deviceId
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
    const { deviceId } = req.body;
    
    // First get the session by code to find its ID
    const session = await dataService.getSessionByCode(req.params.code);
    
    // Check if user has permission to delete this item
    const item = session.items.find(item => item.id === req.params.itemId);
    if (item && item.deviceId && deviceId && item.deviceId !== deviceId) {
      return res.status(403).json({ error: 'You do not have permission to delete this item' });
    }
    
    const success = await dataService.deleteItem(session.id, req.params.itemId, deviceId);
    
    if (!success) {
      return res.status(404).json({ error: 'Item not found' });
    }
    
    res.status(204).send();
  }));

  // Wipe all items from a session by code
  router.delete('/sessions/:code/wipe', asyncHandler(async (req: Request, res: Response) => {
    const { deviceId } = req.body;
    if (!deviceId) {
      return res.status(400).json({ error: 'DeviceId is required' });
    }

    // First get the session by code to find its ID
    const session = await dataService.getSessionByCode(req.params.code);

    // Check if user has permission to wipe this session
    if (session.createdBy && deviceId && session.createdBy !== deviceId) {
      return res.status(403).json({ error: 'You do not have permission to wipe this session' });
    }

    await dataService.wipeSession(session.id, deviceId);
    res.status(204).send();
  }));

  // Remove all items from a deviceId from one session
  router.delete('/sessions/:code/remove-my-items', asyncHandler(async (req: Request, res: Response) => {
    const { deviceId } = req.body;
    if (!deviceId) {
      return res.status(400).json({ error: 'DeviceId is required' });
    }

    // First get the session by code to find its ID
    const session = await dataService.getSessionByCode(req.params.code);

    await dataService.removeMyItems(session.id, deviceId);  
    res.status(204).send();
  }));

  return router;
}; 