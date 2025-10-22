/**
 * Frontend Error Tracking Service
 * 
 * This service captures and logs errors from the frontend application.
 * Errors are stored locally and can be sent to the backend for analysis.
 */

interface ErrorLog {
  id: string;
  timestamp: string;
  message: string;
  stack?: string;
  componentStack?: string;
  url: string;
  userAgent: string;
  userId?: number;
  severity: 'low' | 'medium' | 'high' | 'critical';
  context?: Record<string, any>;
}

class FrontendLogger {
  private maxLocalLogs = 100;
  private logKey = 'optiplatform_error_logs';
  private backendUrl = import.meta.env.VITE_BACKEND_URL;

  /**
   * Log an error
   */
  logError(
    error: Error,
    severity: 'low' | 'medium' | 'high' | 'critical' = 'medium',
    context?: Record<string, any>
  ) {
    const errorLog: ErrorLog = {
      id: this.generateId(),
      timestamp: new Date().toISOString(),
      message: error.message,
      stack: error.stack,
      url: window.location.href,
      userAgent: navigator.userAgent,
      severity,
      context,
    };

    // Log to console in development
    if (import.meta.env.DEV) {
      console.error('[Error Logger]', errorLog);
    }

    // Save to local storage
    this.saveToLocal(errorLog);

    // Send to backend (async, don't block)
    this.sendToBackend(errorLog).catch(err => {
      console.warn('Failed to send error to backend:', err);
    });
  }

  /**
   * Log an info message
   */
  logInfo(message: string, context?: Record<string, any>) {
    if (import.meta.env.DEV) {
      console.log('[Info]', message, context);
    }

    // Could also send important info logs to backend
  }

  /**
   * Log a warning
   */
  logWarning(message: string, context?: Record<string, any>) {
    console.warn('[Warning]', message, context);
    
    // Could track warnings for analysis
  }

  /**
   * Log user action for analytics
   */
  logUserAction(action: string, details?: Record<string, any>) {
    if (import.meta.env.DEV) {
      console.log('[User Action]', action, details);
    }

    // Track user behavior for UX improvements
  }

  /**
   * Log performance metric
   */
  logPerformance(metric: string, duration: number, context?: Record<string, any>) {
    if (import.meta.env.DEV) {
      console.log(`[Performance] ${metric}: ${duration}ms`, context);
    }

    // Track slow operations
    if (duration > 1000) {
      this.logWarning(`Slow operation: ${metric}`, { duration, ...context });
    }
  }

  /**
   * Get local error logs
   */
  getLocalLogs(): ErrorLog[] {
    try {
      const logsJson = localStorage.getItem(this.logKey);
      return logsJson ? JSON.parse(logsJson) : [];
    } catch (err) {
      console.error('Failed to read local logs:', err);
      return [];
    }
  }

  /**
   * Clear local logs
   */
  clearLocalLogs() {
    localStorage.removeItem(this.logKey);
  }

  /**
   * Save error to local storage
   */
  private saveToLocal(errorLog: ErrorLog) {
    try {
      const logs = this.getLocalLogs();
      logs.push(errorLog);

      // Keep only the most recent logs
      if (logs.length > this.maxLocalLogs) {
        logs.splice(0, logs.length - this.maxLocalLogs);
      }

      localStorage.setItem(this.logKey, JSON.stringify(logs));
    } catch (err) {
      console.error('Failed to save error to local storage:', err);
    }
  }

  /**
   * Send error to backend
   */
  private async sendToBackend(errorLog: ErrorLog) {
    try {
      // You could create a dedicated error logging endpoint
      // For now, we'll skip this if no backend URL
      if (!this.backendUrl) {
        return;
      }

      // Optional: Send to backend logging endpoint
      // await fetch(`${this.backendUrl}/api/errors`, {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(errorLog),
      // });
    } catch (err) {
      // Silently fail - don't want error logging to cause more errors
      console.warn('Failed to send error to backend:', err);
    }
  }

  /**
   * Generate unique ID
   */
  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Track page view
   */
  trackPageView(page: string) {
    if (import.meta.env.DEV) {
      console.log('[Page View]', page);
    }
  }

  /**
   * Track API call
   */
  trackApiCall(endpoint: string, method: string, duration: number, success: boolean) {
    if (!success) {
      this.logWarning(`API call failed: ${method} ${endpoint}`, { duration });
    } else if (duration > 3000) {
      this.logWarning(`Slow API call: ${method} ${endpoint}`, { duration });
    }
  }
}

// Export singleton instance
export const frontendLogger = new FrontendLogger();

// Global error handler
window.addEventListener('error', (event) => {
  frontendLogger.logError(
    new Error(event.message),
    'high',
    {
      filename: event.filename,
      lineno: event.lineno,
      colno: event.colno,
    }
  );
});

// Unhandled promise rejection handler
window.addEventListener('unhandledrejection', (event) => {
  frontendLogger.logError(
    event.reason instanceof Error ? event.reason : new Error(String(event.reason)),
    'critical',
    { type: 'unhandledRejection' }
  );
});

// Export helper functions
export function logError(error: Error, context?: Record<string, any>) {
  frontendLogger.logError(error, 'medium', context);
}

export function logWarning(message: string, context?: Record<string, any>) {
  frontendLogger.logWarning(message, context);
}

export function logInfo(message: string, context?: Record<string, any>) {
  frontendLogger.logInfo(message, context);
}

export function logUserAction(action: string, details?: Record<string, any>) {
  frontendLogger.logUserAction(action, details);
}

export function logPerformance(metric: string, duration: number, context?: Record<string, any>) {
  frontendLogger.logPerformance(metric, duration, context);
}

export function trackPageView(page: string) {
  frontendLogger.trackPageView(page);
}

export function trackApiCall(endpoint: string, method: string, duration: number, success: boolean) {
  frontendLogger.trackApiCall(endpoint, method, duration, success);
}
