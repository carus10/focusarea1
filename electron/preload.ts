import { contextBridge, ipcRenderer } from 'electron';

interface ElectronAPI {
  getEnvVariables: () => Promise<Record<string, string>>;
  openExternal: (url: string) => Promise<void>;
  logError: (error: any) => Promise<void>;
  showNotification: (options: { title: string; body: string; type: string; icon?: string; silent?: boolean; urgency?: string }) => Promise<void>;
  platform: string;
  versions: {
    node: string;
    chrome: string;
    electron: string;
  };
}

contextBridge.exposeInMainWorld('electronAPI', {
  getEnvVariables: () => ipcRenderer.invoke('get-env-variables'),
  openExternal: (url: string) => ipcRenderer.invoke('open-external', url),
  logError: (error: any) => ipcRenderer.invoke('log-error', error),
  showNotification: (options: { title: string; body: string; type: string; icon?: string; silent?: boolean; urgency?: string }) => ipcRenderer.invoke('show-notification', options),
  platform: process.platform,
  versions: {
    node: process.versions.node,
    chrome: process.versions.chrome,
    electron: process.versions.electron
  }
} as ElectronAPI);
