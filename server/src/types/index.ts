import { ISession, IClipboardItem } from '../db/schemas';

export type ItemType = 'text' | 'image';

export type ClipboardItem = IClipboardItem;
export type Session = Omit<ISession, 'isArchived'>;

export interface CreateSessionResponse {
  id: string;
  code: string;
  version: number;
  createdAt: Date;
  lastModified: Date;
}

export interface UpdateItemResponse {
  success: boolean;
  item: ClipboardItem;
}

export interface VersionConflict {
  error: string;
  serverVersion: number;
  serverContent: string;
}

// Define the interface that all data services must implement
export interface DataService {
  /**
   * Creates a new session with a unique code
   * @throws {SessionCodeGenerationError} If unable to generate a unique code
   */
  createSession(): Promise<Session>;

  /**
   * Gets a session by ID (backward compatibility method)
   * @returns null if session not found or archived
   */
  getSession(id: string): Promise<Session | null>;

  /**
   * Gets a session by its UUID
   * @throws {SessionNotFoundError} If session not found
   * @throws {SessionArchivedException} If session is archived
   */
  getSessionById(id: string): Promise<Session>;

  /**
   * Gets a session by its 6-digit code
   * @throws {SessionNotFoundError} If session not found
   * @throws {SessionArchivedException} If session is archived
   */
  getSessionByCode(code: string): Promise<Session>;

  /**
   * Marks a session as archived
   * @throws {SessionNotFoundError} If session not found
   * @throws {SessionArchivedException} If session is already archived
   */
  deleteSession(id: string): Promise<boolean>;

  /**
   * Adds a new item to a session
   * @throws {SessionNotFoundError} If session not found
   * @throws {SessionArchivedException} If session is archived
   */
  addItem(sessionId: string, type: ItemType, content: string): Promise<ClipboardItem>;

  /**
   * Updates an existing item in a session
   * @throws {SessionNotFoundError} If session not found
   * @throws {SessionArchivedException} If session is archived
   * @throws {ItemNotFoundError} If item not found in session
   * @throws {VersionConflictError} If item version doesn't match
   */
  updateItem(sessionId: string, itemId: string, content: string, version: number): Promise<UpdateItemResponse>;

  /**
   * Deletes an item from a session
   * @throws {SessionNotFoundError} If session not found
   * @throws {SessionArchivedException} If session is archived
   * @throws {ItemNotFoundError} If item not found in session
   */
  deleteItem(sessionId: string, itemId: string): Promise<boolean>;
} 