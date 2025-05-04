export const mockItems = [
  {
    id: '1',
    type: 'text',
    content: 'This is a sample text item that was copied from somewhere.',
    deviceId: 'device1',
    createdAt: new Date(Date.now() - 3600000).toISOString(), // 1 hour ago
  },
  {
    id: '2',
    type: 'text',
    content: 'Another text item with different content to test multiple items.',
    deviceId: 'device2',
    createdAt: new Date(Date.now() - 7200000).toISOString(), // 2 hours ago
  },
  {
    id: '3',
    type: 'image',
    content: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==', // 1x1 transparent PNG
    deviceId: 'device1',
    createdAt: new Date(Date.now() - 1800000).toISOString(), // 30 mins ago
  },
]; 