# Cross-Clipboard Server

Backend server for the Cross-Clipboard application, providing API endpoints for session management and clipboard item synchronization.

## Development

### Installing Dependencies

```bash
npm install
```

### Running in Development Mode

```bash
npm run dev
```

### Building for Production

```bash
npm run build
npm start
```

### Running Tests

```bash
# Run all tests
npm test

# Run tests with mock data service
npm run test:mock

# Run tests with MongoDB service
npm run test:mongo
```

## Architecture

The server follows a dependency injection pattern that allows for swappable data service implementations:

- `MockDataService`: Uses in-memory data structures with JSON file persistence for development
- `MongoDataService`: Uses MongoDB for data storage in production environments

## MongoDB Schema

When using MongoDB, the following data schema is implemented:

- **Session**: Main document storing session data with an embedded array of clipboard items
  - `id`: Unique session identifier
  - `code`: 6-digit unique code for session access
  - `items`: Array of clipboard items
  - `version`: Document version for optimistic concurrency control
  - `createdAt`: Timestamp of creation
  - `lastModified`: Last update timestamp
  - `isArchived`: Flag for soft deletion

Sessions have TTL indexes set to expire after 7 days by default, and use the `isArchived` flag for soft deletion.

## Environment Variables

Create a `.env` file in the server directory with the following variables:

### Server Configuration

```
# Server configuration
PORT=3001
NODE_ENV=development  # development, test, or production

# Service mode (which data service to use)
SERVICE_MODE=mock  # mock or mongo

# For test environment only
TEST_MODE=mock  # mock or mongo

# MongoDB connection (only used when SERVICE_MODE=mongo)
# Note: Both variable names are supported for backward compatibility
MONGO_URI=mongodb://crossclip_app:*****@localhost:27017/cross_clipboard?authSource=cross_clipboard
MONGODB_URI=mongodb://crossclip_app:*****@localhost:27017/cross_clipboard?authSource=cross_clipboard
```

### Logging Configuration

```
# Logging configuration
ENABLE_REQUEST_LOGGING=true  # true or false, defaults to true
LOG_LEVEL=NORMAL  # NONE, BASIC, NORMAL, or VERBOSE
```

Log levels:
- `NONE`: No request logging
- `BASIC`: Log only method and URL for each request
- `NORMAL`: Log method, URL, status code, and response time
- `VERBOSE`: Log everything including request and response bodies

### MongoDB Logging

The MongoDB connection uses the same log level as the request logger:

- `NONE`: No MongoDB connection logs
- `BASIC`: Basic connection status (connected, disconnected)
- `NORMAL`: Connection status with database details
- `VERBOSE`: Full debug mode with query logging

When using the `VERBOSE` log level, all MongoDB queries will be logged to the console, which is helpful for debugging but can be very verbose. 