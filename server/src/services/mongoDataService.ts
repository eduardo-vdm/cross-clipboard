import { v4 as uuidv4 } from 'uuid';
import mongoose from 'mongoose';
import { 
  Session as SessionModel, 
  ISessionDocument, 
  IClipboardItemDocument,
  IClipboardItem
} from '../db/schemas';
import { DataService, Session, ItemType, UpdateItemResponse, ClipboardItem } from '../types';
import {
  SessionNotFoundError,
  SessionCodeGenerationError,
  SessionArchivedException,
  ItemNotFoundError,
  VersionConflictError,
  DatabaseError
} from '../types/errors';
import { mongoConnection } from '../db/connection';

export class MongoDataService implements DataService {
  /**
   * Ensures MongoDB connection is established before performing operations
   */
  private async ensureConnection(): Promise<void> {
    try {
      await mongoConnection.connect();
    } catch (error: any) {
      throw new DatabaseError('Failed to connect to MongoDB', error.message);
    }
  }

  private async generateUniqueCode(): Promise<string> {
    let attempts = 0;
    const maxAttempts = 10;
    
    while (attempts < maxAttempts) {
      // Generate a random 6-digit number
      const code = Math.floor(100000 + Math.random() * 900000).toString();
      
      // Check if code exists
      const existingSession = await SessionModel.findOne({ code });
      if (!existingSession) {
        return code;
      }
      
      attempts++;
    }
    
    throw new SessionCodeGenerationError(maxAttempts);
  }

  async createSession(deviceId: string): Promise<Session> {
    await this.ensureConnection();
    
    try {
      const code = await this.generateUniqueCode();
      const session = new SessionModel({
        id: uuidv4(),
        code,
        items: [],
        version: 1,
        createdAt: new Date(),
        lastModified: new Date(),
        isArchived: false,
        createdBy: deviceId
      });

      await session.save();
      return this.mapSessionDocument(session);
    } catch (error: any) {
      if (error instanceof SessionCodeGenerationError) {
        throw error;
      }
      throw new DatabaseError('Failed to create session', error.message);
    }
  }

  async getSessionById(id: string): Promise<Session> {
    await this.ensureConnection();
    
    try {
      const session = await SessionModel.findOne({ id, isArchived: false });
      if (!session) {
        throw new SessionNotFoundError(id, 'id');
      }
      
      return this.mapSessionDocument(session);
    } catch (error: any) {
      if (error instanceof SessionNotFoundError) {
        throw error;
      }
      throw new DatabaseError('Failed to get session by ID', error.message);
    }
  }

  async getSessionByCode(code: string): Promise<Session> {
    await this.ensureConnection();
    
    try {
      const session = await SessionModel.findOne({ code, isArchived: false });
      if (!session) {
        throw new SessionNotFoundError(code, 'code');
      }
      
      return this.mapSessionDocument(session);
    } catch (error: any) {
      if (error instanceof SessionNotFoundError) {
        throw error;
      }
      throw new DatabaseError('Failed to get session by code', error.message);
    }
  }

  // Implement the interface method to maintain compatibility
  async getSession(id: string): Promise<Session | null> {
    try {
      return await this.getSessionById(id);
    } catch (error) {
      if (error instanceof SessionNotFoundError || error instanceof SessionArchivedException) {
        return null;
      }
      throw error;
    }
  }

  async deleteSession(id: string): Promise<boolean> {
    await this.ensureConnection();
    
    try {
      const session = await SessionModel.findOne({ id, isArchived: false });
      if (!session) {
        throw new SessionNotFoundError(id, 'id');
      }
      
      session.isArchived = true;
      await session.save();
      return true;
    } catch (error: any) {
      if (error instanceof SessionNotFoundError) {
        throw error;
      }
      throw new DatabaseError('Failed to delete session', error.message);
    }
  }

