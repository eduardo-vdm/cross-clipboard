// Mock dependencies first to avoid hoisting issues
vi.mock('react-hot-toast', () => ({
  default: {
    success: vi.fn(),
    error: vi.fn()
  }
}));

// Mock the service config module
vi.mock('../../services/config', () => ({
  getServiceConfig: vi.fn().mockImplementation(() => {
    // Return a default mock service config
    return {
      apiUrl: 'mock://api',
      service: mockService
    };
  })
}));

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SessionProvider, useSession } from '../../contexts/SessionContext';
import { createMockService } from '../../utils/test-utils.jsx';

// Create a mock service for testing
const mockService = {
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

// Simple test component that uses the session context
const TestComponent = () => {
  const { sessionCode, items, loading, error, addItem, deleteItem, editItem } = useSession();
  
  return (
    <div>
      <div data-testid="session-code">{sessionCode || 'No session'}</div>
      <div data-testid="items-count">{items.length}</div>
      <div data-testid="loading-state">{loading ? 'Loading' : 'Not loading'}</div>
      <div data-testid="error-state">{error || 'No error'}</div>
      
      <button 
        data-testid="add-item-btn" 
        onClick={() => addItem('Test content', 'text')}
      >
        Add Item
      </button>
      
      {items.map(item => (
        <div key={item.id} data-testid={`item-${item.id}`}>
          {item.content}
          <button 
            data-testid={`edit-btn-${item.id}`}
            onClick={() => editItem(item.id, 'Edited content', item.version)}
          >
            Edit
          </button>
          <button 
            data-testid={`delete-btn-${item.id}`}
            onClick={() => deleteItem(item.id)}
          >
            Delete
          </button>
        </div>
      ))}
    </div>
  );
};

describe('SessionContext', () => {
  beforeEach(() => {
    // Reset all mocks before each test
    vi.clearAllMocks();
    
    // Mock window.history
    window.history.replaceState = vi.fn();
    
    // Clear localStorage
    localStorage.clear();
  });
  
  afterEach(() => {
    vi.clearAllMocks();
    vi.useRealTimers(); // Make sure we reset to real timers
  });
  
  it('should initialize and create a new session', async () => {
    render(
      <SessionProvider>
        <TestComponent />
      </SessionProvider>
    );
    
    // Should initially show loading state
    expect(screen.getByTestId('loading-state').textContent).toBe('Loading');
    
    // Wait for session to be created
    await waitFor(() => {
      expect(mockService.createSession).toHaveBeenCalled();
      expect(screen.getByTestId('session-code').textContent).toBe('123456');
      expect(screen.getByTestId('loading-state').textContent).toBe('Not loading');
    });
  });
  
  it('should allow adding items to the session', async () => {
    const user = userEvent.setup();
    
    render(
      <SessionProvider>
        <TestComponent />
      </SessionProvider>
    );
    
    // Wait for session to be created
    await waitFor(() => {
      expect(screen.getByTestId('session-code').textContent).toBe('123456');
    });
    
    // Click add item button
    await user.click(screen.getByTestId('add-item-btn'));
    
    // Verify item was added
    await waitFor(() => {
      expect(mockService.addItem).toHaveBeenCalledWith('123456', 'Test content', 'text', expect.any(String));
      expect(screen.getByTestId('items-count').textContent).toBe('1');
    });
  });
  
  it('should handle service errors gracefully', async () => {
    // Mock error for createSession
    mockService.createSession.mockRejectedValueOnce(new Error('Failed to create session'));
    
    render(
      <SessionProvider>
        <TestComponent />
      </SessionProvider>
    );
    
    // Wait for error to be displayed
    await waitFor(() => {
      expect(screen.getByTestId('error-state').textContent).toBe('Failed to create session');
      expect(screen.getByTestId('loading-state').textContent).toBe('Not loading');
    });
  });
  
  it('should poll for updates', async () => {
    // Use fake timers but with a specific configuration
    vi.useFakeTimers({ shouldAdvanceTime: true });
    
    // Render the component
    render(
      <SessionProvider>
        <TestComponent />
      </SessionProvider>
    );
    
    // Wait for initial session creation
    await waitFor(() => {
      expect(screen.getByTestId('session-code').textContent).toBe('123456');
    });
    
    // Reset the mock counter to clearly see polling calls
    mockService.getItems.mockClear();
    
    // Advance time by a smaller amount first to ensure we're not in any initial setup
    await act(async () => {
      vi.advanceTimersByTime(100);
    });
    
    // Now advance time to trigger polling and wait for the effect
    await act(async () => {
      vi.advanceTimersByTime(5000); // Advance by polling interval
      // Let any immediate promises resolve
      await Promise.resolve();
    });
    
    // Verify that getItems was called for polling
    expect(mockService.getItems).toHaveBeenCalledWith('123456');
  }, 10000); // Increase test timeout
}); 