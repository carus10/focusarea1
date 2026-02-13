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

declare global {
  interface Window {
    electronAPI?: ElectronAPI;
  }
}

export {};
