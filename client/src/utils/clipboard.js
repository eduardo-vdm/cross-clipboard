export const copyToClipboard = async (text) => {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (err) {
    console.error('Failed to copy:', err);
    return false;
  }
};

export const readFromClipboard = async () => {
  try {
    const text = await navigator.clipboard.readText();
    return { success: true, content: text };
  } catch (err) {
    console.error('Failed to read clipboard:', err);
    return { success: false, error: err.message };
  }
};

export const readImageFromClipboard = async () => {
  try {
    const items = await navigator.clipboard.read();
    for (const item of items) {
      if (item.types.includes('image/png') || 
          item.types.includes('image/jpeg') || 
          item.types.includes('image/gif')) {
        const blob = await item.getType(item.types.find(type => type.startsWith('image/')));
        return { success: true, content: blob };
      }
    }
    return { success: false, error: 'No image found in clipboard' };
  } catch (err) {
    console.error('Failed to read image from clipboard:', err);
    return { success: false, error: err.message };
  }
}; 