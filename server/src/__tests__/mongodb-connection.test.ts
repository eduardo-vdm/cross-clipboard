/// <reference types="jest" />

import { mongoConnection } from '../db/connection';
import mongoose from 'mongoose';

// Only run these tests if explicitly testing MongoDB connection
const testMode = process.env.TEST_MODE;
const runTests = testMode === 'mongo';
const testFn = runTests ? describe : describe.skip;

testFn('MongoDB Connection Module', () => {
  afterEach(async () => {
    // Disconnect after each test to ensure clean state
    await mongoConnection.disconnect();
  });

  it('should establish a MongoDB connection', async () => {
    // Setup test environment
    process.env.MONGO_URI = process.env.MONGO_URI_TEST || 'mongodb://crossclip_app_test:clip123secure@localhost:27017/crossclip_app_test?authSource=cross_clipboard';
    
    // Connect
    const mongooseInstance = await mongoConnection.connect();
    
    // Verify mongoose instance is returned
    expect(mongooseInstance).toBe(mongoose);
    
    // Verify connection is established
    expect(mongoose.connection.readyState).toBe(1); // 1 = connected
    
    // Verify connection status
    const status = mongoConnection.getStatus();
    expect(status.isConnected).toBe(true);
    expect(status.isConnecting).toBe(false);
  });

  it('should handle connection errors gracefully', async () => {
    // Save original implementation
    const originalConnectImpl = mongoose.connect;
    
    // Mock mongoose.connect to throw an error
    mongoose.connect = jest.fn().mockRejectedValue(new Error('Connection failure'));
    
    try {
      // The connection module should catch the error internally and log it,
      // but should still reject the promise ultimately
      await expect(mongoConnection.connect()).rejects.toThrow();
    } finally {
      // Restore original implementation
      mongoose.connect = originalConnectImpl;
      // Reset connection state for other tests
      (mongoConnection as any).isConnecting = false;
    }
  });

  it('should reuse existing connection without reconnecting', async () => {
    // Connect first time
    await mongoConnection.connect();
    
    // Spy on mongoose.connect
    const connectSpy = jest.spyOn(mongoose, 'connect');
    
    // Connect again - should reuse existing connection
    await mongoConnection.connect();
    
    // Should not have called mongoose.connect again
    expect(connectSpy).not.toHaveBeenCalled();
    
    // Restore original method
    connectSpy.mockRestore();
  });

  it('should properly disconnect from MongoDB', async () => {
    // Connect first
    await mongoConnection.connect();
    expect(mongoose.connection.readyState).toBe(1);
    
    // Disconnect
    await mongoConnection.disconnect();
    
    // Verify disconnected
    expect(mongoose.connection.readyState).toBe(0); // 0 = disconnected
    
    // Verify connection status
    const status = mongoConnection.getStatus();
    expect(status.isConnected).toBe(false);
  });

  it('should handle duplicate disconnect calls gracefully', async () => {
    // Connect first
    await mongoConnection.connect();
    
    // Disconnect once
    await mongoConnection.disconnect();
    
    // Disconnect again - should not throw
    await expect(mongoConnection.disconnect()).resolves.not.toThrow();
  });
}); 