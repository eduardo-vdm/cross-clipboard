import { v4 as uuidv4 } from 'uuid';
import { 
  Session as SessionModel, 
  ISessionDocument, 
  IClipboardItemDocument,
  IClipboardItem
} from '../db/schemas';
import { DataService, Session, ItemType, UpdateItemResponse } from '../types';
import {
  SessionNotFoundError,
  SessionCodeGenerationError,
  SessionArchivedException,
  ItemNotFoundError,
  VersionConflictError
} from '../types/errors';

export class MongoDataService implements DataService {
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

  async createSession(): Promise<Session> {
    const code = await this.generateUniqueCode();
    const session = new SessionModel({
      id: uuidv4(),
      code,
      items: [],
      version: 1,
      createdAt: new Date(),
      lastModified: new Date(),
      isArchived: false
    });

    await session.save();
    return this.mapSessionDocument(session);
  }

  async getSessionById(id: string): Promise<Session> {
    const session = await SessionModel.findOne({ id });
    
    if (!session) {
      throw new SessionNotFoundError(id, 'id');
    }
    
    if (session.isArchived) {
      throw new SessionArchivedException(id, 'id');
    }

    return this.mapSessionDocument(session);
  }

  async getSessionByCode(code: string): Promise<Session> {
    const session = await SessionModel.findOne({ code });
    
    if (!session) {
      throw new SessionNotFoundError(code, 'code');
    }
    
    if (session.isArchived) {
      throw new SessionArchivedException(code, 'code');
    }

    return this.mapSessionDocument(session);
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
    const result = await SessionModel.updateOne(
      { id, isArchived: false },
      { isArchived: true }
    );
    
    if (result.matchedCount === 0) {
      const session = await SessionModel.findOne({ id });
      if (!session) {
        throw new SessionNotFoundError(id, 'id');
      }
      if (session.isArchived) {
        throw new SessionArchivedException(id, 'id');
      }
    }
    
    return result.modifiedCount > 0;
  }

  async addItem(sessionId: string, type: ItemType, content: string): Promise<IClipboardItem> {
    const session = await SessionModel.findOne({ id: sessionId });
    
    if (!session) {
      throw new SessionNotFoundError(sessionId, 'id');
    }
    
    if (session.isArchived) {
      throw new SessionArchivedException(sessionId, 'id');
    }

    const newItem: IClipboardItem = {
      id: uuidv4(),
      type,
      content,
      version: 1,
      createdAt: new Date(),
      lastModified: new Date()
    };

    session.items.push(newItem as any); // TODO: Fix type casting once we resolve the Document type issue
    session.version++;
    session.lastModified = new Date();
    await session.save();

    return newItem;
  }

  async updateItem(
    sessionId: string,
    itemId: string,
    content: string,
    version: number
  ): Promise<UpdateItemResponse> {
    const session = await SessionModel.findOne({ id: sessionId });
    
    if (!session) {
      throw new SessionNotFoundError(sessionId, 'id');
    }
    
    if (session.isArchived) {
      throw new SessionArchivedException(sessionId, 'id');
    }

    const item = session.items.find(i => i.id === itemId);
    if (!item) {
      throw new ItemNotFoundError(itemId, sessionId);
    }

    if (item.version !== version) {
      throw new VersionConflictError(itemId, version, item.version);
    }

    item.content = content;
    item.version++;
    item.lastModified = new Date();
    session.version++;
    session.lastModified = new Date();
    await session.save();

    return {
      success: true,
      item: this.mapClipboardItemDocument(item)
    };
  }

  async deleteItem(sessionId: string, itemId: string): Promise<boolean> {
    const session = await SessionModel.findOne({ id: sessionId });
    
    if (!session) {
      throw new SessionNotFoundError(sessionId, 'id');
    }
    
    if (session.isArchived) {
      throw new SessionArchivedException(sessionId, 'id');
    }

    const itemIndex = session.items.findIndex(i => i.id === itemId);
    if (itemIndex === -1) {
      throw new ItemNotFoundError(itemId, sessionId);
    }

    session.items.splice(itemIndex, 1);
    session.version++;
    session.lastModified = new Date();
    await session.save();
    return true;
  }

  private mapSessionDocument(doc: ISessionDocument): Session {
    const { isArchived, ...sessionData } = {
      id: doc.id,
      code: doc.code,
      items: doc.items.map(item => this.mapClipboardItemDocument(item)),
      version: doc.version,
      createdAt: doc.createdAt,
      lastModified: doc.lastModified,
      isArchived: doc.isArchived
    };
    return sessionData;
  }

  private mapClipboardItemDocument(doc: IClipboardItemDocument | IClipboardItem): IClipboardItem {
    return {
      id: doc.id,
      type: doc.type,
      content: doc.content,
      version: doc.version,
      createdAt: doc.createdAt,
      lastModified: doc.lastModified
    };
  }
} 