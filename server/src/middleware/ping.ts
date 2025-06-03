import { Request, Response, NextFunction } from 'express';

/**
 * Creates a middleware that only responds 200 OK to the client the most lightweight possible;
 * @returns The ping middleware
 */
export const createPingMiddleware = () => {
  return (req: Request, res: Response, next: NextFunction) => {
    res.status(200).send('OK');
  };
};
