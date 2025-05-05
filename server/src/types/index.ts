export type ItemType = 'text' | 'image';

export interface ClipboardItem {
  id: string;
  type: ItemType;
  content: string;
  createdAt: Date;
  lastModified: Date;
  version: number;
}

export interface Session {
  id: string;
  items: ClipboardItem[];
  version: number;
  createdAt: Date;
  lastModified: Date;
}

export interface CreateSessionResponse {
  id: string;
  version: number;
  createdAt: Date;
  lastModified: Date;
}

export interface UpdateItemResponse {
  success: boolean;
  item?: ClipboardItem;
  conflict?: {
    serverVersion: number;
    serverContent: string;
  };
}

export interface VersionConflict {
  error: string;
  serverVersion: number;
  serverContent: string;
}

// Define the interface that all data services must implement
export interface DataService {
  createSession(): Promise<Session>;
  getSession(id: string): Promise<Session | null>;
  deleteSession(id: string): Promise<boolean>;
  addItem(sessionId: string, type: ItemType, content: string): Promise<ClipboardItem | null>;
  updateItem(sessionId: string, itemId: string, content: string, version: number): Promise<UpdateItemResponse>;
  deleteItem(sessionId: string, itemId: string): Promise<boolean>;
} 