import React from 'react';
import { render } from '@testing-library/react';
import { SessionProvider } from '../contexts/SessionContext';
import { I18nextProvider } from 'react-i18next';
import i18n from '../i18n/config';

// Custom renderer that includes providers
export function renderWithProviders(
  ui,
  {
    ...renderOptions
  } = {}
) {
  function Wrapper({ children }) {
    return (
      <I18nextProvider i18n={i18n}>
        <SessionProvider>
          {children}
        </SessionProvider>
      </I18nextProvider>
    );
  }
  
  return { ...render(ui, { wrapper: Wrapper, ...renderOptions }) };
}

// Mock service for testing
export const createMockService = (overrides = {}) => {
  const defaultMockService = {
    createSession: vi.fn().mockResolvedValue({ code: '123456' }),
    joinSession: vi.fn().mockResolvedValue({ items: [] }),
    getItems: vi.fn().mockResolvedValue([]),
    addItem: vi.fn().mockImplementation((code, content, type, deviceId) => 
      Promise.resolve({
        id: 'test-id',
        content,
        type,
        deviceId,
        createdAt: new Date().toISOString(),
        version: 1,
      })
    ),
    editItem: vi.fn().mockImplementation((code, itemId, content, deviceId) => 
      Promise.resolve({
        id: itemId,
        content,
        deviceId,
        updatedAt: new Date().toISOString(),
        version: 2,
      })
    ),
    deleteItem: vi.fn().mockResolvedValue(true),
  };

  return {
    ...defaultMockService,
    ...overrides,
  };
};

// Mock fetch for API testing
export const mockFetch = (responseData, options = {}) => {
  const { status = 200, statusText = 'OK', headers = {} } = options;
  
  global.fetch = vi.fn().mockImplementation(() =>
    Promise.resolve({
      status,
      statusText,
      headers: new Headers(headers),
      ok: status >= 200 && status < 300,
      json: () => Promise.resolve(responseData),
      text: () => Promise.resolve(JSON.stringify(responseData)),
    })
  );
  
  return global.fetch;
}; 