  async addItem(sessionId: string, type: ItemType, content: string, deviceId: string, deviceName: string): Promise<ClipboardItem> {
    await this.ensureConnection();
    
    try {
      const session = await SessionModel.findOne({ id: sessionId, isArchived: false });
      if (!session) {
        throw new SessionNotFoundError(sessionId, 'id');
      }
      
      // Get all existing device names and their assigned letters in the session
      const deviceNameMap = new Map<string, string>();
      session.items.forEach(item => {
        if (item.deviceId && item.deviceName) {
          deviceNameMap.set(item.deviceId, item.deviceName);
        }
      });
      
      // If this deviceId already has a name, use it
      let finalDeviceName = deviceNameMap.get(deviceId);
      
      // If not, assign a new letter
      if (!finalDeviceName) {
        // Get all existing letters for this base device name
        const existingLetters = new Set(
          Array.from(deviceNameMap.values())
            .filter(name => name.startsWith(deviceName))
            .map(name => name.split(' ').pop())
        );
        
        // Find the first available letter
        let letterIndex = 0;
        while (existingLetters.has(String.fromCharCode(65 + letterIndex))) {
          letterIndex++;
        }
        
        finalDeviceName = `${deviceName} ${String.fromCharCode(65 + letterIndex)}`;
      }
      
      const newItem = {
        id: uuidv4(),
        type,
        content,
        version: 1,
        createdAt: new Date(),
        lastModified: new Date(),
        deviceId,
        deviceName: finalDeviceName
      };
      
      session.items.push(newItem as unknown as IClipboardItemDocument);
      session.version += 1;
      session.lastModified = new Date();
      await session.save();
      
      return newItem;
    } catch (error: any) {
      if (error instanceof SessionNotFoundError) {
        throw error;
      }
      throw new DatabaseError('Failed to add item', error.message);
    }
  }

  async updateItem(
    sessionId: string, 
    itemId: string, 
    content: string, 
    version: number,
    deviceId: string
  ): Promise<UpdateItemResponse> {
    await this.ensureConnection();
    
    try {
      const session = await SessionModel.findOne({ id: sessionId, isArchived: false });
      if (!session) {
        throw new SessionNotFoundError(sessionId, 'id');
      }
      
      const itemIndex = session.items.findIndex(item => item.id === itemId);
      if (itemIndex === -1) {
        throw new ItemNotFoundError(itemId, sessionId);
      }
      
      const item = session.items[itemIndex];
      
      // Check if user has permission to edit this item
      if (item.deviceId && deviceId && item.deviceId !== deviceId) {
        return { success: false };
      }
      
      // Version conflict check
      if (item.version !== version) {
        return {
          success: false,
          conflict: {
            serverVersion: item.version,
            serverContent: item.content
          }
        };
      }
      
      // Apply the update
      item.content = content;
      item.version += 1;
      item.lastModified = new Date();
      session.version += 1;
      session.lastModified = new Date();
      await session.save();
      
      return {
        success: true,
        item: this.mapToClipboardItem(item)
      };
    } catch (error: any) {
      if (error instanceof SessionNotFoundError || error instanceof ItemNotFoundError) {
        throw error;
      }
      throw new DatabaseError('Failed to update item', error.message);
    }
  }

  async deleteItem(sessionId: string, itemId: string, deviceId: string): Promise<boolean> {
    await this.ensureConnection();
    
    try {
      const session = await SessionModel.findOne({ id: sessionId, isArchived: false });
      if (!session) {
        throw new SessionNotFoundError(sessionId, 'id');
      }
      
      const itemIndex = session.items.findIndex(item => item.id === itemId);
      if (itemIndex === -1) {
        throw new ItemNotFoundError(itemId, sessionId);
      }
      
      const item = session.items[itemIndex];
      
      // Check if user has permission to delete this item
      if (item.deviceId && deviceId && item.deviceId !== deviceId) {
        return false;
      }
      
      // Remove the item
      session.items.splice(itemIndex, 1);
      session.version += 1;
      session.lastModified = new Date();
      await session.save();
      
      return true;
    } catch (error: any) {
      if (error instanceof SessionNotFoundError || error instanceof ItemNotFoundError) {
        throw error;
      }
      throw new DatabaseError('Failed to delete item', error.message);
    }
  }

  async wipeSession(sessionId: string, deviceId: string): Promise<void> {
    await this.ensureConnection();
    
    try {
      const session = await SessionModel.findOne({ id: sessionId, isArchived: false });
      if (!session) {
        throw new SessionNotFoundError(sessionId, 'id');
      }

      // Check if the device is the session creator
      if (session.createdBy !== deviceId) {
        throw new Error('Only the session creator can wipe all items');
      }
      
      // Clear all items and update session version
      session.items = [];
      session.version += 1;
      session.lastModified = new Date();
      await session.save();
    } catch (error: any) {
      if (error instanceof SessionNotFoundError) {
        throw error;
      }
      throw new DatabaseError('Failed to wipe session', error.message);
    }
  }

  private mapSessionDocument(sessionDoc: ISessionDocument): Session {
    // Remove isArchived from the session
    const { isArchived, ...session } = sessionDoc.toObject();
    return session as Session;
  }

  private mapToClipboardItem(doc: IClipboardItemDocument | IClipboardItem): ClipboardItem {
    return {
      id: doc.id,
      type: doc.type,
      content: doc.content,
      version: doc.version,
      createdAt: doc.createdAt,
      lastModified: doc.lastModified,
      deviceId: doc.deviceId,
      deviceName: doc.deviceName
    };
  }
} 