import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { logger, Logger, LogEntry } from '@/lib/utils/logger';

describe('Logger', () => {
  let consoleSpy: {
    debug: ReturnType<typeof vi.spyOn>;
    info: ReturnType<typeof vi.spyOn>;
    warn: ReturnType<typeof vi.spyOn>;
    error: ReturnType<typeof vi.spyOn>;
  };

  beforeEach(() => {
    // Spy on console methods
    consoleSpy = {
      debug: vi.spyOn(console, 'debug').mockImplementation(() => {}),
      info: vi.spyOn(console, 'info').mockImplementation(() => {}),
      warn: vi.spyOn(console, 'warn').mockImplementation(() => {}),
      error: vi.spyOn(console, 'error').mockImplementation(() => {}),
    };
  });

  afterEach(() => {
    // Restore console methods
    vi.restoreAllMocks();
  });

  describe('info()', () => {
    it('should log info message with correct structure', () => {
      logger.info('Test message');

      expect(consoleSpy.info).toHaveBeenCalledOnce();
      const logOutput = consoleSpy.info.mock.calls[0][0];
      const parsed: LogEntry = JSON.parse(logOutput);

      expect(parsed.level).toBe('info');
      expect(parsed.message).toBe('Test message');
      expect(parsed.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
      expect(parsed.meta).toBeUndefined();
      expect(parsed.error).toBeUndefined();
    });

    it('should include metadata when provided', () => {
      logger.info('Test with metadata', { userId: '123', action: 'sync' });

      const logOutput = consoleSpy.info.mock.calls[0][0];
      const parsed: LogEntry = JSON.parse(logOutput);

      expect(parsed.meta).toEqual({ userId: '123', action: 'sync' });
    });

    it('should omit empty metadata object', () => {
      logger.info('Test message', {});

      const logOutput = consoleSpy.info.mock.calls[0][0];
      const parsed: LogEntry = JSON.parse(logOutput);

      expect(parsed.meta).toBeUndefined();
    });
  });

  describe('error()', () => {
    it('should log error message with error object', () => {
      const testError = new Error('Test error');
      testError.stack = 'Error: Test error\n    at test.ts:1:1';

      logger.error('Operation failed', testError);

      expect(consoleSpy.error).toHaveBeenCalledOnce();
      const logOutput = consoleSpy.error.mock.calls[0][0];
      const parsed: LogEntry = JSON.parse(logOutput);

      expect(parsed.level).toBe('error');
      expect(parsed.message).toBe('Operation failed');
      expect(parsed.error).toEqual({
        message: 'Test error',
        stack: 'Error: Test error\n    at test.ts:1:1',
        name: 'Error',
      });
    });

    it('should include metadata with error', () => {
      const testError = new Error('Test error');
      logger.error('Upload failed', testError, { publicId: 'test/image' });

      const logOutput = consoleSpy.error.mock.calls[0][0];
      const parsed: LogEntry = JSON.parse(logOutput);

      expect(parsed.meta).toEqual({ publicId: 'test/image' });
      expect(parsed.error?.message).toBe('Test error');
    });

    it('should handle error without metadata', () => {
      const testError = new Error('Test error');
      logger.error('Operation failed', testError);

      const logOutput = consoleSpy.error.mock.calls[0][0];
      const parsed: LogEntry = JSON.parse(logOutput);

      expect(parsed.meta).toBeUndefined();
      expect(parsed.error?.message).toBe('Test error');
    });

    it('should handle message without error object', () => {
      logger.error('Generic error message', undefined, { context: 'test' });

      const logOutput = consoleSpy.error.mock.calls[0][0];
      const parsed: LogEntry = JSON.parse(logOutput);

      expect(parsed.error).toBeUndefined();
      expect(parsed.meta).toEqual({ context: 'test' });
    });
  });

  describe('warn()', () => {
    it('should log warning message', () => {
      logger.warn('Deprecation notice');

      expect(consoleSpy.warn).toHaveBeenCalledOnce();
      const logOutput = consoleSpy.warn.mock.calls[0][0];
      const parsed: LogEntry = JSON.parse(logOutput);

      expect(parsed.level).toBe('warn');
      expect(parsed.message).toBe('Deprecation notice');
    });

    it('should include metadata in warning', () => {
      logger.warn('Rate limit approaching', { remaining: 10, limit: 100 });

      const logOutput = consoleSpy.warn.mock.calls[0][0];
      const parsed: LogEntry = JSON.parse(logOutput);

      expect(parsed.meta).toEqual({ remaining: 10, limit: 100 });
    });
  });

  describe('debug()', () => {
    it('should log debug message in development mode', () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'development';

      logger.debug('Debug trace');

      expect(consoleSpy.debug).toHaveBeenCalledOnce();
      const logOutput = consoleSpy.debug.mock.calls[0][0];
      const parsed: LogEntry = JSON.parse(logOutput);

      expect(parsed.level).toBe('debug');
      expect(parsed.message).toBe('Debug trace');

      process.env.NODE_ENV = originalEnv;
    });

    it('should not log debug message in production mode', () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';

      logger.debug('Debug trace');

      expect(consoleSpy.debug).not.toHaveBeenCalled();

      process.env.NODE_ENV = originalEnv;
    });
  });

  describe('syncStart()', () => {
    it('should log sync start with operation name', () => {
      logger.syncStart('cloudinary_upload');

      const logOutput = consoleSpy.info.mock.calls[0][0];
      const parsed: LogEntry = JSON.parse(logOutput);

      expect(parsed.message).toBe('Sync started: cloudinary_upload');
      expect(parsed.meta).toEqual({
        syncPhase: 'start',
        operation: 'cloudinary_upload',
      });
    });

    it('should include additional metadata', () => {
      logger.syncStart('stripe_sync', { productCount: 5 });

      const logOutput = consoleSpy.info.mock.calls[0][0];
      const parsed: LogEntry = JSON.parse(logOutput);

      expect(parsed.meta).toEqual({
        productCount: 5,
        syncPhase: 'start',
        operation: 'stripe_sync',
      });
    });
  });

  describe('syncComplete()', () => {
    it('should log sync completion', () => {
      logger.syncComplete('database_sync');

      const logOutput = consoleSpy.info.mock.calls[0][0];
      const parsed: LogEntry = JSON.parse(logOutput);

      expect(parsed.message).toBe('Sync completed: database_sync');
      expect(parsed.meta).toEqual({
        syncPhase: 'complete',
        operation: 'database_sync',
      });
    });

    it('should include duration metadata', () => {
      logger.syncComplete('media_upload', { duration: 1234, filesUploaded: 10 });

      const logOutput = consoleSpy.info.mock.calls[0][0];
      const parsed: LogEntry = JSON.parse(logOutput);

      expect(parsed.meta).toEqual({
        duration: 1234,
        filesUploaded: 10,
        syncPhase: 'complete',
        operation: 'media_upload',
      });
    });
  });

  describe('syncError()', () => {
    it('should log sync failure with error', () => {
      const testError = new Error('Sync failed');
      logger.syncError('product_sync', testError);

      const logOutput = consoleSpy.error.mock.calls[0][0];
      const parsed: LogEntry = JSON.parse(logOutput);

      expect(parsed.message).toBe('Sync failed: product_sync');
      expect(parsed.error?.message).toBe('Sync failed');
      expect(parsed.meta).toEqual({
        syncPhase: 'error',
        operation: 'product_sync',
      });
    });

    it('should include failure context metadata', () => {
      const testError = new Error('Network timeout');
      logger.syncError('cloudinary_upload', testError, {
        publicId: 'media/products/test',
        attempt: 3,
      });

      const logOutput = consoleSpy.error.mock.calls[0][0];
      const parsed: LogEntry = JSON.parse(logOutput);

      expect(parsed.meta).toEqual({
        publicId: 'media/products/test',
        attempt: 3,
        syncPhase: 'error',
        operation: 'cloudinary_upload',
      });
    });
  });

  describe('apiRequest()', () => {
    it('should log API request', () => {
      logger.apiRequest('GET', '/api/products');

      const logOutput = consoleSpy.info.mock.calls[0][0];
      const parsed: LogEntry = JSON.parse(logOutput);

      expect(parsed.message).toBe('API request');
      expect(parsed.meta).toEqual({
        method: 'GET',
        path: '/api/products',
      });
    });

    it('should include request metadata', () => {
      logger.apiRequest('POST', '/api/orders', { userId: '123' });

      const logOutput = consoleSpy.info.mock.calls[0][0];
      const parsed: LogEntry = JSON.parse(logOutput);

      expect(parsed.meta).toEqual({
        userId: '123',
        method: 'POST',
        path: '/api/orders',
      });
    });
  });

  describe('apiResponse()', () => {
    it('should log successful API response as info', () => {
      logger.apiResponse('GET', '/api/products', 200);

      const logOutput = consoleSpy.info.mock.calls[0][0];
      const parsed: LogEntry = JSON.parse(logOutput);

      expect(parsed.level).toBe('info');
      expect(parsed.message).toBe('API response: 200');
      expect(parsed.meta).toEqual({
        method: 'GET',
        path: '/api/products',
        status: 200,
      });
    });

    it('should log error API response as error', () => {
      logger.apiResponse('POST', '/api/orders', 500);

      const logOutput = consoleSpy.error.mock.calls[0][0];
      const parsed: LogEntry = JSON.parse(logOutput);

      expect(parsed.level).toBe('error');
      expect(parsed.message).toBe('API response: 500');
      expect(parsed.meta).toEqual({
        method: 'POST',
        path: '/api/orders',
        status: 500,
      });
    });

    it('should include response metadata', () => {
      logger.apiResponse('GET', '/api/products', 404, { productId: 'xyz' });

      const logOutput = consoleSpy.error.mock.calls[0][0];
      const parsed: LogEntry = JSON.parse(logOutput);

      expect(parsed.meta).toEqual({
        productId: 'xyz',
        method: 'GET',
        path: '/api/products',
        status: 404,
      });
    });
  });

  describe('JSON serialization', () => {
    it('should produce valid JSON output', () => {
      logger.info('Test message', { key: 'value' });

      const logOutput = consoleSpy.info.mock.calls[0][0];

      // Should not throw
      expect(() => JSON.parse(logOutput)).not.toThrow();
    });

    it('should handle complex metadata objects', () => {
      logger.info('Complex metadata', {
        nested: { deep: { value: 123 } },
        array: [1, 2, 3],
        nullValue: null,
        boolValue: true,
      });

      const logOutput = consoleSpy.info.mock.calls[0][0];
      const parsed: LogEntry = JSON.parse(logOutput);

      expect(parsed.meta).toEqual({
        nested: { deep: { value: 123 } },
        array: [1, 2, 3],
        nullValue: null,
        boolValue: true,
      });
    });
  });

  describe('Logger class instantiation', () => {
    it('should allow creating new Logger instances', () => {
      const customLogger = new Logger();
      customLogger.info('Custom logger message');

      expect(consoleSpy.info).toHaveBeenCalledOnce();
    });

    it('should export singleton instance', () => {
      expect(logger).toBeInstanceOf(Logger);
    });
  });
});
