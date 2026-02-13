import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import { ErrorHandler, ErrorLogEntry } from '../../electron/errorHandler';

// Mock electron modules
vi.mock('electron', () => ({
  app: {
    getPath: vi.fn(() => '/tmp/test-app'),
    quit: vi.fn()
  },
  dialog: {
    showErrorBox: vi.fn()
  }
}));

describe('ErrorHandler', () => {
  let errorHandler: ErrorHandler;
  let testLogPath: string;

  beforeEach(() => {
    // Create a temporary log file path for testing
    testLogPath = path.join('/tmp', `test-${Date.now()}.log`);
    errorHandler = new ErrorHandler(testLogPath);
  });

  afterEach(() => {
    // Clean up test log file
    if (fs.existsSync(testLogPath)) {
      fs.unlinkSync(testLogPath);
    }
  });

  describe('handleError', () => {
    it('should log error to file with correct format', () => {
      const testError = new Error('Test error message');
      const context = 'test-context';

      errorHandler.handleError(testError, context, false);

      // Verify log file was created
      expect(fs.existsSync(testLogPath)).toBe(true);

      // Read and parse log entry
      const logContent = fs.readFileSync(testLogPath, 'utf8');
      const logEntry: ErrorLogEntry = JSON.parse(logContent.trim());

      // Verify log entry structure
      expect(logEntry).toHaveProperty('timestamp');
      expect(logEntry).toHaveProperty('level');
      expect(logEntry).toHaveProperty('process');
      expect(logEntry).toHaveProperty('message');
      expect(logEntry).toHaveProperty('stack');
      expect(logEntry).toHaveProperty('context');

      // Verify log entry values
      expect(logEntry.level).toBe('warn');
      expect(logEntry.process).toBe('main');
      expect(logEntry.message).toBe('Test error message');
      expect(logEntry.context).toEqual({ location: context });
    });

    it('should log critical errors with error level', () => {
      const testError = new Error('Critical error');
      const context = 'critical-context';

      errorHandler.handleError(testError, context, true);

      const logContent = fs.readFileSync(testLogPath, 'utf8');
      const logEntry: ErrorLogEntry = JSON.parse(logContent.trim());

      expect(logEntry.level).toBe('error');
    });

    it('should include timestamp in ISO 8601 format', () => {
      const testError = new Error('Test error');
      
      errorHandler.handleError(testError, 'test', false);

      const logContent = fs.readFileSync(testLogPath, 'utf8');
      const logEntry: ErrorLogEntry = JSON.parse(logContent.trim());

      // Validate ISO 8601 format
      expect(logEntry.timestamp).toMatch(
        /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/
      );
    });

    it('should include stack trace in log entry', () => {
      const testError = new Error('Test error with stack');
      
      errorHandler.handleError(testError, 'test', false);

      const logContent = fs.readFileSync(testLogPath, 'utf8');
      const logEntry: ErrorLogEntry = JSON.parse(logContent.trim());

      expect(logEntry.stack).toBeDefined();
      expect(logEntry.stack).toContain('Error: Test error with stack');
    });
  });

  describe('logRendererError', () => {
    it('should log renderer errors with correct process type', () => {
      const errorData = {
        message: 'Renderer error',
        stack: 'Error stack trace',
        context: { component: 'TestComponent' }
      };

      errorHandler.logRendererError(errorData);

      const logContent = fs.readFileSync(testLogPath, 'utf8');
      const logEntry: ErrorLogEntry = JSON.parse(logContent.trim());

      expect(logEntry.process).toBe('renderer');
      expect(logEntry.message).toBe('Renderer error');
      expect(logEntry.context).toEqual({ component: 'TestComponent' });
    });

    it('should handle missing error message', () => {
      const errorData = {
        stack: 'Some stack trace'
      };

      errorHandler.logRendererError(errorData);

      const logContent = fs.readFileSync(testLogPath, 'utf8');
      const logEntry: ErrorLogEntry = JSON.parse(logContent.trim());

      expect(logEntry.message).toBe('Unknown error');
    });
  });

  describe('log file management', () => {
    it('should append multiple errors to the same log file', () => {
      const error1 = new Error('First error');
      const error2 = new Error('Second error');

      errorHandler.handleError(error1, 'context1', false);
      errorHandler.handleError(error2, 'context2', false);

      const logContent = fs.readFileSync(testLogPath, 'utf8');
      const logLines = logContent.trim().split('\n');

      expect(logLines.length).toBe(2);

      const entry1: ErrorLogEntry = JSON.parse(logLines[0]);
      const entry2: ErrorLogEntry = JSON.parse(logLines[1]);

      expect(entry1.message).toBe('First error');
      expect(entry2.message).toBe('Second error');
    });

    it('should handle write errors gracefully', () => {
      // Create error handler with invalid path
      const invalidHandler = new ErrorHandler('/invalid/path/that/does/not/exist/test.log');
      const testError = new Error('Test error');

      // Should not throw, just log to console
      expect(() => {
        invalidHandler.handleError(testError, 'test', false);
      }).not.toThrow();
    });
  });
});
