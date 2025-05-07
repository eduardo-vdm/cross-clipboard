import { DataService } from '../types';
import { MockDataService } from '../services/mockDataService';
import { MongoDataService } from '../services/mongoDataService';
import mongoose, { Connection } from 'mongoose';

export const TEST_MONGO_URI = process.env.MONGO_URI_TEST || 'mongodb://crossclip_app_test:clip123secure@localhost:27017/crossclip_app_test?authSource=cross_clipboard';

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
      console.log('Connecting to MongoDB at:', TEST_MONGO_URI);
      await mongoose.connect(TEST_MONGO_URI);
      console.log('Successfully connected to MongoDB');

      // Clear all collections at startup
      await clearCollections(mongoose.connection);
      console.log('Collections cleared');
      
      // Add mongoose debug logging
      mongoose.set('debug', true);
      
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
      const connection = mongoose.connection as Connection;
      if (connection.readyState === 1) {
        // Just close the connection, don't drop the database
        await connection.close();
        console.log('MongoDB connection closed');
      }
    } catch (error) {
      console.error('Error during cleanup:', error);
      throw error;
    }
  }
} 