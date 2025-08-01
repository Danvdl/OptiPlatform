import { Injectable, LoggerService as NestLoggerService } from '@nestjs/common';
import { AppError } from './error-codes';

export interface LogContext {
  userId?: number;
  requestId?: string;
  module?: string;
  operation?: string;
  metadata?: Record<string, any>;
}

export interface ErrorLogEntry extends LogContext {
  error: Error | AppError;
  timestamp: Date;
  level: 'error' | 'warn' | 'info' | 'debug';
  message: string;
  stack?: string;
  errorCode?: string;
}

@Injectable()
export class LoggingService implements NestLoggerService {
  private logs: ErrorLogEntry[] = [];
  private readonly maxLogEntries = 1000;

  /**
   * Log an error with context
   */
  logError(error: Error | AppError, context?: LogContext, message?: string): void {
    const logEntry: ErrorLogEntry = {
      error,
      timestamp: new Date(),
      level: 'error',
      message: message || error.message,
      stack: error.stack,
      errorCode: error instanceof AppError ? error.code : undefined,
      ...context,
    };

    this.addLogEntry(logEntry);
    this.writeToConsole(logEntry);
  }

  /**
   * Log a warning with context
   */
  logWarning(message: string, context?: LogContext): void {
    const logEntry: ErrorLogEntry = {
      error: new Error(message),
      timestamp: new Date(),
      level: 'warn',
      message,
      ...context,
    };

    this.addLogEntry(logEntry);
    this.writeToConsole(logEntry);
  }

  /**
   * Log info message with context
   */
  logInfo(message: string, context?: LogContext): void {
    const logEntry: ErrorLogEntry = {
      error: new Error(message),
      timestamp: new Date(),
      level: 'info',
      message,
      ...context,
    };

    this.addLogEntry(logEntry);
    this.writeToConsole(logEntry);
  }

  /**
   * Log debug message with context
   */
  logDebug(message: string, context?: LogContext): void {
    const logEntry: ErrorLogEntry = {
      error: new Error(message),
      timestamp: new Date(),
      level: 'debug',
      message,
      ...context,
    };

    this.addLogEntry(logEntry);
    
    if (process.env.NODE_ENV === 'development') {
      this.writeToConsole(logEntry);
    }
  }

  /**
   * NestJS Logger interface implementation
   */
  log(message: any, context?: string): void {
    this.logInfo(typeof message === 'string' ? message : JSON.stringify(message), {
      module: context,
    });
  }

  error(message: any, trace?: string, context?: string): void {
    const error = new Error(typeof message === 'string' ? message : JSON.stringify(message));
    if (trace) {
      error.stack = trace;
    }
    this.logError(error, { module: context });
  }

  warn(message: any, context?: string): void {
    this.logWarning(typeof message === 'string' ? message : JSON.stringify(message), {
      module: context,
    });
  }

  debug(message: any, context?: string): void {
    this.logDebug(typeof message === 'string' ? message : JSON.stringify(message), {
      module: context,
    });
  }

  verbose(message: any, context?: string): void {
    this.logDebug(typeof message === 'string' ? message : JSON.stringify(message), {
      module: context,
    });
  }

  /**
   * Get recent logs for debugging
   */
  getRecentLogs(count: number = 50): ErrorLogEntry[] {
    return this.logs.slice(-count);
  }

  /**
   * Get logs filtered by level
   */
  getLogsByLevel(level: 'error' | 'warn' | 'info' | 'debug'): ErrorLogEntry[] {
    return this.logs.filter(log => log.level === level);
  }

  /**
   * Get logs for specific user
   */
  getLogsByUser(userId: number): ErrorLogEntry[] {
    return this.logs.filter(log => log.userId === userId);
  }

