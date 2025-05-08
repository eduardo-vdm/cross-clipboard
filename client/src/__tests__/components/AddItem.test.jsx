// Create a dummy implementation of the SessionContext to bypass the require issue
vi.mock('../../contexts/SessionContext', () => {
  const useSessionMock = vi.fn().mockReturnValue({
    addItem: vi.fn().mockResolvedValue({})
  });
  
  return {
    useSession: useSessionMock
  };
});

// Mock i18n
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key) => {
      const translations = {
        'addItem.pastePrompt': 'Paste content here',
        'addItem.supportedTypes': 'Supported: Text and Images'
      };
      return translations[key] || key;
    }
  })
}));

// Mock Blob.prototype.text
class MockBlob extends Blob {
  constructor(parts, options) {
    super(parts, options);
    this._text = parts.join('');
  }

  text() {
    return Promise.resolve(this._text);
  }
}

// Mock clipboard API globally
beforeAll(() => {
  global.Blob = MockBlob;
  
  // Use defineProperty to mock the clipboard API
  Object.defineProperty(navigator, 'clipboard', {
    value: {
      read: vi.fn()
    },
    configurable: true
  });
});

import { describe, it, expect, vi, beforeEach, beforeAll } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { AddItem } from '../../components/AddItem';
import { useSession } from '../../contexts/SessionContext';

describe('AddItem', () => {
  let addItemMock;

  beforeEach(() => {
    addItemMock = vi.fn().mockResolvedValue({});
    // Update the mock directly through the imported function
    useSession.mockReturnValue({ addItem: addItemMock });
    
    // Reset mocks
    vi.clearAllMocks();
  });

  it('should render correctly', () => {
    render(<AddItem />);
    
    expect(screen.getByText('Paste content here')).toBeInTheDocument();
    expect(screen.getByText('Supported: Text and Images')).toBeInTheDocument();
  });

  it('should handle text paste correctly', async () => {
    // Mock clipboard data
    const textData = 'Test clipboard text';
    const mockTextBlob = new MockBlob([textData], { type: 'text/plain' });
    
    navigator.clipboard.read.mockResolvedValueOnce([{
      types: ['text/plain'],
      getType: vi.fn().mockResolvedValue(mockTextBlob)
    }]);
    
    render(<AddItem />);
    
    // Simulate paste event
    const pasteContainer = screen.getByText('Paste content here').parentElement;
    fireEvent.paste(pasteContainer);
    
    // Wait for async operations
    await vi.waitFor(() => {
      expect(navigator.clipboard.read).toHaveBeenCalled();
    });
    
    // Check if addItem was called with the right parameters
    await vi.waitFor(() => {
      expect(addItemMock).toHaveBeenCalledWith(textData, 'text');
    });
  });

  it('should handle image paste correctly', async () => {
    // Setup for image data
    const imageBlob = new MockBlob(['fake-image-data'], { type: 'image/png' });
    
    navigator.clipboard.read.mockResolvedValueOnce([{
      types: ['image/png'],
      getType: vi.fn().mockResolvedValue(imageBlob)
    }]);
    
    // Mock FileReader
    const dataUrl = 'data:image/png;base64,ZmFrZS1pbWFnZS1kYXRh';
    global.FileReader = class {
      constructor() {
        this.readAsDataURL = vi.fn().mockImplementation((blob) => {
          // Simulate async file reading
          setTimeout(() => {
            this.result = dataUrl;
            this.onload({ target: { result: dataUrl } });
          }, 0);
        });
      }
    };
    
    render(<AddItem />);
    
    // Simulate paste event
    const pasteContainer = screen.getByText('Paste content here').parentElement;
    fireEvent.paste(pasteContainer);
    
    // Wait for async operations
    await vi.waitFor(() => {
      expect(navigator.clipboard.read).toHaveBeenCalled();
    });
    
    // Check if addItem was called with the right parameters
    await vi.waitFor(() => {
      expect(addItemMock).toHaveBeenCalledWith(dataUrl, 'image');
    });
  });

  it('should handle empty text paste', async () => {
    // Mock clipboard data with empty text
    const emptyText = '   ';
    const mockEmptyBlob = new MockBlob([emptyText], { type: 'text/plain' });
    
    navigator.clipboard.read.mockResolvedValueOnce([{
      types: ['text/plain'],
      getType: vi.fn().mockResolvedValue(mockEmptyBlob)
    }]);
    
    render(<AddItem />);
    
    // Simulate paste event
    const pasteContainer = screen.getByText('Paste content here').parentElement;
    fireEvent.paste(pasteContainer);
    
    // Wait for async operations
    await vi.waitFor(() => {
      expect(navigator.clipboard.read).toHaveBeenCalled();
    });
    
    // Check if addItem was not called for empty text
    await vi.waitFor(() => {
      expect(addItemMock).not.toHaveBeenCalled();
    });
  });
}); 