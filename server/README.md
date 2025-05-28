# Cross-Clipboard Server

Backend server for the Cross-Clipboard application, providing API endpoints for session management and clipboard item synchronization. Built with TypeScript and Node.js, this server demonstrates practical implementation of modern backend development practices while maintaining flexibility for future enhancements.

## Overview

The Cross-Clipboard server provides a robust backend for real-time clipboard synchronization across devices. It implements a token-based authentication system that balances anonymity with security, while maintaining the ability to track and control usage patterns. The server is designed with scalability and maintainability in mind, using TypeScript for type safety and a flexible data service architecture.

## Features

- Token-based authentication with request fingerprinting
- CORS middleware for secure cross-origin requests
- Rate limiting preparation for abuse prevention
- MongoDB integration with TTL for automatic cleanup
- Mock service for rapid development and testing
- Comprehensive logging system with multiple verbosity levels
- Optimistic concurrency control for data consistency

## Technology Stack

- **Runtime**: Node.js v18.20.x
- **Language**: TypeScript 5
- **Framework**: Express.js v4.17.x
- **Database**: MongoDB v8.x (Atlas)
- **ODM**: Mongoose v8.x
- **Testing**: Jest v29.x

## Development

### Technical Decisions

This project uses TypeScript to demonstrate the benefits of static typing in a backend environment, while the frontend uses vanilla JavaScript. This deliberate choice showcases the ability to work with different technology stacks and adapt to varying code environments.

#### Data Service Architecture

The server implements a flexible data service architecture through TypeScript interfaces:
- Common interface for both mock and MongoDB implementations
- Mock service using local JSON files for rapid prototyping
- MongoDB service for production use
- Seamless switching between implementations
- Type-safe data handling across services

### Security

#### Token-Based Authentication

The server implements a unique token-based authentication system that:
- Generates tokens based on request fingerprints (IP, browser, OS, user agent)
- Maintains session consistency without requiring user authentication
- Enables usage tracking and abuse prevention
- Prepares for future user authentication implementation
- Returns tokens in response headers for client-side management

#### CORS and Rate Limiting

- Custom CORS middleware for secure cross-origin requests
- Rate limiting preparation for abuse prevention
- Extensible security measures for future enhancements

### Performance

#### Current Implementation
- Polling-based data synchronization
- Automatic token generation on first access
- Token persistence for session consistency
- Header-based token transmission
- Usage monitoring capabilities
- Anonymous but traceable user identification

#### Planned Improvements
- WebSocket implementation for real-time updates
- Reduced server load through connection-based updates
- Improved real-time performance

#### MongoDB Integration

- TTL indexes for automatic data cleanup
- Optimistic concurrency control
- Flexible schema design
- Performance optimizations to be implemented based on usage patterns

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

1. Copy the example environment file:
```bash
cp .env.example .env
```

2. Update the variables in `.env` as needed:

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

## Testing

> **Note**: While the project includes a comprehensive test suite with approximately 70% coverage, tests became partially obsolete during the second half of development. A complete test suite update is planned for the next development phase.

### Running Tests

```bash
# Run all tests
npm test

# Run tests with mock data service
npm run test:mock

# Run tests with MongoDB service
npm run test:mongo
```

## Known Limitations

- Current polling mechanism for data synchronization
- Rate limiting not yet implemented
- Error handling needs enhancement
- Test coverage needs updating
- MongoDB optimizations pending usage patterns
- TTL parameters to be adjusted based on production usage

## Future Plans

- Implement WebSocket support for real-time updates
- Implement rate limiting
- Enhance error handling
- Update test coverage
- Optimize MongoDB performance based on usage patterns
- Adjust TTL parameters
- Implement user authentication system
- Enhance logging system

## Contributing

This project is currently maintained as a portfolio piece and learning exercise. While not actively seeking contributions at this time, the project remains open to collaboration for interested developers. Please reach out if you'd like to contribute. 