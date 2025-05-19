import fs from 'fs/promises';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { Session, ClipboardItem, ItemType, DataService, UpdateItemResponse, TokenMetadata, TokenResponse } from '../types';
import { SessionNotFoundError, SessionArchivedException, SessionCodeGenerationError } from '../types/errors';
import { ISession, IToken } from '../db/schemas';

const DATA_DIR = path.join(__dirname, '../../data');
const SESSIONS_FILE = path.join(DATA_DIR, 'sessions.json');
const TOKENS_FILE = path.join(DATA_DIR, 'tokens.json');
// Ensure data directory exists
async function ensureDataDir() {
  try {
    await fs.access(DATA_DIR);
  } catch {
    await fs.mkdir(DATA_DIR, { recursive: true });
    await fs.writeFile(SESSIONS_FILE, JSON.stringify({}));
  }
}

async function readSessions(): Promise<Record<string, ISession>> {
  await ensureDataDir();
  try {
    const data = await fs.readFile(SESSIONS_FILE, 'utf-8');
    const sessions = JSON.parse(data);
    // Ensure all sessions have isArchived field
    Object.values(sessions).forEach((session: any) => {
      if (!('isArchived' in session)) {
        session.isArchived = false;
      }
    });
    return sessions;
  } catch {
    return {};
  }
}

async function saveSessions(sessions: Record<string, ISession>): Promise<void> {
  await ensureDataDir();
  await fs.writeFile(SESSIONS_FILE, JSON.stringify(sessions, null, 2));
}

async function saveTokens(tokens: Record<string, IToken>): Promise<void> {
  await ensureDataDir();
  await fs.writeFile(TOKENS_FILE, JSON.stringify(tokens, null, 2));
}

export class MockDataService implements DataService {
  private sessions: Record<string, ISession> = {};
  private tokens: Record<string, IToken> = {};

  constructor() {
    readSessions().then(sessions => {
      this.sessions = sessions;
    });
  }

