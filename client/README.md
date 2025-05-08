# Cross-Clipboard Client

The client application for the Cross-Clipboard project, allowing users to share clipboard items across devices using session codes.

## Development

### Installing dependencies

```bash
npm install
```

### Running the app in development mode

```bash
npm run dev
```

When the application starts, the environment configuration will be logged both in the terminal and in the browser console for debugging purposes.

### Building for production

```bash
npm run build
```

### Environment Configuration

The application uses environment variables for configuration. These are managed through the `src/env.js` module, which provides type-safe access to the environment variables.

#### Available Environment Variables

##### Custom Environment Variables
- `VITE_USE_MOCK_API`: Set to `true` to use mock API, `false` to use real API (default: `true`)
- `VITE_API_URL`: Base URL for the API when using the real API service (default: empty string)

##### Built-in Vite Environment Variables
The application also uses some built-in Vite environment variables:
- `import.meta.env.DEV`: Boolean flag indicating if the app is running in development mode (automatically set by Vite)
- `import.meta.env.PROD`: Boolean flag indicating if the app is running in production mode (automatically set by Vite)
- `import.meta.env.MODE`: The current mode (development, production, etc.) the app is running in (automatically set by Vite)

#### Setting Environment Variables

To set environment variables for local development:

1. Create a `.env.local` file in the client directory with the desired configuration:

```
# Custom environment variables you need to set
# ============================================

# To use mock API (default behavior)
VITE_USE_MOCK_API=true

# To use real API
# VITE_USE_MOCK_API=false
# VITE_API_URL=http://localhost:5000

# Note: Built-in variables like DEV, PROD, and MODE are automatically 
# set by Vite and don't need to be defined in this file.
```

2. Restart the development server

```bash
npm run dev
```

#### Using the Real API

To use the real API, set the environment variables as shown above and make sure the backend server is running on the specified port.

```bash
npm run dev
```

## Features

- Share clipboard items (text and images) across devices
- Automatic conflict detection and resolution
- Easy-to-use interface
- Internationalization support (English and Portuguese currently available)
