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
MONGO_URI=mongodb://crossclip_app:clip123secure@localhost:27017/crossclip_app?authSource=cross_clipboard
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