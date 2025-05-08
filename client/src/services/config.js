import { useMockService } from './mockService';
import { apiService } from './apiService';
import { USE_MOCK_API, API_URL } from '../env';

export const getServiceConfig = () => {
  // Check if we should use the mock service
  if (USE_MOCK_API) {
    return useMockService(true);
  }

  // Otherwise use the real API service
  return {
    apiUrl: API_URL,
    service: apiService,
  };
}; 