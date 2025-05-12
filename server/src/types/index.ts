import { ISession, IClipboardItem } from '../db/schemas';

export type ItemType = 'text' | 'image';

export type ClipboardItem = Omit<IClipboardItem, 'isArchived'> & {
  deviceName: string;
};
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
  /**
   * Creates a new session with a unique code
   * @throws {SessionCodeGenerationError} If unable to generate a unique code
   * @throws {DatabaseError} If there is an error accessing the database
   */
  createSession(): Promise<Session>;

  /**
   * Gets a session by ID (backward compatibility method)
   * @returns null if session not found or archived
   * @throws {DatabaseError} If there is an error accessing the database
   */
  getSession(id: string): Promise<Session | null>;

  /**
   * Gets a session by its UUID
   * @throws {SessionNotFoundError} If session not found
   * @throws {SessionArchivedException} If session is archived
   * @throws {DatabaseError} If there is an error accessing the database
   */
  getSessionById(id: string): Promise<Session>;

  /**
   * Gets a session by its 6-digit code
   * @throws {SessionNotFoundError} If session not found
   * @throws {SessionArchivedException} If session is archived
   * @throws {DatabaseError} If there is an error accessing the database
   */
  getSessionByCode(code: string): Promise<Session>;

  /**
   * Marks a session as archived
   * @throws {SessionNotFoundError} If session not found
   * @throws {SessionArchivedException} If session is already archived
   * @throws {DatabaseError} If there is an error accessing the database
   */
  deleteSession(id: string): Promise<boolean>;

  /**
   * Adds a new item to a session
   * @param {string} sessionId - The session ID
   * @param {ItemType} type - The type of item (text or image)
   * @param {string} content - The content of the item
   * @param {string} deviceId - The device ID that is adding the item
   * @param {string} deviceName - The name of the device that is adding the item
   * @throws {SessionNotFoundError} If session not found
   * @throws {SessionArchivedException} If session is archived
   * @throws {DatabaseError} If there is an error accessing the database
   */
  addItem(sessionId: string, type: ItemType, content: string, deviceId: string, deviceName: string): Promise<ClipboardItem>;

  /**
   * Updates an existing item in a session
   * @param {string} sessionId - The session ID
   * @param {string} itemId - The item ID
   * @param {string} content - The new content
   * @param {number} version - The version of the item
   * @param {string} deviceId - The device ID that is updating the item
   * @throws {SessionNotFoundError} If session not found
   * @throws {SessionArchivedException} If session is archived
   * @throws {ItemNotFoundError} If item not found in session
   * @throws {VersionConflictError} If item version doesn't match
   * @throws {DatabaseError} If there is an error accessing the database
   */
  updateItem(sessionId: string, itemId: string, content: string, version: number, deviceId: string): Promise<UpdateItemResponse>;

  /**
   * Deletes an item from a session
   * @param {string} sessionId - The session ID
   * @param {string} itemId - The item ID
   * @param {string} deviceId - The device ID that is deleting the item
   * @throws {SessionNotFoundError} If session not found
   * @throws {SessionArchivedException} If session is archived
   * @throws {ItemNotFoundError} If item not found in session
   * @throws {DatabaseError} If there is an error accessing the database
   */
  deleteItem(sessionId: string, itemId: string, deviceId: string): Promise<boolean>;
} 