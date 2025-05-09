import { Request, Response, NextFunction } from 'express';
import { 
  SessionNotFoundError, 
  SessionArchivedException, 
  DatabaseError,
  ItemNotFoundError,
  VersionConflictError
} from '../types/errors';

export interface ErrorResponse {
  error: string;
  details?: unknown;
}

/**
 * Centralized error handling middleware
 * Maps application errors to appropriate HTTP responses
 */
export function errorHandler(
  err: Error, 
  req: Request, 
  res: Response, 
  next: NextFunction
) {
  console.error(`Error processing ${req.method} ${req.path}:`, err);

  // Handle known error types
  if (err instanceof SessionNotFoundError || err instanceof SessionArchivedException) {
    return res.status(404).json({ 
      error: 'Session not found'
    });
  }

  if (err instanceof ItemNotFoundError) {
    return res.status(404).json({ 
      error: 'Item not found'
    });
  }

  if (err instanceof VersionConflictError) {
    return res.status(409).json({
      error: 'Version conflict',
      serverVersion: err.serverVersion,
      serverContent: err.serverContent
    });
  }

  if (err instanceof DatabaseError) {
    return res.status(503).json({ 
      error: err.message 
    });
  }

  // Default 500 error for unhandled exceptions
  return res.status(500).json({ 
    error: 'Internal server error'
  });
} 