  private generateSessionCode(): string {
    // Generate a random 6-digit number
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  private deepCopySession(session: ISession): Session {
    const { isArchived, ...sessionWithoutArchived } = session;
    return {
      ...sessionWithoutArchived,
      items: session.items.map(item => ({ ...item })),
      createdAt: new Date(session.createdAt),
      lastModified: new Date(session.lastModified)
    };
  }

  async createSession(deviceId: string): Promise<Session> {
    const session: ISession = {
      id: uuidv4(),
      code: this.generateSessionCode(),
      items: [],
      version: 1,
      createdAt: new Date(),
      lastModified: new Date(),
      isArchived: false,
      createdBy: deviceId
    };

    this.sessions[session.id] = session;
    await saveSessions(this.sessions);
    return this.deepCopySession(session);
  }

  async createOrRenewToken(fingerprint: string, metadata: TokenMetadata): Promise<TokenResponse> {
    const token = {
      token: uuidv4(),
      fingerprint,
      expiresAt: new Date(Date.now() + 60 * 60 * 1000),
      createdAt: new Date(),
      updatedAt: new Date(),
      metadata
    };

    this.tokens[token.token] = token;
    await saveTokens(this.tokens);
    return { token: token.token, expiresAt: token.expiresAt };
  }

  async validateToken(token: string, fingerprint: string): Promise<{ exists: boolean; expired: boolean; expiresAt: Date | null; metadata?: TokenMetadata }> {  
    const userToken = this.tokens[token];
    if (!userToken) return { exists: false, expired: false, expiresAt: null };

    if (userToken.fingerprint !== fingerprint) return { exists: false, expired: false, expiresAt: null };

    const now = new Date();
    if (now > userToken.expiresAt) return { exists: true, expired: true, expiresAt: userToken.expiresAt };

    return { exists: true,
      expired: false,
      metadata: userToken.metadata,
      expiresAt: userToken.expiresAt
    };
  }

  async getSession(id: string): Promise<Session | null> {
    const session = this.sessions[id];
    return session ? this.deepCopySession(session) : null;
  }

  async getSessionById(id: string): Promise<Session> {
    const session = this.sessions[id];
    if (!session) {
      throw new SessionNotFoundError(id, 'id');
    }
    return this.deepCopySession(session);
  }

  async getSessionByCode(code: string): Promise<Session> {
    const session = Object.values(this.sessions).find(s => s.code === code);
    if (!session) {
      throw new SessionNotFoundError(code, 'code');
    }
    return this.deepCopySession(session);
  }

  async deleteSession(id: string): Promise<boolean> {
    if (!this.sessions[id]) return false;
    this.sessions[id].isArchived = true;
    await saveSessions(this.sessions);
    return true;
  }

  async addItem(sessionId: string, type: ItemType, content: string, deviceId: string, deviceName: string): Promise<ClipboardItem> {
    const session = this.sessions[sessionId];
    if (!session) {
      throw new SessionNotFoundError(sessionId, 'id');
    }

    const item: ClipboardItem = {
      id: uuidv4(),
      type,
      content,
      createdAt: new Date(),
      lastModified: new Date(),
      version: 1,
      deviceId,
      deviceName
    };

    session.items.push(item);
    session.version++;
    session.lastModified = new Date();
    await saveSessions(this.sessions);
    
    // Return a new object to break the reference
    return { ...item };
  }

  async updateItem(
    sessionId: string, 
    itemId: string, 
    content: string, 
    version: number,
    deviceId: string
  ): Promise<UpdateItemResponse> {
    const session = this.sessions[sessionId];
    if (!session) {
      throw new SessionNotFoundError(sessionId, 'id');
    }

    const item = session.items.find(i => i.id === itemId);
    if (!item) {
      return { success: false };
    }

    // Check if user has permission to edit this item
    if (item.deviceId && deviceId && item.deviceId !== deviceId) {
      return { success: false };
    }

    if (item.version !== version) {
      return { 
        success: false, 
        conflict: {
          serverVersion: item.version,
          serverContent: item.content
        }
      };
    }

    item.content = content;
    item.version++;
    item.lastModified = new Date();
    session.version++;
    session.lastModified = new Date();
    await saveSessions(this.sessions);

    return { 
      success: true, 
      item: { ...item }
    };
  }

  async deleteItem(sessionId: string, itemId: string, deviceId: string): Promise<boolean> {
    const session = this.sessions[sessionId];
    if (!session) return false;

    const itemIndex = session.items.findIndex(i => i.id === itemId);
    if (itemIndex === -1) return false;

    const item = session.items[itemIndex];
    
    // Check if user has permission to delete this item
    if (item.deviceId && deviceId && item.deviceId !== deviceId) {
      return false;
    }

    session.items.splice(itemIndex, 1);
    session.version++;
    session.lastModified = new Date();
    await saveSessions(this.sessions);
    return true;
  }

  async wipeSession(sessionId: string, deviceId: string): Promise<void> {
    const session = this.sessions[sessionId];
    if (!session) {
      throw new SessionNotFoundError(sessionId, 'id');
    }

    if (session.isArchived) {
      throw new SessionArchivedException(sessionId, 'id');
    }

    // Check if the device is the session creator
    if (session.createdBy !== deviceId) {
      throw new Error('Only the session creator can wipe all items');
    }

    // Clear all items and update session version
    session.items = [];
    session.version += 1;
    session.lastModified = new Date();
    await saveSessions(this.sessions);
  }

  /**
   * Removes all items from a deviceId from a session
   * @param {string} sessionId - The session ID
   * @param {string} deviceId - The device ID requesting the removal
   * @throws {SessionNotFoundError} If session not found
   * @throws {SessionArchivedException} If session is archived
   */
  async removeMyItems(sessionId: string, deviceId: string): Promise<boolean> {
    const session = this.sessions[sessionId];
    if (!session) return false;

    // Filter out items that match the deviceId
    const items = session.items.filter(i => i.deviceId !== deviceId);
    if (items.length === session.items.length) return false;

    // Update the session with the filtered items
    session.items = items;
    session.version += 1;
    session.lastModified = new Date();
    await saveSessions(this.sessions);
    return true;
  }
} 