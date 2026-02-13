# Design Document: Electron Desktop App

## Overview

Bu tasarım, mevcut React + TypeScript + Vite tabanlı Full-Focus Dashboard web uygulamasının Electron framework'ü kullanılarak Windows masaüstü uygulamasına dönüştürülmesini detaylandırır. Tasarım, minimal değişiklikle maksimum uyumluluk sağlamayı hedefler ve mevcut tüm özelliklerin korunmasını garanti eder.

Electron, Chromium ve Node.js kullanarak web teknolojileriyle masaüstü uygulamaları oluşturmayı sağlar. İki ana süreç vardır:
- **Main Process**: Node.js ortamında çalışır, pencere yönetimi ve sistem kaynaklarına erişim sağlar
- **Renderer Process**: Chromium'da çalışır, React uygulamasını render eder

## Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Electron App                          │
├─────────────────────────────────────────────────────────┤
│                                                           │
│  ┌─────────────────┐         ┌────────────────────┐    │
│  │  Main Process   │◄───IPC──►│ Renderer Process   │    │
│  │  (Node.js)      │         │ (Chromium)         │    │
│  │                 │         │                    │    │
│  │ - Window Mgmt   │         │ - React App        │    │
│  │ - File System   │         │ - UI Components    │    │
│  │ - Env Variables │         │ - State Management │    │
│  │ - Error Logging │         │ - User Interactions│    │
│  └─────────────────┘         └────────────────────┘    │
│         │                              │                 │
│         │                              │                 │
│         ▼                              ▼                 │
│  ┌─────────────────┐         ┌────────────────────┐    │
│  │  File System    │         │   localStorage      │    │
│  │  - Logs         │         │   - User Data       │    │
│  │  - Config       │         │   - Settings        │    │
│  └─────────────────┘         └────────────────────┘    │
│                                                           │
└─────────────────────────────────────────────────────────┘
```

### Project Structure

```
project-root/
├── electron/
│   ├── main.ts              # Main process entry point
│   ├── preload.ts           # Preload script for secure IPC
│   └── builder.config.json  # Electron Builder configuration
├── src/                     # Existing React app (unchanged)
│   ├── App.tsx
│   ├── components/
│   ├── pages/
│   ├── context/
│   └── hooks/
├── dist/                    # Vite build output
├── dist-electron/           # Electron build output
├── package.json             # Updated with Electron scripts
├── vite.config.ts           # Updated for Electron
└── tsconfig.json            # Updated for Electron
```

## Components and Interfaces

### 1. Main Process (electron/main.ts)

Main process, uygulamanın giriş noktasıdır ve pencere yönetiminden sorumludur.

**Sorumluluklar:**
- BrowserWindow oluşturma ve yönetme
- Uygulama yaşam döngüsü olaylarını yönetme
- Ortam değişkenlerini yükleme ve Renderer'a iletme
- Harici bağlantıları sistem tarayıcısında açma
- Hata loglama
- Pencere durumunu (boyut, pozisyon) kaydetme/yükleme

**Arayüz:**

```typescript
interface WindowState {
  width: number;
  height: number;
  x?: number;
  y?: number;
  isMaximized: boolean;
}

interface AppConfig {
  apiKey: string;
  windowState: WindowState;
}

class ElectronMain {
  private mainWindow: BrowserWindow | null;
  private windowState: WindowState;
  
  constructor();
  createWindow(): void;
  loadWindowState(): WindowState;
  saveWindowState(): void;
  setupIPC(): void;
  handleExternalLinks(): void;
  setupErrorLogging(): void;
}
```

**Temel İşlevler:**

1. **Window Creation:**
```typescript
function createWindow(): BrowserWindow {
  const windowState = loadWindowState();
  
  const window = new BrowserWindow({
    width: windowState.width || 1200,
    height: windowState.height || 800,
    minWidth: 800,
    minHeight: 600,
    x: windowState.x,
    y: windowState.y,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true
    },
    icon: path.join(__dirname, '../assets/icon.png')
  });
  
  if (windowState.isMaximized) {
    window.maximize();
  }
  
  return window;
}
```

2. **Environment Variables:**
```typescript
function loadEnvironmentVariables(): Record<string, string> {
  // Development: .env.local dosyasından yükle
  // Production: electron-store ile güvenli depolama
  return {
    GEMINI_API_KEY: process.env.GEMINI_API_KEY || ''
  };
}
```

3. **External Links:**
```typescript
function setupExternalLinks(window: BrowserWindow): void {
  window.webContents.setWindowOpenHandler(({ url }) => {
    // Harici URL'leri sistem tarayıcısında aç
    if (url.startsWith('http://') || url.startsWith('https://')) {
      shell.openExternal(url);
      return { action: 'deny' };
    }
    return { action: 'allow' };
  });
}
```

### 2. Preload Script (electron/preload.ts)

Preload script, Main ve Renderer süreçleri arasında güvenli bir köprü sağlar.

**Sorumluluklar:**
- Güvenli IPC kanalları oluşturma
- Ortam değişkenlerini Renderer'a expose etme
- Sistem bilgilerini sağlama

**Arayüz:**

```typescript
interface ElectronAPI {
  getEnvVariables: () => Promise<Record<string, string>>;
  openExternal: (url: string) => Promise<void>;
  platform: string;
  versions: {
    node: string;
    chrome: string;
    electron: string;
  };
}

