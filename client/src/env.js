/**
 * Environment variable configuration
 * 
 * To add a new environment variable:
 * 1. Add it to your .env file with VITE_ prefix
 * 2. Add it to the REQUIRED_ENV_VARS or OPTIONAL_ENV_VARS list below
 * 3. Add a getter with JSDoc type annotation
 * 4. Import and use it from this module
 */

// List of required environment variables (will throw if missing)
const REQUIRED_ENV_VARS = [
  'VITE_USE_MOCK_API',
  'VITE_API_URL'
];

// List of optional environment variables with defaults
const OPTIONAL_ENV_VARS = [
  // { name: 'VITE_USE_MOCK_API', default: 'true' },
  // { name: 'VITE_API_URL', default: '' }
];

// Validate that all required environment variables are defined
REQUIRED_ENV_VARS.forEach(name => {
  if (!import.meta.env[name]) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
});

/**
 * Determines if the app should use the mock API or the real API
 * @type {boolean}
 */
export const USE_MOCK_API = getEnvValue('VITE_USE_MOCK_API', 'true') === 'true';

/**
 * The base URL for the API
 * @type {string}
 */
export const API_URL = getEnvValue('VITE_API_URL', '');

/**
 * Get an environment variable value with a fallback
 * @param {string} name - Environment variable name
 * @param {string} defaultValue - Default value if env var is not set
 * @returns {string} The environment variable value or default
 */
function getEnvValue(name, defaultValue) {
  const value = import.meta.env[name];
  return value !== undefined ? value : defaultValue;
}

/**
 * Get a string representation of the environment configuration
 * @returns {string} Environment configuration as a formatted string
 */
export function getEnvironmentInfo() {
  const lines = ['Environment Configuration:'];
  lines.push(`API: ${USE_MOCK_API ? 'Mock' : 'Real'}`);
  if (!USE_MOCK_API) {
    lines.push(`API URL: ${API_URL}`);
  }
  return lines.join('\n');
}

/**
 * Log the current environment configuration
 * Call this during app initialization to verify configuration
 */
export function logEnvironment() {
  console.log(getEnvironmentInfo());
} 