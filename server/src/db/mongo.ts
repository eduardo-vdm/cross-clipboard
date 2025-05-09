import mongoose from 'mongoose';

class MongoManager {
  private static instance: MongoManager;
  private isConnected: boolean = false;

  private constructor() {}

  static getInstance(): MongoManager {
    if (!MongoManager.instance) {
      MongoManager.instance = new MongoManager();
    }
    return MongoManager.instance;
  }

  async connect(): Promise<void> {
    if (this.isConnected) {
      return;
    }

    const uri = process.env.MONGODB_URI;
    if (!uri) {
      throw new Error('MONGODB_URI environment variable is not set');
    }

    try {
      await mongoose.connect(uri);
      this.isConnected = true;
      console.log('🗃️  Connected to MongoDB');

      // Handle connection errors after initial connection
      mongoose.connection.on('error', (error: Error) => {
        console.error('MongoDB connection error:', error);
        this.isConnected = false;
      });

      mongoose.connection.on('disconnected', () => {
        console.warn('MongoDB disconnected');
        this.isConnected = false;
      });

      // Graceful shutdown
      process.on('SIGINT', this.closeConnection.bind(this));
      process.on('SIGTERM', this.closeConnection.bind(this));
    } catch (error) {
      console.error('Failed to connect to MongoDB:', error);
      throw error;
    }
  }

  async closeConnection(): Promise<void> {
    if (this.isConnected) {
      try {
        await mongoose.connection.close();
        this.isConnected = false;
        console.log('MongoDB connection closed');
      } catch (error) {
        console.error('Error closing MongoDB connection:', error);
        throw error;
      }
    }
  }

  getConnection(): mongoose.Connection {
    if (!this.isConnected) {
      throw new Error('MongoDB is not connected. Call connect() first.');
    }
    return mongoose.connection;
  }
}

export const mongoManager = MongoManager.getInstance(); 