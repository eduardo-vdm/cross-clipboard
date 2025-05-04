import { useMockService } from './mockService';

// Use mock service if VITE_USE_MOCK_API is true or if VITE_API_URL is not set
const shouldUseMock = () => {
  return import.meta.env.VITE_USE_MOCK_API === 'true' || !import.meta.env.VITE_API_URL;
};

export const getServiceConfig = () => {
  const mockConfig = useMockService(shouldUseMock());
  if (mockConfig) {
    return mockConfig;
  }

  return {
    apiUrl: import.meta.env.VITE_API_URL,
    service: null, // null means use real API
  };
}; 