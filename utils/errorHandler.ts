interface ErrorLogEntry {
  timestamp: string;
  level: 'error' | 'warn' | 'info';
  process: 'renderer';
  message: string;
  stack?: string;
  context?: Record<string, any>;
}

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
      try {
        await window.electronAPI.logError(logEntry);
      } catch (err) {
        console.error('Failed to log error to main process:', err);
      }
    } else {
      console.error('Renderer error:', logEntry);
    }
  }

  handleReactError(error: Error, errorInfo: React.ErrorInfo): void {
    this.logError(error, `React: ${errorInfo.componentStack || 'Unknown component'}`);
  }
}

export const rendererErrorHandler = new RendererErrorHandler();