  /**
   * Get error statistics
   */
  getErrorStats(): {
    totalErrors: number;
    errorsByCode: Record<string, number>;
    errorsByModule: Record<string, number>;
    recentErrorRate: number;
  } {
    const errors = this.logs.filter(log => log.level === 'error');
    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
    const recentErrors = errors.filter(log => log.timestamp > oneHourAgo);

    const errorsByCode: Record<string, number> = {};
    const errorsByModule: Record<string, number> = {};

    errors.forEach(log => {
      if (log.errorCode) {
        errorsByCode[log.errorCode] = (errorsByCode[log.errorCode] || 0) + 1;
      }
      if (log.module) {
        errorsByModule[log.module] = (errorsByModule[log.module] || 0) + 1;
      }
    });

    return {
      totalErrors: errors.length,
      errorsByCode,
      errorsByModule,
      recentErrorRate: recentErrors.length,
    };
  }

  /**
   * Clear old logs to manage memory
   */
  clearOldLogs(): void {
    if (this.logs.length > this.maxLogEntries) {
      this.logs = this.logs.slice(-this.maxLogEntries);
    }
  }

  /**
   * Export logs for external analysis
   */
  exportLogs(format: 'json' | 'csv' = 'json'): string {
    if (format === 'csv') {
      const headers = [
        'timestamp',
        'level',
        'message',
        'errorCode',
        'module',
        'operation',
        'userId',
        'requestId',
      ];
      
      const rows = this.logs.map(log => [
        log.timestamp.toISOString(),
        log.level,
        log.message.replace(/"/g, '""'),
        log.errorCode || '',
        log.module || '',
        log.operation || '',
        log.userId || '',
        log.requestId || '',
      ]);

      return [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
    }

    return JSON.stringify(this.logs, null, 2);
  }

  private addLogEntry(entry: ErrorLogEntry): void {
    this.logs.push(entry);
    this.clearOldLogs();
  }

  private writeToConsole(entry: ErrorLogEntry): void {
    const contextStr = this.formatContext(entry);
    const message = `[${entry.timestamp.toISOString()}] ${entry.level.toUpperCase()}: ${entry.message}${contextStr}`;

    switch (entry.level) {
      case 'error':
        console.error(message);
        if (entry.stack) {
          console.error(entry.stack);
        }
        break;
      case 'warn':
        console.warn(message);
        break;
      case 'info':
        console.info(message);
        break;
      case 'debug':
        console.debug(message);
        break;
    }
  }

  private formatContext(entry: ErrorLogEntry): string {
    const parts: string[] = [];
    
    if (entry.errorCode) parts.push(`code:${entry.errorCode}`);
    if (entry.module) parts.push(`module:${entry.module}`);
    if (entry.operation) parts.push(`op:${entry.operation}`);
    if (entry.userId) parts.push(`user:${entry.userId}`);
    if (entry.requestId) parts.push(`req:${entry.requestId}`);
    
    if (entry.metadata && Object.keys(entry.metadata).length > 0) {
      parts.push(`metadata:${JSON.stringify(entry.metadata)}`);
    }
    
    return parts.length > 0 ? ` [${parts.join(', ')}]` : '';
  }
}

/**
 * Decorator to automatically log method calls and errors
 */
export function LogOperation(operation?: string) {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;
    const operationName = operation || `${target.constructor.name}.${propertyKey}`;

    descriptor.value = async function (...args: any[]) {
      const loggingService: LoggingService = this.loggingService || global.loggingService;
      
      if (loggingService) {
        loggingService.logDebug(`Starting operation: ${operationName}`, {
          module: target.constructor.name,
          operation: operationName,
        });
      }

      try {
        const result = await originalMethod.apply(this, args);
        
        if (loggingService) {
          loggingService.logDebug(`Completed operation: ${operationName}`, {
            module: target.constructor.name,
            operation: operationName,
          });
        }
        
        return result;
      } catch (error) {
        if (loggingService) {
          loggingService.logError(error, {
            module: target.constructor.name,
            operation: operationName,
          }, `Failed operation: ${operationName}`);
        }
        throw error;
      }
    };

    return descriptor;
  };
}
