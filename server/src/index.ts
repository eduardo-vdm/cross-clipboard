import dotenv from 'dotenv';
import express, { Request, Response, NextFunction } from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { getConfig, getDataService } from './config';
import { createSessionRouter } from './routes/session';
import { createAuthRouter } from './routes/auth';
import { createAuthMiddleware } from './middleware/auth';
import { requestLogger } from './middleware/requestLogger';
import { errorHandler } from './middleware/errorHandler';
import { mongoConnection } from './db/connection';
import { createCorsMiddleware } from './middleware/cors';

// Load environment variables
dotenv.config();

// Get configuration
const config = getConfig();

// Initialize the application
const app = express();
const server = createServer(app);
const io = new Server(server);

// debugging socket.io
io.on('connection', (socket) => {
  console.log('>> A user connected through socket.io');
  // send the string to the client
  socket.emit('welcome', { message: '>> You are connected through socket.io' });

  socket.on('test:event', (data) => {
    console.log('>> Received test event:', data);
    socket.emit('test:response', { received: true, data });
  });
});

// Middleware
app.use(createCorsMiddleware());
app.use(express.json()); // Needed to parse JSON body

// Set up request logging
if (config.logging.enabled) {
  console.log(`Request logging enabled at level: ${config.logging.level}`);
  app.use(requestLogger({ level: config.logging.level }));
} else {
  console.log('Request logging is disabled');
}

// Initialize services asynchronously
async function initializeServer() {
  // Initialize MongoDB connection if using the mongo service
  if (config.serviceMode === 'mongo') {
    try {
      await mongoConnection.connect();
    } catch (error) {
      console.error('Failed to connect to MongoDB. Server will start but database operations will fail:', error);
    }
  }

  // Initialize data service
  const dataService = getDataService();

  // Routes
  app.use('/api', createAuthMiddleware(dataService));
  app.use('/api', createSessionRouter(dataService));
  app.use('/api', createAuthRouter(dataService));

  // Handle 404s
  app.use((req: Request, res: Response) => {
    res.status(404).json({ error: 'Not found' });
  });

  // Error handling middleware
  app.use(errorHandler);

  // Start the server
  server.listen(config.port, () => {
    console.log(`🚀 Server running with socket.io at ${config.port}`);
    console.log(`Mode: ${config.serverMode}`);
    console.log(`Service: ${config.serviceMode}`);
  });
}

// Start the server
initializeServer().catch(error => {
  console.error('Failed to initialize server:', error);
  process.exit(1);
}); 