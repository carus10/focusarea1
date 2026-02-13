import { app, BrowserWindow, shell, ipcMain, Notification, session } from 'electron';
import * as path from 'path';
import { fileURLToPath } from 'url';
import Store from 'electron-store';
import * as fs from 'fs';
import { ErrorHandler } from './errorHandler.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface WindowState {
  width: number;
  height: number;
  x?: number;
  y?: number;
  isMaximized: boolean;
}

const store = new Store<{ windowState: WindowState }>();
const errorHandler = new ErrorHandler();
let mainWindow: BrowserWindow | null = null;

function loadEnvironmentVariables(): Record<string, string> {
  const envVars: Record<string, string> = {};

  // Development: Load from .env.local
  if (process.env.NODE_ENV === 'development') {
    try {
      const envPath = path.join(__dirname, '../.env.local');
      if (fs.existsSync(envPath)) {
        const envContent = fs.readFileSync(envPath, 'utf8');
        envContent.split('\n').forEach(line => {
          const trimmed = line.trim();
          if (trimmed && !trimmed.startsWith('#')) {
            const [key, ...valueParts] = trimmed.split('=');
            if (key && valueParts.length > 0) {
              envVars[key.trim()] = valueParts.join('=').trim();
            }
          }
        });
      }
    } catch (error) {
      console.error('Failed to load .env.local:', error);
    }
  }

  // Production: Load from electron-store
  if (process.env.NODE_ENV === 'production') {
    const storedEnv = store.get('envVariables' as any, {}) as Record<string, string>;
    Object.assign(envVars, storedEnv);
  }

  // Fallback to process.env
  if (process.env.GEMINI_API_KEY) {
    envVars.GEMINI_API_KEY = process.env.GEMINI_API_KEY;
  }

  return envVars;
}

function loadWindowState(): WindowState {
  return store.get('windowState', {
    width: 1200,
    height: 800,
    isMaximized: false
  });
}

function saveWindowState(): void {
  if (!mainWindow || mainWindow.isDestroyed()) return;

  try {
    const bounds = mainWindow.getBounds();
    const windowState: WindowState = {
      width: bounds.width,
      height: bounds.height,
      x: bounds.x,
      y: bounds.y,
      isMaximized: mainWindow.isMaximized()
    };

    store.set('windowState', windowState);
  } catch (error) {
    console.error('Failed to save window state:', error);
  }
}

function createWindow(): void {
  const windowState = loadWindowState();
  const minWidth = 800;
  const minHeight = 600;

  mainWindow = new BrowserWindow({
    width: windowState.width,
    height: windowState.height,
    x: windowState.x,
    y: windowState.y,
    minWidth: minWidth,
    minHeight: minHeight,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
      webviewTag: false
    },
    title: 'Full-Focus Dashboard'
  });

  // Fix YouTube Error 153 & Spotify embed restrictions in Electron
  // YouTube rejects embeds from file:// origins, so we spoof the origin header
  mainWindow.webContents.session.webRequest.onBeforeSendHeaders((details, callback) => {
    const { requestHeaders, url } = details;
    if (url.includes('youtube.com') || url.includes('googlevideo.com') || url.includes('ytimg.com')) {
      requestHeaders['Origin'] = 'https://www.youtube.com';
      requestHeaders['Referer'] = 'https://www.youtube.com/';
    }
    if (url.includes('spotify.com') || url.includes('scdn.co')) {
      requestHeaders['Origin'] = 'https://open.spotify.com';
      requestHeaders['Referer'] = 'https://open.spotify.com/';
    }
    callback({ requestHeaders });
  });

  // Remove CSP and X-Frame-Options headers that block iframe embeds
  mainWindow.webContents.session.webRequest.onHeadersReceived((details, callback) => {
    const responseHeaders = { ...details.responseHeaders };
    delete responseHeaders['content-security-policy'];
    delete responseHeaders['Content-Security-Policy'];
    delete responseHeaders['x-frame-options'];
    delete responseHeaders['X-Frame-Options'];
    
    // Allow CORS for YouTube/Spotify resources
    if (details.url.includes('youtube.com') || details.url.includes('spotify.com') || details.url.includes('googlevideo.com') || details.url.includes('scdn.co')) {
      responseHeaders['Access-Control-Allow-Origin'] = ['*'] as any;
    }
    callback({ responseHeaders });
  });

  // Load the app
  if (process.env.NODE_ENV === 'development') {
    mainWindow.loadURL('http://localhost:5173');
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }

  // Restore maximized state
  if (windowState.isMaximized) {
    mainWindow.maximize();
  }

  // Save window state on resize, move, and maximize
  mainWindow.on('resize', saveWindowState);
  mainWindow.on('move', saveWindowState);
  mainWindow.on('maximize', saveWindowState);
  mainWindow.on('unmaximize', saveWindowState);

  // Handle external links - allow YouTube/Spotify embeds, open others externally
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('http://') || url.startsWith('https://')) {
      // Allow YouTube and Spotify embed popups (e.g. login flows)
      if (url.includes('accounts.google.com') || url.includes('accounts.spotify.com')) {
        return { action: 'allow' };
      }
      shell.openExternal(url);
      return { action: 'deny' };
    }
    return { action: 'allow' };
  });

  mainWindow.on('close', () => {
    saveWindowState();
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// App lifecycle events
app.whenReady().then(() => {
  // Setup IPC handlers
  ipcMain.handle('get-env-variables', async () => {
    try {
      return loadEnvironmentVariables();
    } catch (error) {
      console.error('Failed to load environment variables:', error);
      return {};
    }
  });

  ipcMain.handle('open-external', async (_event, url: string) => {
    try {
      await shell.openExternal(url);
    } catch (error) {
      console.error('Failed to open external URL:', error);
      throw error;
    }
  });

  ipcMain.handle('log-error', async (_event, errorData: any) => {
    errorHandler.logRendererError(errorData);
  });

  ipcMain.handle('show-notification', async (_event, options: { title: string; body: string; silent?: boolean; urgency?: string }) => {
    try {
      const notification = new Notification({
        title: options.title,
        body: options.body,
        silent: options.silent ?? false,
      });
      notification.show();
    } catch (error) {
      console.error('Failed to show notification:', error);
    }
  });

  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
