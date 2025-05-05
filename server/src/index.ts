import dotenv from 'dotenv';
import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import { createSessionRouter } from './routes/session';
import { MockDataService } from './services/mockDataService';

// Load environment variables
dotenv.config();

const app = express();

// Initialize services
const dataService = new MockDataService();

// Middleware
app.use(cors());
app.use(express.json()); // Needed to parse JSON body

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
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
}); 