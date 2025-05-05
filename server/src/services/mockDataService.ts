import fs from 'fs/promises';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { Session, ClipboardItem, ItemType, DataService, UpdateItemResponse } from '../types';

const DATA_DIR = path.join(__dirname, '../../data');
const SESSIONS_FILE = path.join(DATA_DIR, 'sessions.json');

// Ensure data directory exists
async function ensureDataDir() {
  try {
    await fs.access(DATA_DIR);
  } catch {
    await fs.mkdir(DATA_DIR, { recursive: true });
    await fs.writeFile(SESSIONS_FILE, JSON.stringify({}));
  }
}

async function readSessions(): Promise<Record<string, Session>> {
  await ensureDataDir();
  try {
    const data = await fs.readFile(SESSIONS_FILE, 'utf-8');
    return JSON.parse(data);
  } catch {
    return {};
  }
}

async function saveSessions(sessions: Record<string, Session>): Promise<void> {
  await ensureDataDir();
  await fs.writeFile(SESSIONS_FILE, JSON.stringify(sessions, null, 2));
}

export class MockDataService implements DataService {
  private sessions: Record<string, Session> = {};

  constructor() {
    readSessions().then(sessions => {
      this.sessions = sessions;
    });
  }

  async createSession(): Promise<Session> {
    const session: Session = {
      id: uuidv4(),
      items: [],
      version: 1,
      createdAt: new Date(),
      lastModified: new Date()
    };

    this.sessions[session.id] = session;
    await saveSessions(this.sessions);
    return { ...session };
  }

  async getSession(id: string): Promise<Session | null> {
    const session = this.sessions[id];
    return session ? { ...session } : null;
  }

  async deleteSession(id: string): Promise<boolean> {
    if (!this.sessions[id]) return false;
    delete this.sessions[id];
    await saveSessions(this.sessions);
    return true;
  }

  async addItem(sessionId: string, type: ItemType, content: string): Promise<ClipboardItem | null> {
    const session = this.sessions[sessionId];
    if (!session) return null;

    const item: ClipboardItem = {
      id: uuidv4(),
      type,
      content,
      createdAt: new Date(),
      lastModified: new Date(),
      version: 1
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
    version: number
  ): Promise<UpdateItemResponse> {
    const session = this.sessions[sessionId];
    if (!session) return { success: false };

    const item = session.items.find(i => i.id === itemId);
    if (!item) return { success: false };

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

  async deleteItem(sessionId: string, itemId: string): Promise<boolean> {
    const session = this.sessions[sessionId];
    if (!session) return false;

    const itemIndex = session.items.findIndex(i => i.id === itemId);
    if (itemIndex === -1) return false;

    session.items.splice(itemIndex, 1);
    session.version++;
    session.lastModified = new Date();
    await saveSessions(this.sessions);
    return true;
  }
} 