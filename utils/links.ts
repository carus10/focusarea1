export async function openExternalLink(url: string): Promise<void> {
  if (window.electronAPI) {
    try {
      await window.electronAPI.openExternal(url);
    } catch (error) {
      console.error('Failed to open external link:', error);
      // Fallback to window.open
      window.open(url, '_blank');
    }
  } else {
    window.open(url, '_blank');
  }
}
