import { NextFunction, Request, Response } from "express";

/**
 * Helper function to create an async Express route handler that passes errors to next()
 */
export const asyncHandler = (fn: (req: Request, res: Response, next: NextFunction) => Promise<any>) => 
    (req: Request, res: Response, next: NextFunction) => {
      Promise.resolve(fn(req, res, next)).catch(next);
    };