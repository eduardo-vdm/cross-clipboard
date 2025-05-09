import { DataService } from '../types';
import { MockDataService } from '../services/mockDataService';
import { MongoDataService } from '../services/mongoDataService';
import mongoose, { Connection } from 'mongoose';
import { mongoConnection } from '../db/connection';
import { LogLevel } from '../middleware/requestLogger';

export const TEST_MONGO_URI = process.env.MONGO_URI_TEST || 'mongodb://crossclip_app_test:clip123secure@localhost:27017/crossclip_app_test?authSource=cross_clipboard';

// Save original configuration environment variables
const originalEnv = {
  MONGO_URI: process.env.MONGO_URI,
  LOG_LEVEL: process.env.LOG_LEVEL
};

// Set up test environment variables
function setupTestEnv() {
  // Override the MongoDB URI for tests
  process.env.MONGO_URI = TEST_MONGO_URI;
  // Set logging level to NONE for tests by default unless specified otherwise
  process.env.LOG_LEVEL = process.env.TEST_LOG_LEVEL || 'NONE';
}

// Restore original environment variables
function restoreEnv() {
  // Restore original environment variables
  process.env.MONGO_URI = originalEnv.MONGO_URI;
  process.env.LOG_LEVEL = originalEnv.LOG_LEVEL;
}

async function clearCollections(connection: Connection) {
  if (!connection.db) {
    throw new Error('Database not available on connection');
  }
  const collections = await connection.db.collections();
  for (const collection of collections) {
    await collection.deleteMany({});
  }
}

export async function getTestDataService(): Promise<DataService> {
  const testMode = process.env.TEST_MODE || 'mock';

  if (testMode === 'mongo') {
    try {
      // Set up test environment
      setupTestEnv();

      // Use our connection module which handles all the configuration
      await mongoConnection.connect();
      
      console.log('Successfully connected to MongoDB for tests');

      // Clear all collections at startup
      await clearCollections(mongoose.connection);
      console.log('Collections cleared');
      
      // Set Mongoose debug mode based on test log level
      const testLogLevel = process.env.TEST_LOG_LEVEL?.toUpperCase();
      mongoose.set('debug', testLogLevel === 'VERBOSE');
      
      return new MongoDataService();
    } catch (error) {
      console.error('Failed to connect to MongoDB or clear collections:', error);
      throw error;
    }
  }

  return new MockDataService();
}

export async function cleanupTestDataService(): Promise<void> {
  const testMode = process.env.TEST_MODE || 'mock';

  if (testMode === 'mongo') {
    try {
      await mongoConnection.disconnect();
      console.log('MongoDB connection closed for tests');
      
      // Restore original environment
      restoreEnv();
    } catch (error) {
      console.error('Error during cleanup:', error);
      throw error;
    }
  }
} 