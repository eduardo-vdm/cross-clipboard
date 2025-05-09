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

export class ItemError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ItemError';
  }
}

export class ItemNotFoundError extends ItemError {
  constructor(itemId: string, sessionId: string) {
    super(`Item not found with id: ${itemId} in session: ${sessionId}`);
    this.name = 'ItemNotFoundError';
  }
}

export class VersionConflictError extends ItemError {
  serverVersion: number;
  serverContent: string;

  constructor(itemId: string, clientVersion: number, serverVersion: number, serverContent: string) {
    super(`Version conflict for item ${itemId}: client version ${clientVersion}, server version ${serverVersion}`);
    this.name = 'VersionConflictError';
    this.serverVersion = serverVersion;
    this.serverContent = serverContent;
  }
}

export class DatabaseError extends Error {
  details: string;
  
  constructor(message: string, details: string) {
    super(message);
    this.name = 'DatabaseError';
    this.details = details;
  }
} 