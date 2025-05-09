import { Request, Response, NextFunction } from 'express';

export enum LogLevel {
  NONE = 0,     // No logging
  BASIC = 1,    // Just method and URL
  NORMAL = 2,   // Method, URL, status code, response time
  VERBOSE = 3,  // Everything including request and response bodies
}

export interface RequestLoggerOptions {
  level: LogLevel;
  // Optional callback for custom logging (defaults to console.log)
  logFn?: (message: string) => void;
}

const defaultOptions: RequestLoggerOptions = {
  level: LogLevel.NORMAL,
  logFn: (message: string) => console.log(message)
};

/**
 * Middleware to log HTTP requests
 * @param options Configuration options for the logger
 */
export function requestLogger(options: Partial<RequestLoggerOptions> = {}) {
  const config = { ...defaultOptions, ...options };
  
  return (req: Request, res: Response, next: NextFunction) => {
    // Skip logging if log level is NONE
    if (config.level === LogLevel.NONE) {
      return next();
    }
    
    // Record start time
    const startTime = Date.now();
    
    // Basic log information
    let logParts = [
      `[${new Date().toISOString()}]`,
      `${req.method}`,
      `${req.originalUrl}`
    ];
    
    // Add request body for VERBOSE level
    if (config.level >= LogLevel.VERBOSE) {
      // Only log body for certain content types and methods
      const contentType = req.get('Content-Type') || '';
      if (
        ['POST', 'PUT', 'PATCH'].includes(req.method) && 
        (contentType.includes('application/json') || contentType.includes('application/x-www-form-urlencoded'))
      ) {
        try {
          logParts.push(`Body: ${JSON.stringify(req.body)}`);
        } catch (err) {
          logParts.push(`Body: [Error: Could not stringify body]`);
        }
      }
    }
    
    // Log the request
    config.logFn!(logParts.join(' '));
    
    // Capture response data
    const originalSend = res.send;
    res.send = function (body) {
      // Restore original function
      res.send = originalSend;
      
      // Calculate request duration
      const duration = Date.now() - startTime;
      
      // For NORMAL and VERBOSE levels, log the response status and duration
      if (config.level >= LogLevel.NORMAL) {
        let responseLog = [
          `[${new Date().toISOString()}]`,
          `${req.method}`,
          `${req.originalUrl}`,
          `${res.statusCode}`,
          `${duration}ms`
        ];
        
        // For VERBOSE level, log response body
        if (config.level >= LogLevel.VERBOSE) {
          const contentType = res.get('Content-Type') || '';
          if (contentType.includes('application/json')) {
            try {
              responseLog.push(`Response: ${body}`);
            } catch (err) {
              responseLog.push(`Response: [Error: Could not stringify body]`);
            }
          }
        }
        
        config.logFn!(responseLog.join(' '));
      }
      
      // Call original send function and return its result
      return originalSend.call(this, body);
    };
    
    next();
  };
} 