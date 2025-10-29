/**
 * Structured Logger Utility
 *
 * Provides consistent, structured logging across the application.
 * Outputs JSON-formatted logs with timestamps, levels, and metadata.
 *
 * Usage:
 *   logger.info('Operation completed', { userId: '123' });
 *   logger.error('Upload failed', error, { operation: 'cloudinary_upload' });
 *   logger.syncStart('stripe_sync', { productCount: 10 });
 */

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';
export type LogMeta = Record<string, unknown>;

export interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: string;
  meta?: LogMeta;
  error?: {
    message: string;
    stack?: string;
    name: string;
  };
}

export class Logger {
  /**
   * Format log entry as structured JSON
   */
  private formatLog(
    level: LogLevel,
    message: string,
    meta?: LogMeta,
    error?: Error
  ): LogEntry {
    const entry: LogEntry = {
      level,
      message,
      timestamp: new Date().toISOString(),
    };

    if (meta && Object.keys(meta).length > 0) {
      entry.meta = meta;
    }

    if (error) {
      entry.error = {
        message: error.message,
        stack: error.stack,
        name: error.name,
      };
    }

    return entry;
  }

  /**
   * Serialize log entry to JSON string
   */
  private serialize(entry: LogEntry): string {
    return JSON.stringify(entry);
  }

  /**
   * Debug-level logging (development only)
   * Use for detailed traces that aren't needed in production
   */
  debug(message: string, meta?: LogMeta): void {
    if (process.env.NODE_ENV === 'development') {
      console.debug(this.serialize(this.formatLog('debug', message, meta)));
    }
  }

  /**
   * Info-level logging
   * Use for normal operational messages
   */
  info(message: string, meta?: LogMeta): void {
    console.info(this.serialize(this.formatLog('info', message, meta)));
  }

  /**
   * Warning-level logging
   * Use for recoverable issues, deprecation notices
   */
  warn(message: string, meta?: LogMeta): void {
    console.warn(this.serialize(this.formatLog('warn', message, meta)));
  }

  /**
   * Error-level logging
   * Use for failures requiring attention
   */
  error(message: string, error?: Error, meta?: LogMeta): void {
    console.error(this.serialize(this.formatLog('error', message, meta, error)));
  }

  /**
   * Log sync operation start
   */
  syncStart(operation: string, meta?: LogMeta): void {
    this.info(`Sync started: ${operation}`, {
      ...meta,
      syncPhase: 'start',
      operation,
    });
  }

  /**
   * Log sync operation completion
   */
  syncComplete(operation: string, meta?: LogMeta): void {
    this.info(`Sync completed: ${operation}`, {
      ...meta,
      syncPhase: 'complete',
      operation,
    });
  }

  /**
   * Log sync operation failure
   */
  syncError(operation: string, error: Error, meta?: LogMeta): void {
    this.error(`Sync failed: ${operation}`, error, {
      ...meta,
      syncPhase: 'error',
      operation,
    });
  }

  /**
   * Log API request
   */
  apiRequest(method: string, path: string, meta?: LogMeta): void {
    this.info('API request', {
      ...meta,
      method,
      path,
    });
  }

  /**
   * Log API response
   */
  apiResponse(method: string, path: string, status: number, meta?: LogMeta): void {
    const level = status >= 400 ? 'error' : 'info';
    const message = `API response: ${status}`;

    if (level === 'error') {
      this.error(message, undefined, {
        ...meta,
        method,
        path,
        status,
      });
    } else {
      this.info(message, {
        ...meta,
        method,
        path,
        status,
      });
    }
  }
}

// Export singleton instance
export const logger = new Logger();
