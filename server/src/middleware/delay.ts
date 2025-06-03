import { Request, Response, NextFunction } from 'express';

/**
 * Creates a middleware that delays the request by a defined amount of milliseconds from the .env file
 * @returns The middleware
 */
export const createDelayMiddleware = () => {
  return async function setDelay(req: Request, res: Response, next: NextFunction) {
    try {
      const delay = process.env.DELAY_MS || 0;
      if (delay) {
        console.log(`[⏸️] Delaying request by ${delay}ms`);
        await new Promise(resolve => setTimeout(resolve, parseInt(delay)));
        console.log(`[✅] Request delayed by ${delay}ms`);
      }
      next();
    } catch (error) {
      next(error);
    }
  };
};
