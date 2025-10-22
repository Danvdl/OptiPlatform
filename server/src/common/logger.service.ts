import { Injectable, LoggerService as NestLoggerService } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';

export enum LogLevel {
  ERROR = 'error',
  WARN = 'warn',
  INFO = 'info',
  DEBUG = 'debug',
}

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  context?: string;
  message: string;
  data?: any;
  stack?: string;
  userId?: number;
  requestId?: string;
}

@Injectable()
export class LoggerService implements NestLoggerService {
  private logDir = path.join(process.cwd(), 'logs');
  private errorLogPath = path.join(this.logDir, 'error.log');
  private combinedLogPath = path.join(this.logDir, 'combined.log');
  private enableConsole = process.env.NODE_ENV !== 'production';

  constructor() {
    // Create logs directory if it doesn't exist
    if (!fs.existsSync(this.logDir)) {
      fs.mkdirSync(this.logDir, { recursive: true });
    }
  }

  /**
   * Log an informational message
   */
  log(message: string, context?: string, data?: any) {
    this.writeLog(LogLevel.INFO, message, context, data);
  }

  /**
   * Log an error
   */
  error(message: string, trace?: string, context?: string, data?: any) {
    this.writeLog(LogLevel.ERROR, message, context, data, trace);
  }

  /**
   * Log a warning
   */
  warn(message: string, context?: string, data?: any) {
    this.writeLog(LogLevel.WARN, message, context, data);
  }

  /**
   * Log debug information
   */
  debug(message: string, context?: string, data?: any) {
    if (process.env.NODE_ENV !== 'production') {
      this.writeLog(LogLevel.DEBUG, message, context, data);
    }
  }

  /**
   * Log verbose information (alias for debug)
   */
  verbose(message: string, context?: string) {
    this.debug(message, context);
  }

  /**
   * Write log entry to file and console
   */
  private writeLog(
    level: LogLevel,
    message: string,
    context?: string,
    data?: any,
    stack?: string,
  ) {
    const logEntry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      context,
      message,
      data,
      stack,
    };

    const logLine = this.formatLogEntry(logEntry);

    // Write to console in development
    if (this.enableConsole) {
      this.logToConsole(level, logLine);
    }

