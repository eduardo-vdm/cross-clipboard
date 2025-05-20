import { Request, Response, NextFunction } from 'express';

// TODO: restrict the actual server when in production, accept all in development

/**
 * Creates a CORS middleware that allows requests from any origin
 * @returns The CORS middleware
 */
export const createCorsMiddleware = () => {
  return async function setCors(req: Request, res: Response, next: NextFunction) {
    try {
      // Allow requests from any origin
      res.header('Access-Control-Allow-Origin', '*');
        
      // Expose all headers
      res.header('Access-Control-Expose-Headers', '*');

      // Additional CORS headers for preflight requests if needed
      res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
      res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');

      // Handle preflight requests
      if (req.method === 'OPTIONS') {
        return res.status(200).end();
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};
