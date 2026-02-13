/// <reference types="vite/client" />

export async function getEnvVariable(key: string): Promise<string> {
  // Electron ortamında
  if (window.electronAPI) {
    try {
      const envVars = await window.electronAPI.getEnvVariables();
      return envVars[key] || '';
    } catch (error) {
      console.error(`Failed to get env variable ${key}:`, error);
      return '';
    }
  }
  
  // Web ortamında (fallback)
  if (typeof import.meta !== 'undefined' && import.meta.env) {
    return (import.meta.env as any)[key] || '';
  }
  
  return '';
}