    // Always write to file
    this.logToFile(level, logLine);
  }

  /**
   * Format log entry as JSON string
   */
  private formatLogEntry(entry: LogEntry): string {
    return JSON.stringify(entry) + '\n';
  }

  /**
   * Write to console with colors
   */
  private logToConsole(level: LogLevel, message: string) {
    const colors = {
      error: '\x1b[31m', // Red
      warn: '\x1b[33m', // Yellow
      info: '\x1b[36m', // Cyan
      debug: '\x1b[90m', // Gray
    };
    const reset = '\x1b[0m';
    
    const color = colors[level] || '';
    console.log(`${color}${message}${reset}`);
  }

  /**
   * Write to log files
   */
  private logToFile(level: LogLevel, message: string) {
    try {
      // Write all logs to combined.log
      fs.appendFileSync(this.combinedLogPath, message);

      // Write errors to error.log
      if (level === LogLevel.ERROR) {
        fs.appendFileSync(this.errorLogPath, message);
      }
    } catch (err) {
      // If file writing fails, at least log to console
      console.error('Failed to write to log file:', err);
    }
  }

  /**
   * Log HTTP request
   */
  logRequest(req: any, userId?: number) {
    this.log('HTTP Request', 'HTTP', {
      method: req.method,
      url: req.url,
      ip: req.ip,
      userAgent: req.headers['user-agent'],
      userId,
    });
  }

  /**
   * Log HTTP response
   */
  logResponse(req: any, res: any, responseTime: number) {
    this.log('HTTP Response', 'HTTP', {
      method: req.method,
      url: req.url,
      statusCode: res.statusCode,
      responseTime: `${responseTime}ms`,
    });
  }

  /**
   * Log database query
   */
  logQuery(query: string, parameters?: any[], duration?: number) {
    this.debug('Database Query', 'Database', {
      query,
      parameters,
      duration: duration ? `${duration}ms` : undefined,
    });
  }

  /**
   * Log authentication event
   */
  logAuth(event: string, userId?: number, success: boolean = true, details?: any) {
    const level = success ? LogLevel.INFO : LogLevel.WARN;
    this.writeLog(level, `Auth: ${event}`, 'Authentication', {
      userId,
      success,
      ...details,
    });
  }

  /**
   * Log business logic event
   */
  logEvent(event: string, context: string, data?: any) {
    this.log(event, context, data);
  }

  /**
   * Log performance metric
   */
  logPerformance(operation: string, duration: number, context?: string) {
    this.debug(`Performance: ${operation}`, context, {
      duration: `${duration}ms`,
      slow: duration > 1000, // Flag slow operations
    });
  }

  /**
   * Rotate logs (call this periodically via cron)
   */
  rotateLogs() {
    const timestamp = new Date().toISOString().split('T')[0];
    
    try {
      // Archive old logs
      if (fs.existsSync(this.errorLogPath)) {
        fs.renameSync(
          this.errorLogPath,
          path.join(this.logDir, `error-${timestamp}.log`),
        );
      }
      
      if (fs.existsSync(this.combinedLogPath)) {
        fs.renameSync(
          this.combinedLogPath,
          path.join(this.logDir, `combined-${timestamp}.log`),
        );
      }

      this.log('Logs rotated successfully', 'Logger');
    } catch (err) {
      this.error('Failed to rotate logs', err.stack, 'Logger');
    }
  }

  /**
   * Clean up old log files (older than 30 days)
   */
  cleanOldLogs(daysToKeep: number = 30) {
    try {
      const files = fs.readdirSync(this.logDir);
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

      files.forEach(file => {
        const filePath = path.join(this.logDir, file);
        const stats = fs.statSync(filePath);
        
        if (stats.mtime < cutoffDate) {
          fs.unlinkSync(filePath);
          this.log(`Deleted old log file: ${file}`, 'Logger');
        }
      });
    } catch (err) {
      this.error('Failed to clean old logs', err.stack, 'Logger');
    }
  }

  /**
   * Get recent error logs
   */
  getRecentErrors(limit: number = 100): LogEntry[] {
    try {
      if (!fs.existsSync(this.errorLogPath)) {
        return [];
      }

      const content = fs.readFileSync(this.errorLogPath, 'utf-8');
      const lines = content.trim().split('\n').filter(Boolean);
      
      return lines
        .slice(-limit)
        .map(line => JSON.parse(line))
        .reverse();
    } catch (err) {
      console.error('Failed to read error logs:', err);
      return [];
    }
  }

  /**
   * Search logs by criteria
   */
  searchLogs(criteria: {
    level?: LogLevel;
    context?: string;
    startDate?: Date;
    endDate?: Date;
    limit?: number;
  }): LogEntry[] {
    try {
      if (!fs.existsSync(this.combinedLogPath)) {
        return [];
      }

      const content = fs.readFileSync(this.combinedLogPath, 'utf-8');
      const lines = content.trim().split('\n').filter(Boolean);
      
      let logs = lines.map(line => JSON.parse(line) as LogEntry);

      // Apply filters
      if (criteria.level) {
        logs = logs.filter(log => log.level === criteria.level);
      }
      
      if (criteria.context) {
        logs = logs.filter(log => log.context === criteria.context);
      }
      
      if (criteria.startDate) {
        logs = logs.filter(log => new Date(log.timestamp) >= criteria.startDate);
      }
      
      if (criteria.endDate) {
        logs = logs.filter(log => new Date(log.timestamp) <= criteria.endDate);
      }

      // Limit results
      if (criteria.limit) {
        logs = logs.slice(-criteria.limit);
      }

      return logs.reverse();
    } catch (err) {
      console.error('Failed to search logs:', err);
      return [];
    }
  }
}