declare global {
  interface Window {
    electronAPI: ElectronAPI;
  }
}
```

**İmplementasyon:**

```typescript
import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('electronAPI', {
  getEnvVariables: () => ipcRenderer.invoke('get-env-variables'),
  openExternal: (url: string) => ipcRenderer.invoke('open-external', url),
  platform: process.platform,
  versions: {
    node: process.versions.node,
    chrome: process.versions.chrome,
    electron: process.versions.electron
  }
});
```

### 3. React App Adaptasyonu

React uygulaması minimal değişiklikle Electron ortamında çalışacak şekilde adapte edilir.

**Değişiklikler:**

1. **Environment Variables Access:**

```typescript
// src/utils/env.ts (YENİ)
export async function getEnvVariable(key: string): Promise<string> {
  // Electron ortamında
  if (window.electronAPI) {
    const envVars = await window.electronAPI.getEnvVariables();
    return envVars[key] || '';
  }
  
  // Web ortamında (fallback)
  return (import.meta.env as any)[key] || '';
}
```

2. **External Links Handler:**

```typescript
// src/utils/links.ts (YENİ)
export async function openExternalLink(url: string): Promise<void> {
  if (window.electronAPI) {
    await window.electronAPI.openExternal(url);
  } else {
    window.open(url, '_blank');
  }
}
```

3. **Sidebar Component Update:**

Sidebar'daki harici bağlantılar için `openExternalLink` kullanımı:

```typescript
// components/Sidebar.tsx (GÜNCELLEME)
import { openExternalLink } from '../utils/links';

// ExternalLink tıklama handler'ı
const handleExternalLinkClick = async (url: string) => {
  await openExternalLink(url);
};
```

### 4. Build System Configuration

#### Vite Configuration (vite.config.ts)

```typescript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import electron from 'vite-plugin-electron';
import electronRenderer from 'vite-plugin-electron-renderer';

export default defineConfig({
  plugins: [
    react(),
    electron([
      {
        entry: 'electron/main.ts',
        vite: {
          build: {
            outDir: 'dist-electron',
            rollupOptions: {
              external: ['electron']
            }
          }
        }
      },
      {
        entry: 'electron/preload.ts',
        onstart(options) {
          options.reload();
        },
        vite: {
          build: {
            outDir: 'dist-electron'
          }
        }
      }
    ]),
    electronRenderer()
  ],
  base: './', // Relative paths for Electron
  build: {
    outDir: 'dist',
    emptyOutDir: true
  }
});
```

#### Electron Builder Configuration (electron/builder.config.json)

```json
{
  "appId": "com.fullfocus.dashboard",
  "productName": "Full-Focus Dashboard",
  "directories": {
    "output": "release",
    "buildResources": "assets"
  },
  "files": [
    "dist/**/*",
    "dist-electron/**/*",
    "package.json"
  ],
  "win": {
    "target": ["nsis"],
    "icon": "assets/icon.ico",
    "artifactName": "${productName}-${version}-Setup.${ext}"
  },
  "nsis": {
    "oneClick": false,
    "allowToChangeInstallationDirectory": true,
    "createDesktopShortcut": true,
    "createStartMenuShortcut": true
  }
}
```

#### Package.json Scripts

```json
{
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "electron:dev": "vite --mode electron",
    "electron:build": "npm run build && electron-builder",
    "electron:preview": "vite build && electron ."
  },
  "main": "dist-electron/main.js"
}
```

## Data Models

### Window State Model

```typescript
interface WindowState {
  width: number;        // Pencere genişliği (px)
  height: number;       // Pencere yüksekliği (px)
  x?: number;          // Pencere X pozisyonu (px)
  y?: number;          // Pencere Y pozisyonu (px)
  isMaximized: boolean; // Maksimize durumu
}
```

### Environment Configuration Model

```typescript
interface EnvironmentConfig {
  GEMINI_API_KEY: string;  // Gemini API anahtarı
  [key: string]: string;   // Gelecekteki ek değişkenler
}
```

### Error Log Entry Model

```typescript
interface ErrorLogEntry {
  timestamp: string;      // ISO 8601 format
  level: 'error' | 'warn' | 'info';
  process: 'main' | 'renderer';
  message: string;
  stack?: string;
  context?: Record<string, any>;
}
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*


