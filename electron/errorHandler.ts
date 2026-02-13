import * as fs from 'fs';
import * as path from 'path';
import { app, dialog } from 'electron';

export interface ErrorLogEntry {
  timestamp: string;
  level: 'error' | 'warn' | 'info';
  process: 'main' | 'renderer';
  message: string;
  stack?: string;
  context?: Record<string, any>;
}

export class ErrorHandler {
  private logPath: string;

  constructor(logPath?: string) {
    if (logPath) {
      this.logPath = logPath;
    } else {
      const logDir = path.join(app.getPath('userData'), 'logs');
      if (!fs.existsSync(logDir)) {
        fs.mkdirSync(logDir, { recursive: true });
      }
      this.logPath = path.join(logDir, 'main.log');
    }
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

  logRendererError(errorData: any): void {
    const logEntry: ErrorLogEntry = {
      timestamp: new Date().toISOString(),
      level: 'error',
      process: 'renderer',
      message: errorData.message || 'Unknown error',
      stack: errorData.stack,
      context: errorData.context
    };

    this.writeLog(logEntry);
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
