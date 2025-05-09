import dotenv from 'dotenv';
import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import { createSessionRouter } from './routes/session';
import { getConfig, getDataService } from './config';
import { requestLogger } from './middleware/requestLogger';

// Load environment variables
dotenv.config();

const app = express();

// Initialize services
const dataService = getDataService();
const config = getConfig();

// Middleware
app.use(cors());
app.use(express.json()); // Needed to parse JSON body

// Set up request logging
if (config.logging.enabled) {
  console.log(`Request logging enabled at level: ${config.logging.level}`);
  app.use(requestLogger({ level: config.logging.level }));
} else {
  console.log('Request logging is disabled');
}

// Routes
app.use('/api', createSessionRouter(dataService));

// Error handling middleware
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error(err.stack);
  res.status(500).json({ 
    error: 'Something went wrong!',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// Handle 404s
app.use((req: Request, res: Response) => {
  res.status(404).json({ error: 'Not found' });
});

// Start the server
app.listen(config.port, () => {
  console.log(`🚀 Server running on port ${config.port}`);
  console.log(`Mode: ${config.serverMode}`);
  console.log(`Service: ${config.serviceMode}`);
}); 