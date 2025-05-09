export class SessionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'SessionError';
  }
}

export class SessionNotFoundError extends SessionError {
  constructor(identifier: string, type: 'id' | 'code') {
    super(`Session not found with ${type}: ${identifier}`);
    this.name = 'SessionNotFoundError';
  }
}

export class SessionCodeGenerationError extends SessionError {
  constructor(attempts: number) {
    super(`Failed to generate unique session code after ${attempts} attempts`);
    this.name = 'SessionCodeGenerationError';
  }
}

export class SessionArchivedException extends SessionError {
  constructor(identifier: string, type: 'id' | 'code') {
    super(`Session with ${type}: ${identifier} has been archived`);
    this.name = 'SessionArchivedException';
  }
}

export class ItemNotFoundError extends Error {
  constructor(itemId: string, sessionId: string) {
    super(`Item ${itemId} not found in session ${sessionId}`);
    this.name = 'ItemNotFoundError';
  }
}

export class VersionConflictError extends Error {
  serverVersion: number;
  serverContent?: string;

  constructor(
    itemId: string, 
    expectedVersion: number, 
    actualVersion: number,
    serverContent?: string
  ) {
    super(`Version conflict for item ${itemId}: expected ${expectedVersion}, but got ${actualVersion}`);
    this.name = 'VersionConflictError';
    this.serverVersion = actualVersion;
    this.serverContent = serverContent;
  }
}

export class DatabaseError extends Error {
  constructor(operation: string, details?: string) {
    const message = details 
      ? `Database error during ${operation}: ${details}`
      : `Database error during ${operation}`;
    super(message);
    this.name = 'DatabaseError';
  }
} 