import { DataService } from './types';
import { MockDataService } from './services/mockDataService';
import { MongoDataService } from './services/mongoDataService';
import { LogLevel } from './middleware/requestLogger';

export type ServiceMode = 'mongo' | 'mock';
export type ServerMode = 'development' | 'production' | 'test';

interface ServerConfig {
  serviceMode: ServiceMode;
  serverMode: ServerMode;
  port: number;
  mongoUri: string;
  logging: {
    level: LogLevel;
    enabled: boolean;
  };
}

function getServiceMode(): ServiceMode {
  // In test environment, use TEST_MODE
  if (process.env.NODE_ENV === 'test') {
    const testMode = process.env.TEST_MODE?.toLowerCase();
    if (testMode === 'mock' || testMode === 'mongo') {
      return testMode;
    }
    return 'mock'; // Default to mock in test environment
  }

  // In normal environment, use SERVICE_MODE
  const mode = process.env.SERVICE_MODE?.toLowerCase();
  if (mode === 'mock' || mode === 'mongo') {
    return mode;
  }
  return 'mongo'; // Default to mongo in production
}

function getServerMode(): ServerMode {
  return process.env.NODE_ENV === 'development' ? 'development' : 
         process.env.NODE_ENV === 'test' ? 'test' : 'production';
}

function getLogLevel(): LogLevel {
  const level = process.env.LOG_LEVEL?.toUpperCase();
  
  switch(level) {
    case 'NONE': return LogLevel.NONE;
    case 'BASIC': return LogLevel.BASIC;
    case 'NORMAL': return LogLevel.NORMAL;
    case 'VERBOSE': return LogLevel.VERBOSE;
    default: 
      // Default log level based on environment
      const mode = getServerMode();
      return mode === 'development' ? LogLevel.NORMAL : 
             mode === 'test' ? LogLevel.NONE : LogLevel.BASIC;
  }
}

// Create a function to get the config instead of exporting a constant
let configInstance: ServerConfig | null = null;

export function getConfig(): ServerConfig {
  if (!configInstance) {
    const loggingEnabled = process.env.ENABLE_REQUEST_LOGGING !== 'false'; // Enabled by default
    
    configInstance = {
      serviceMode: getServiceMode(),
      serverMode: getServerMode(),
      port: parseInt(process.env.PORT || '3001', 10),
      mongoUri: process.env.MONGO_URI || 'mongodb://crossclip_app:clip123secure@localhost:27017/crossclip_app?authSource=cross_clipboard',
      logging: {
        level: getLogLevel(),
        enabled: loggingEnabled
      }
    };
  }
  return configInstance;
}

export function getDataService(): DataService {
  const config = getConfig();
  console.log(`Initializing data service in ${config.serviceMode} mode`);
  
  if (config.serviceMode === 'mock') {
    console.log('Using MockDataService');
    return new MockDataService();
  }
  
  console.log('Using MongoDataService');
  return new MongoDataService();
} 