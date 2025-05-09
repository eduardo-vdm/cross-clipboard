import mongoose from 'mongoose';
import { getConfig } from '../config';
import { LogLevel } from '../middleware/requestLogger';

/**
 * MongoDB connection state management
 * Handles connection initialization, status logging, and reconnection
 */
class MongoConnection {
  private isConnected = false;
  private isConnecting = false;
  private uri: string = '';
  private logLevel: LogLevel = LogLevel.BASIC;

  /**
   * Initialize MongoDB connection
   * @returns Promise that resolves when connection is established
   */
  async connect(): Promise<typeof mongoose> {
    if (this.isConnected) {
      return mongoose; // Already connected
    }

    if (this.isConnecting) {
      // Wait for existing connection attempt to complete
      return new Promise((resolve) => {
        const checkConnection = setInterval(() => {
          if (this.isConnected) {
            clearInterval(checkConnection);
            resolve(mongoose);
          }
        }, 100);
      });
    }

    try {
      this.isConnecting = true;
      const config = getConfig();
      this.uri = config.mongoUri;
      this.logLevel = config.logging.level;
      
      // Set mongoose debug logging based on log level
      mongoose.set('debug', this.logLevel >= LogLevel.VERBOSE);

      // Configure connection options
      const options = {
        autoIndex: true,
        serverSelectionTimeoutMS: 5000,
        socketTimeoutMS: 45000,
      };

      // Log connection attempt
      if (this.logLevel >= LogLevel.BASIC) {
        console.log(`🔄 Connecting to MongoDB at: ${this.getRedactedUri()}`);
      }

      // Establish connection
      await mongoose.connect(this.uri, options);
      
      this.isConnected = true;
      this.isConnecting = false;

      // Log successful connection
      if (this.logLevel >= LogLevel.BASIC) {
        console.log('📦 Connected to MongoDB successfully');
        
        if (this.logLevel >= LogLevel.NORMAL) {
          // Log additional connection details
          const { connections } = mongoose;
          console.log(`DB Name: ${connections[0].name}`);
          console.log(`Host: ${connections[0].host}:${connections[0].port}`);
        }
      }

      // Set up connection event handlers
      mongoose.connection.on('disconnected', () => {
        this.isConnected = false;
        if (this.logLevel >= LogLevel.BASIC) {
          console.log('❌ MongoDB disconnected');
        }
      });

      mongoose.connection.on('reconnected', () => {
        this.isConnected = true;
        if (this.logLevel >= LogLevel.BASIC) {
          console.log('🔄 MongoDB reconnected');
        }
      });

      mongoose.connection.on('error', (err) => {
        if (this.logLevel >= LogLevel.BASIC) {
          console.error('❌ MongoDB connection error:', err);
        }
      });

      return mongoose;
    } catch (error) {
      this.isConnecting = false;
      console.error('❌ Failed to connect to MongoDB:', error);
      throw error;
    }
  }

  /**
   * Close MongoDB connection
   */
  async disconnect(): Promise<void> {
    if (!this.isConnected) return;
    
    try {
      await mongoose.disconnect();
      this.isConnected = false;
      if (this.logLevel >= LogLevel.BASIC) {
        console.log('📦 MongoDB connection closed');
      }
    } catch (error) {
      console.error('❌ Error closing MongoDB connection:', error);
      throw error;
    }
  }

  /**
   * Get connection status
   */
  getStatus(): { isConnected: boolean; isConnecting: boolean } {
    return {
      isConnected: this.isConnected,
      isConnecting: this.isConnecting
    };
  }

  /**
   * Redact sensitive parts of the MongoDB URI for logging
   */
  private getRedactedUri(): string {
    try {
      const url = new URL(this.uri);
      // Redact password if present
      if (url.password) {
        url.password = '***';
      }
      return url.toString();
    } catch {
      // If URI parsing fails, return a generic string
      return 'mongodb://<connection-details-redacted>';
    }
  }
}

// Export a singleton instance
export const mongoConnection = new MongoConnection();

// For convenience, also export the mongoose instance
export default mongoose; 