import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import fs from 'fs'
import path from 'path'

// Try to load environment variables from .env.local file
function loadEnv() {
  try {
    const envPath = path.resolve(process.cwd(), '.env.local');
    if (fs.existsSync(envPath)) {
      console.log(`Found .env.local file at ${envPath}`);
      const envContent = fs.readFileSync(envPath, 'utf8');
      const envVars = {};
      
      envContent.split('\n').forEach(line => {
        const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
        if (match) {
          const key = match[1];
          let value = match[2] || '';
          if (value.length > 0 && value.charAt(0) === '"' && value.charAt(value.length - 1) === '"') {
            value = value.replace(/\\n/g, '\n');
            value = value.substring(1, value.length - 1);
          }
          envVars[key] = value;
        }
      });
      
      return envVars;
    } else {
      console.log('No .env.local file found');
      return {};
    }
  } catch (error) {
    console.error('Error loading .env.local file:', error);
    return {};
  }
}

// Custom plugin to log environment variables on startup
const logEnvPlugin = () => {
  return {
    name: 'log-env-plugin',
    configureServer(server) {
      server.httpServer?.once('listening', () => {
        // Load environment variables manually
        const envVars = loadEnv();
        
        // Use loaded env vars or fallback to defaults
        const useMockApi = (envVars.VITE_USE_MOCK_API !== 'false') && (process.env.VITE_USE_MOCK_API !== 'false');
        const apiUrl = envVars.VITE_API_URL || process.env.VITE_API_URL || '';
        
        // Log environment info in the terminal
        const divider = '='.repeat(40);
        console.log('\n' + divider);
        console.log('Environment Configuration:');
        console.log(`API: ${useMockApi ? 'Mock' : 'Real'}`);
        if (!useMockApi) {
          console.log(`API URL: ${apiUrl}`);
        }
        console.log(`Loaded from .env.local: ${Object.keys(envVars).length > 0 ? 'Yes' : 'No'}`);
        console.log(divider + '\n');
      });
    }
  };
};

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    logEnvPlugin()
  ],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/setupTests.js'],
    css: false,
  }
})