### Property 1: DataContext State Propagation

*For any* state update in DataContext (theme, activePage, backgroundStyle), when the state is updated, all components consuming the context should reflect the new state immediately.

**Validates: Requirements 3.3**

### Property 2: Pomodoro Hook State Management

*For any* pomodoro timer operation (start, pause, reset), the usePomodoro hook should maintain correct timer state and flow mode status across all components using it.

**Validates: Requirements 3.4**

### Property 3: Theme Switching Consistency

*For any* theme switch operation (light to dark or dark to light), the entire application UI should update to reflect the new theme without requiring a reload.

**Validates: Requirements 3.6**

### Property 4: Window State Persistence Round-Trip

*For any* window state (size, position, maximized status), closing the application and reopening it should restore the exact same window state.

**Validates: Requirements 6.3**

### Property 5: External Links Open in System Browser

*For any* external URL (http:// or https://), when clicked within the application, the link should open in the system default browser and not navigate the Electron window.

**Validates: Requirements 7.1**

### Property 6: Application Navigation Invariant

*For any* external link click, the Electron application should remain on the current page and not navigate away from the React application.

**Validates: Requirements 7.2**

### Property 7: User Data Persistence Round-Trip

*For any* user data (tasks, notes, settings, collection items), saving the data, closing the application, and reopening it should restore all data without loss.

**Validates: Requirements 9.2**

### Property 8: Main Process Error Logging

*For any* error that occurs in the Main Process, the error should be logged to a file with timestamp, message, and stack trace.

**Validates: Requirements 10.1**

### Property 9: Renderer Process Error Logging

*For any* error that occurs in the Renderer Process, the error should be logged to a file with timestamp, message, and stack trace.

**Validates: Requirements 10.2**

### Property 10: Critical Error User Notification

*For any* critical error (application crash, initialization failure), the user should see a user-friendly error message dialog before the application terminates.

**Validates: Requirements 10.4**

### Property 11: Error Log Format Completeness

*For any* logged error entry, the log should include a timestamp in ISO 8601 format, error message, and stack trace (if available).

**Validates: Requirements 10.5**

## Error Handling

### Main Process Errors

**Error Categories:**
1. **Initialization Errors**: Window creation failure, preload script loading failure
2. **IPC Errors**: Communication failures between main and renderer
3. **File System Errors**: Log file write failures, config file read failures
4. **External Process Errors**: System browser launch failures

**Handling Strategy:**

```typescript
class ErrorHandler {
  private logPath: string;
  
  constructor(logPath: string) {
    this.logPath = logPath;
  }
  
  handleError(error: Error, context: string, critical: boolean = false): void {
    const logEntry: ErrorLogEntry = {
      timestamp: new Date().toISOString(),
      level: critical ? 'error' : 'warn',
      process: 'main',
      message: error.message,
      stack: error.stack,
      context: { location: context }
    };
    
    // Log to file
    this.writeLog(logEntry);
    
    // Show dialog for critical errors
    if (critical) {
      dialog.showErrorBox(
        'Uygulama Hatası',
        `Bir hata oluştu: ${error.message}\n\nUygulama kapatılacak.`
      );
      app.quit();
    }
  }
  
  private writeLog(entry: ErrorLogEntry): void {
    try {
      const logLine = JSON.stringify(entry) + '\n';
      fs.appendFileSync(this.logPath, logLine, 'utf8');
    } catch (writeError) {
      console.error('Failed to write log:', writeError);
    }
  }
}
```

**Usage:**

```typescript
const errorHandler = new ErrorHandler(
  path.join(app.getPath('userData'), 'logs', 'main.log')
);

// Window creation error
try {
  mainWindow = createWindow();
} catch (error) {
  errorHandler.handleError(error as Error, 'createWindow', true);
}

// IPC error
ipcMain.handle('get-env-variables', async () => {
  try {
    return loadEnvironmentVariables();
  } catch (error) {
    errorHandler.handleError(error as Error, 'loadEnvVariables', false);
    return {};
  }
});
```

### Renderer Process Errors

**Error Categories:**
1. **React Errors**: Component rendering errors, hook errors
2. **API Errors**: Gemini API call failures
3. **Storage Errors**: localStorage access failures
4. **IPC Errors**: Communication failures with main process

**Handling Strategy:**

```typescript
// src/utils/errorHandler.ts
class RendererErrorHandler {
  async logError(error: Error, context: string): Promise<void> {
    const logEntry: ErrorLogEntry = {
      timestamp: new Date().toISOString(),
      level: 'error',
      process: 'renderer',
      message: error.message,
      stack: error.stack,
      context: { location: context }
    };
    
    // Send to main process for logging
    if (window.electronAPI) {
      await window.electronAPI.logError(logEntry);
    } else {
      console.error('Renderer error:', logEntry);
    }
  }
  
  handleReactError(error: Error, errorInfo: React.ErrorInfo): void {
    this.logError(error, `React: ${errorInfo.componentStack}`);
  }
}

export const rendererErrorHandler = new RendererErrorHandler();
```

**React Error Boundary:**

```typescript
// src/components/ErrorBoundary.tsx
class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error?: Error }
> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false };
  }
  
  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }
  
  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    rendererErrorHandler.handleReactError(error, errorInfo);
  }
  
  render() {
    if (this.state.hasError) {
      return (
        <div className="flex items-center justify-center h-screen">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-4">Bir hata oluştu</h1>
            <p className="text-gray-600 mb-4">
              {this.state.error?.message}
            </p>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-primary text-white rounded"
            >
              Yeniden Yükle
            </button>
          </div>
        </div>
      );
    }
    
    return this.props.children;
  }
}
```

### Environment Variable Errors

```typescript
// Graceful degradation for missing API keys
async function getApiKey(): Promise<string> {
  try {
    const key = await getEnvVariable('GEMINI_API_KEY');
    if (!key) {
      throw new Error('GEMINI_API_KEY is not configured');
    }
    return key;
  } catch (error) {
    rendererErrorHandler.logError(
      error as Error,
      'getApiKey'
    );
    
    // Show user-friendly message
    alert(
      'API anahtarı yapılandırılmamış. ' +
      'Lütfen ayarlardan API anahtarınızı girin.'
    );
    
    return '';
  }
}
```

## Testing Strategy

### Dual Testing Approach

Bu proje hem **unit testler** hem de **property-based testler** kullanacaktır. Her iki test türü de birbirini tamamlar ve kapsamlı test coverage sağlar:

- **Unit testler**: Spesifik örnekler, edge case'ler ve hata durumları için
- **Property testler**: Tüm girdiler üzerinde evrensel özellikler için

### Unit Testing

**Test Framework**: Vitest (Vite ile entegre)

**Test Kategorileri:**

1. **Main Process Tests**:
   - Window creation with default dimensions
   - Window state save/load
   - IPC handler registration
   - External link handling
   - Error logging to file

2. **Preload Script Tests**:
   - Context bridge API exposure
   - IPC invoke methods
   - Platform detection

3. **React Component Tests**:
   - Component rendering in Electron environment
   - External link click handling
   - Environment variable access
   - Error boundary behavior

4. **Build System Tests**:
   - Vite build output verification
   - Electron builder output verification
   - Executable file creation
   - Asset bundling

**Example Unit Tests:**

```typescript
// tests/electron/main.test.ts
import { describe, it, expect, beforeEach } from 'vitest';
import { BrowserWindow } from 'electron';

describe('Window Creation', () => {
  it('should create window with default size on first launch', () => {
    const window = createWindow();
    const bounds = window.getBounds();
    
    expect(bounds.width).toBe(1200);
    expect(bounds.height).toBe(800);
  });
  
  it('should set minimum window size', () => {
    const window = createWindow();
    const minSize = window.getMinimumSize();
    
    expect(minSize[0]).toBe(800);
    expect(minSize[1]).toBe(600);
  });
  
  it('should open external links in system browser', async () => {
    const window = createWindow();
    const mockShell = { openExternal: vi.fn() };
    
    await window.webContents.setWindowOpenHandler({ 
      url: 'https://youtube.com' 
    });
    
    expect(mockShell.openExternal).toHaveBeenCalledWith(
      'https://youtube.com'
    );
  });
});
```

### Property-Based Testing

**Test Framework**: fast-check (JavaScript/TypeScript property-based testing library)

**Configuration**: Minimum 100 iterations per property test

**Property Test Implementation:**

Her correctness property için bir property-based test yazılacaktır. Her test, design dokümanındaki property'ye referans verecektir.

**Example Property Tests:**

```typescript
// tests/properties/state-management.property.test.ts
import { describe, it } from 'vitest';
import * as fc from 'fast-check';

describe('Property Tests: State Management', () => {
  /**
   * Feature: electron-desktop-app, Property 1
   * For any state update in DataContext, all components should reflect the new state
   */
  it('DataContext state propagates to all consumers', () => {
    fc.assert(
      fc.property(
        fc.record({
          theme: fc.constantFrom('light', 'dark'),
          activePage: fc.constantFrom(
            'Dashboard', 'Tasks', 'Notes', 'Settings'
          ),
          backgroundStyle: fc.record({
            background: fc.string()
          })
        }),
        (newState) => {
          // Setup: Create context with initial state
          const { result } = renderHook(() => useContext(DataContext));
          
          // Action: Update state
          act(() => {
            result.current.setTheme(newState.theme);
            result.current.setActivePage(newState.activePage);
          });
          
          // Assert: State is updated
          expect(result.current.theme).toBe(newState.theme);
          expect(result.current.activePage).toBe(newState.activePage);
        }
      ),
      { numRuns: 100 }
    );
  });
  
  /**
   * Feature: electron-desktop-app, Property 3
   * For any theme switch, the entire UI should update without reload
   */
  it('Theme switching updates entire UI', () => {
    fc.assert(
      fc.property(
        fc.constantFrom('light', 'dark'),
        fc.constantFrom('light', 'dark'),
        (initialTheme, newTheme) => {
          // Setup: Render app with initial theme
          const { container } = render(
            <DataProvider initialTheme={initialTheme}>
              <App />
            </DataProvider>
          );
          
          // Action: Switch theme
          const themeButton = screen.getByRole('button', { 
            name: /theme/i 
          });
          fireEvent.click(themeButton);
          
          // Assert: Root element has new theme class
          const root = container.firstChild;
          expect(root).toHaveClass(newTheme);
        }
      ),
      { numRuns: 100 }
    );
  });
});

// tests/properties/persistence.property.test.ts
describe('Property Tests: Data Persistence', () => {
  /**
   * Feature: electron-desktop-app, Property 4
   * Window state round-trip: close and reopen should restore state
   */
  it('Window state persists across restarts', () => {
    fc.assert(
      fc.property(
        fc.record({
          width: fc.integer({ min: 800, max: 2000 }),
          height: fc.integer({ min: 600, max: 1500 }),
          x: fc.integer({ min: 0, max: 1000 }),
          y: fc.integer({ min: 0, max: 1000 }),
          isMaximized: fc.boolean()
        }),
        (windowState) => {
          // Setup: Create window with state
          const window = createWindow();
          window.setBounds({
            width: windowState.width,
            height: windowState.height,
            x: windowState.x,
            y: windowState.y
          });
          if (windowState.isMaximized) {
            window.maximize();
          }
          
          // Action: Save and restore
          saveWindowState(window);
          window.close();
          const newWindow = createWindow();
          
          // Assert: State is restored
          const bounds = newWindow.getBounds();
          expect(bounds.width).toBe(windowState.width);
          expect(bounds.height).toBe(windowState.height);
          expect(newWindow.isMaximized()).toBe(windowState.isMaximized);
        }
      ),
      { numRuns: 100 }
    );
  });
  
  /**
   * Feature: electron-desktop-app, Property 7
   * User data round-trip: save, close, reopen should restore data
   */
  it('User data persists across app restarts', () => {
    fc.assert(
      fc.property(
        fc.record({
          tasks: fc.array(fc.record({
            id: fc.string(),
            title: fc.string(),
            completed: fc.boolean()
          })),
          notes: fc.array(fc.record({
            id: fc.string(),
            content: fc.string()
          })),
          settings: fc.record({
            theme: fc.constantFrom('light', 'dark'),
            pomodoroTime: fc.integer({ min: 1, max: 60 })
          })
        }),
        (userData) => {
          // Setup: Save user data
          localStorage.setItem('tasks', JSON.stringify(userData.tasks));
          localStorage.setItem('notes', JSON.stringify(userData.notes));
          localStorage.setItem('settings', JSON.stringify(userData.settings));
          
          // Action: Simulate app restart (clear memory, reload from storage)
          const restoredTasks = JSON.parse(
            localStorage.getItem('tasks') || '[]'
          );
          const restoredNotes = JSON.parse(
            localStorage.getItem('notes') || '[]'
          );
          const restoredSettings = JSON.parse(
            localStorage.getItem('settings') || '{}'
          );
          
          // Assert: Data is restored correctly
          expect(restoredTasks).toEqual(userData.tasks);
          expect(restoredNotes).toEqual(userData.notes);
          expect(restoredSettings).toEqual(userData.settings);
        }
      ),
      { numRuns: 100 }
    );
  });
});

// tests/properties/external-links.property.test.ts
describe('Property Tests: External Links', () => {
  /**
   * Feature: electron-desktop-app, Property 5
   * External links should open in system browser
   */
  it('All external URLs open in system browser', () => {
    fc.assert(
      fc.property(
        fc.webUrl(),
        async (url) => {
          // Setup: Mock shell.openExternal
          const mockOpenExternal = vi.fn();
          
          // Action: Click external link
          await openExternalLink(url);
          
          // Assert: System browser was called
          expect(mockOpenExternal).toHaveBeenCalledWith(url);
        }
      ),
      { numRuns: 100 }
    );
  });
  
  /**
   * Feature: electron-desktop-app, Property 6
   * App should not navigate away on external link clicks
   */
  it('Application navigation remains unchanged after external link clicks', () => {
    fc.assert(
      fc.property(
        fc.webUrl(),
        fc.constantFrom('Dashboard', 'Tasks', 'Notes'),
        async (externalUrl, currentPage) => {
          // Setup: Set current page
          const { result } = renderHook(() => useContext(DataContext));
          act(() => {
            result.current.setActivePage(currentPage);
          });
          const pageBeforeClick = result.current.activePage;
          
          // Action: Click external link
          await openExternalLink(externalUrl);
          
          // Assert: Page hasn't changed
          expect(result.current.activePage).toBe(pageBeforeClick);
        }
      ),
      { numRuns: 100 }
    );
  });
});

// tests/properties/error-logging.property.test.ts
describe('Property Tests: Error Logging', () => {
  /**
   * Feature: electron-desktop-app, Property 8 & 9
   * All errors should be logged with proper format
   */
  it('All errors are logged with timestamp and stack trace', () => {
    fc.assert(
      fc.property(
        fc.string(),
        fc.constantFrom('main', 'renderer'),
        (errorMessage, process) => {
          // Setup: Create error
          const error = new Error(errorMessage);
          const errorHandler = new ErrorHandler('/tmp/test.log');
          
          // Action: Log error
          errorHandler.handleError(error, 'test-context', false);
          
          // Assert: Log entry has required fields
          const logContent = fs.readFileSync('/tmp/test.log', 'utf8');
          const logEntry = JSON.parse(logContent.split('\n').pop() || '{}');
          
          expect(logEntry.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T/);
          expect(logEntry.message).toBe(errorMessage);
          expect(logEntry.stack).toBeDefined();
          expect(logEntry.process).toBe(process);
        }
      ),
      { numRuns: 100 }
    );
  });
  
  /**
   * Feature: electron-desktop-app, Property 11
   * Error log format should be complete
   */
  it('Error logs include all required fields', () => {
    fc.assert(
      fc.property(
        fc.record({
          message: fc.string(),
          level: fc.constantFrom('error', 'warn', 'info'),
          context: fc.dictionary(fc.string(), fc.anything())
        }),
        (errorData) => {
          // Setup: Create error
          const error = new Error(errorData.message);
          const errorHandler = new ErrorHandler('/tmp/test.log');
          
          // Action: Log error
          errorHandler.handleError(error, JSON.stringify(errorData.context));
          
          // Assert: Log has all required fields
          const logContent = fs.readFileSync('/tmp/test.log', 'utf8');
          const logEntry: ErrorLogEntry = JSON.parse(
            logContent.split('\n').pop() || '{}'
          );
          
          expect(logEntry).toHaveProperty('timestamp');
          expect(logEntry).toHaveProperty('level');
          expect(logEntry).toHaveProperty('process');
          expect(logEntry).toHaveProperty('message');
          expect(logEntry).toHaveProperty('stack');
          expect(logEntry).toHaveProperty('context');
          
          // Validate timestamp format (ISO 8601)
          expect(logEntry.timestamp).toMatch(
            /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/
          );
        }
      ),
      { numRuns: 100 }
    );
  });
});
```

### Integration Testing

**Test Scenarios:**

1. **End-to-End Application Launch**:
   - Start application
   - Verify window opens
   - Verify React app loads
   - Verify all components render
   - Close application
   - Verify clean shutdown

2. **Data Persistence Flow**:
   - Create tasks, notes, and settings
   - Close application
   - Reopen application
   - Verify all data is restored

3. **External Link Flow**:
   - Click each external link
   - Verify system browser opens
   - Verify app remains on current page

4. **Error Recovery Flow**:
   - Trigger various errors
   - Verify error logging
   - Verify error messages
   - Verify app continues running (for non-critical errors)

### Test Coverage Goals

- **Unit Tests**: 80% code coverage
- **Property Tests**: All 11 correctness properties implemented
- **Integration Tests**: All major user flows covered
- **Build Tests**: All build outputs verified

### Continuous Testing

```json
// package.json
{
  "scripts": {
    "test": "vitest",
    "test:unit": "vitest run --coverage",
    "test:property": "vitest run tests/properties",
    "test:integration": "vitest run tests/integration",
    "test:all": "npm run test:unit && npm run test:property && npm run test:integration"
  }
}
```

## Implementation Notes

### Development Workflow

1. **Setup Phase**:
   - Install Electron dependencies
   - Configure Vite for Electron
   - Create electron/ directory structure
   - Set up TypeScript configurations

2. **Main Process Development**:
   - Implement main.ts
   - Implement preload.ts
   - Set up IPC handlers
   - Implement error logging

3. **React App Adaptation**:
   - Create utility functions for Electron APIs
   - Update Sidebar for external links
   - Add Error Boundary
   - Test in Electron environment

4. **Build Configuration**:
   - Configure Electron Builder
   - Create application icon
   - Set up build scripts
   - Test production build

5. **Testing**:
   - Write unit tests
   - Write property tests
   - Run integration tests
   - Verify on Windows

### Dependencies to Add

```json
{
  "dependencies": {
    "electron-store": "^8.1.0"
  },
  "devDependencies": {
    "electron": "^28.0.0",
    "electron-builder": "^24.9.1",
    "vite-plugin-electron": "^0.28.0",
    "vite-plugin-electron-renderer": "^0.14.5",
    "vitest": "^1.0.0",
    "@vitest/ui": "^1.0.0",
    "fast-check": "^3.15.0",
    "@types/electron": "^1.6.10"
  }
}
```

### Security Considerations

1. **Context Isolation**: Enabled by default, prevents renderer from accessing Node.js APIs directly
2. **Sandbox**: Enabled for renderer process
3. **Node Integration**: Disabled in renderer
4. **Preload Script**: Only expose necessary APIs through contextBridge
5. **Environment Variables**: Never expose in bundled code, use IPC for secure access
6. **External Links**: Always validate URLs before opening in system browser

### Performance Considerations

1. **Bundle Size**: Minimize dependencies, use tree-shaking
2. **Startup Time**: Lazy load heavy components, optimize main process initialization
3. **Memory Usage**: Monitor renderer process memory, implement cleanup on window close
4. **Build Time**: Use incremental builds in development, optimize production builds

### Platform-Specific Notes

**Windows**:
- Use .ico format for application icon (256x256 recommended)
- NSIS installer provides best user experience
- Code signing recommended for production (prevents Windows SmartScreen warnings)
- Test on Windows 10 and Windows 11

### Future Enhancements

1. **Auto-Update**: Implement electron-updater for automatic updates
2. **System Tray**: Add system tray icon with quick actions
3. **Keyboard Shortcuts**: Global keyboard shortcuts for common actions
4. **Multi-Window**: Support for multiple windows (e.g., separate window for notes)
5. **Native Notifications**: Use Electron's notification API for reminders
6. **macOS and Linux Support**: Extend to other platforms
