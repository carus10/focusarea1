import { describe, it, expect, vi, beforeEach } from 'vitest';
import { rendererErrorHandler } from '../../utils/errorHandler';

describe('RendererErrorHandler', () => {
  beforeEach(() => {
    // Reset mocks before each test
    vi.clearAllMocks();
  });

  describe('logError', () => {
    it('should create error log entry with correct structure', async () => {
      const mockLogError = vi.fn();
      
      // Mock window.electronAPI
      (global as any).window = {
        electronAPI: {
          logError: mockLogError
        }
      };

      const testError = new Error('Test renderer error');
      const context = 'test-component';

      await rendererErrorHandler.logError(testError, context);

      expect(mockLogError).toHaveBeenCalledTimes(1);
      
      const logEntry = mockLogError.mock.calls[0][0];
      expect(logEntry).toHaveProperty('timestamp');
      expect(logEntry).toHaveProperty('level');
      expect(logEntry).toHaveProperty('process');
      expect(logEntry).toHaveProperty('message');
      expect(logEntry).toHaveProperty('context');

      expect(logEntry.level).toBe('error');
      expect(logEntry.process).toBe('renderer');
      expect(logEntry.message).toBe('Test renderer error');
      expect(logEntry.context).toEqual({ location: context });
    });

    it('should include timestamp in ISO 8601 format', async () => {
      const mockLogError = vi.fn();
      
      (global as any).window = {
        electronAPI: {
          logError: mockLogError
        }
      };

      const testError = new Error('Test error');
      await rendererErrorHandler.logError(testError, 'test');

      const logEntry = mockLogError.mock.calls[0][0];
      
      // Validate ISO 8601 format
      expect(logEntry.timestamp).toMatch(
        /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/
      );
    });

    it('should include stack trace in log entry', async () => {
      const mockLogError = vi.fn();
      
      (global as any).window = {
        electronAPI: {
          logError: mockLogError
        }
      };

      const testError = new Error('Test error with stack');
      await rendererErrorHandler.logError(testError, 'test');

      const logEntry = mockLogError.mock.calls[0][0];
      
      expect(logEntry.stack).toBeDefined();
      expect(logEntry.stack).toContain('Error: Test error with stack');
    });

    it('should handle missing electronAPI gracefully', async () => {
      // Mock console.error to verify fallback
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      
      (global as any).window = {};

      const testError = new Error('Test error');
      
      // Should not throw
      await expect(
        rendererErrorHandler.logError(testError, 'test')
      ).resolves.not.toThrow();

      expect(consoleErrorSpy).toHaveBeenCalled();
      
      consoleErrorSpy.mockRestore();
    });

    it('should handle IPC errors gracefully', async () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const mockLogError = vi.fn().mockRejectedValue(new Error('IPC failed'));
      
      (global as any).window = {
        electronAPI: {
          logError: mockLogError
        }
      };

      const testError = new Error('Test error');
      
      // Should not throw even if IPC fails
      await expect(
        rendererErrorHandler.logError(testError, 'test')
      ).resolves.not.toThrow();

      expect(consoleErrorSpy).toHaveBeenCalled();
      
      consoleErrorSpy.mockRestore();
    });
  });

  describe('handleReactError', () => {
    it('should log React errors with component stack', async () => {
      const mockLogError = vi.fn();
      
      (global as any).window = {
        electronAPI: {
          logError: mockLogError
        }
      };

      const testError = new Error('React component error');
      const errorInfo = {
        componentStack: '\n    at Component (Component.tsx:10)\n    at App (App.tsx:5)'
      } as React.ErrorInfo;

      rendererErrorHandler.handleReactError(testError, errorInfo);

      // Wait for async operation
      await new Promise(resolve => setTimeout(resolve, 0));

      expect(mockLogError).toHaveBeenCalledTimes(1);
      
      const logEntry = mockLogError.mock.calls[0][0];
      expect(logEntry.context.location).toContain('React:');
      expect(logEntry.context.location).toContain('Component.tsx');
    });

    it('should handle missing component stack', async () => {
      const mockLogError = vi.fn();
      
      (global as any).window = {
        electronAPI: {
          logError: mockLogError
        }
      };

      const testError = new Error('React error');
      const errorInfo = {} as React.ErrorInfo;

      rendererErrorHandler.handleReactError(testError, errorInfo);

      // Wait for async operation
      await new Promise(resolve => setTimeout(resolve, 0));

      expect(mockLogError).toHaveBeenCalledTimes(1);
      
      const logEntry = mockLogError.mock.calls[0][0];
      expect(logEntry.context.location).toContain('React:');
    });
  });
});
