# Production Logging & Error Tracking Guide

## 📊 Overview

OptiPlatform now has a comprehensive logging and error tracking system for both backend and frontend applications.

## 🎯 What's Implemented

### Backend Logging (NestJS)
- ✅ **Custom Logger Service** - File-based logging with rotation
- ✅ **HTTP Request/Response Logging** - Track all API calls
- ✅ **Error Tracking** - Automatic error capture and stack traces
- ✅ **Performance Monitoring** - Log slow operations
- ✅ **Authentication Events** - Track login/logout/failures
- ✅ **Database Query Logging** - Monitor database performance

### Frontend Logging (React)
- ✅ **Error Boundary** - Catch React component errors
- ✅ **Global Error Handler** - Catch all unhandled errors
- ✅ **API Call Tracking** - Monitor API performance
- ✅ **Local Error Storage** - Store errors in browser for debugging
- ✅ **User Action Tracking** - Track important user interactions

---

## 🚀 How to Use

### Backend Logging

#### 1. Inject Logger Service

```typescript
import { Injectable } from '@nestjs/common';
import { LoggerService } from '../common/logger.service';

@Injectable()
export class MyService {
  constructor(private logger: LoggerService) {}

  async myMethod() {
    this.logger.log('Method called', 'MyService');
    
    try {
      // Your code
      this.logger.logEvent('User created product', 'ProductService', {
        productId: 123,
        userId: 456
      });
    } catch (error) {
      this.logger.error('Failed to create product', error.stack, 'MyService', {
        userId: 456
      });
      throw error;
    }
  }
}
```

#### 2. Log Different Types of Events

```typescript
// Information
this.logger.log('User logged in', 'AuthService', { userId: 123 });

// Warning
this.logger.warn('Low stock detected', 'InventoryService', {
  productId: 456,
  currentStock: 2
});

// Error
this.logger.error(
  'Database connection failed',
  error.stack,
  'Database',
  { host: 'localhost', port: 5432 }
);

// Debug (only in development)
this.logger.debug('Cache hit', 'CacheService', { key: 'user:123' });

// Performance
this.logger.logPerformance('calculateAnalytics', 1500, 'AnalyticsService');

// Authentication
this.logger.logAuth('Login attempt', userId, true, { method: 'password' });

// Database Query
this.logger.logQuery('SELECT * FROM products', [], 45);
```

### Frontend Logging

#### 1. Import Logger Functions

```typescript
import {
  logError,
  logWarning,
  logInfo,
  logUserAction,
  logPerformance,
  trackPageView
} from '../utils/frontendLogger';
```

#### 2. Log Events

```typescript
// Log an error
try {
  await someAsyncOperation();
} catch (error) {
  logError(error, { context: 'ProductCreation', productId: 123 });
}

// Log a warning
if (stock < threshold) {
  logWarning('Low stock warning', { productId, stock, threshold });
}

// Log user action
logUserAction('Product Created', { productId: 123, name: 'Laptop' });

// Track performance
const startTime = Date.now();
await fetchProducts();
const duration = Date.now() - startTime;
logPerformance('fetchProducts', duration);

// Track page view
trackPageView('/dashboard');
```

---

## 📁 Log File Structure

### Backend Logs (server/logs/)

```
logs/
├── combined.log          # All logs
├── error.log            # Errors only
├── combined-2025-10-20.log  # Archived logs
└── error-2025-10-20.log     # Archived error logs
```

### Log Format (JSON)

```json
{
  "timestamp": "2025-10-21T10:30:45.123Z",
  "level": "error",
  "context": "ProductService",
  "message": "Failed to create product",
  "data": {
    "userId": 456,
    "productId": 123
  },
  "stack": "Error: Validation failed\n    at ProductService.create..."
}
```

---

## 🔍 Querying Logs

### GraphQL Queries (Backend)

#### Get Recent Errors

```graphql
query {
  getRecentErrors(limit: 50)
}
```

#### Search Logs

```graphql
query {
  searchLogs(
    level: "error"
    context: "ProductService"
    startDate: "2025-10-20T00:00:00Z"
    endDate: "2025-10-21T23:59:59Z"
    limit: 100
  )
}
```

#### Health Status

```graphql
query {
  getHealthStatus
}
```

Response:
```json
{
  "status": "healthy",
  "timestamp": "2025-10-21T10:30:00Z",
  "recentErrors": 2,
  "uptime": 86400,
  "memory": {
    "rss": 123456789,
    "heapTotal": 98765432,
    "heapUsed": 87654321
  },
  "version": "0.1.0"
}
```

### Frontend Logs (Browser)

```typescript
import { frontendLogger } from './utils/frontendLogger';

// Get all local logs
const logs = frontendLogger.getLocalLogs();
console.log(logs);

// Clear local logs
frontendLogger.clearLocalLogs();
```

---

## 🔧 Configuration

### Environment Variables

```env
# Backend
NODE_ENV=production  # Disables console logging
LOG_LEVEL=info       # Minimum log level (debug, info, warn, error)

# Frontend
VITE_LOG_LEVEL=error  # Only log errors in production
VITE_ENABLE_TRACKING=true  # Enable error tracking
```

### Log Rotation

Logs are automatically rotated and old files are cleaned up.

```typescript
// Manual rotation (or set up cron job)
import { LoggerService } from './common/logger.service';

// Rotate logs
logger.rotateLogs();

// Clean logs older than 30 days
logger.cleanOldLogs(30);
```

---

## 📊 Production Best Practices

### 1. Set Up Automated Log Rotation

Add to your server cron jobs:

```bash
# Rotate logs daily at midnight
0 0 * * * cd /app && npm run rotate-logs

# Clean old logs weekly
0 0 * * 0 cd /app && npm run clean-logs
```

Add scripts to `package.json`:

```json
{
  "scripts": {
    "rotate-logs": "ts-node src/scripts/rotate-logs.ts",
    "clean-logs": "ts-node src/scripts/clean-logs.ts"
  }
}
```

### 2. Monitor Critical Errors

Set up alerts for critical errors:

```typescript
// In your logging service
if (level === LogLevel.ERROR) {
  // Send email alert
  await emailService.send({
    to: 'admin@company.com',
    subject: `Critical Error: ${message}`,
    body: JSON.stringify(logEntry, null, 2)
  });
  
  // Or send to Slack
  await slackService.send({
    channel: '#alerts',
    text: `🚨 Critical Error: ${message}`
  });
}
```

### 3. Use Log Aggregation Services

For production at scale, integrate with:

#### Option A: CloudWatch (AWS)
```typescript
import * as AWS from 'aws-sdk';

const cloudwatch = new AWS.CloudWatchLogs({
  region: 'us-east-1'
});

// Send logs to CloudWatch
await cloudwatch.putLogEvents({
  logGroupName: '/optiplatform/backend',
  logStreamName: 'production',
  logEvents: [{
    timestamp: Date.now(),
    message: JSON.stringify(logEntry)
  }]
}).promise();
```

#### Option B: Sentry (Error Tracking)
```bash
npm install @sentry/node @sentry/react
```

```typescript
// Backend
import * as Sentry from '@sentry/node';

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
});

// Frontend
import * as Sentry from '@sentry/react';

Sentry.init({
  dsn: process.env.VITE_SENTRY_DSN,
  environment: import.meta.env.MODE,
});
```

#### Option C: LogRocket (Session Replay)
```bash
npm install logrocket
```

```typescript
import LogRocket from 'logrocket';

LogRocket.init('your-app-id');
LogRocket.identify(userId, {
  name: userName,
  email: userEmail
});
```

### 4. Performance Monitoring

```typescript
// Track slow operations
const start = Date.now();
const result = await expensiveOperation();
const duration = Date.now() - start;

logger.logPerformance('expensiveOperation', duration);

// Alert if too slow
if (duration > 5000) {
  logger.warn('Slow operation detected', 'Performance', {
    operation: 'expensiveOperation',
    duration,
    threshold: 5000
  });
}
```

---

## 🎨 Viewing Logs in Production

### Option 1: GraphQL Playground (Simple)

Visit: `https://your-backend.onrender.com/graphql`

```graphql
query {
  getRecentErrors(limit: 100)
  getHealthStatus
}
```

### Option 2: Create Admin Dashboard

```tsx
// src/pages/AdminLogs.tsx
import { useState, useEffect } from 'react';
import { graphql } from '../utils/inventoryApi';

export default function AdminLogs() {
  const [logs, setLogs] = useState([]);
  
  useEffect(() => {
    loadLogs();
  }, []);
  
  async function loadLogs() {
    const query = `query { getRecentErrors(limit: 100) }`;
    const response = await graphql(query);
    setLogs(JSON.parse(response.getRecentErrors));
  }
  
  return (
    <div className="admin-logs">
      <h1>Error Logs</h1>
      {logs.map(log => (
        <div key={log.timestamp} className="log-entry">
          <div className="log-header">
            <span className={`log-level ${log.level}`}>{log.level}</span>
            <span className="log-time">{new Date(log.timestamp).toLocaleString()}</span>
          </div>
          <div className="log-message">{log.message}</div>
          {log.stack && (
            <details>
              <summary>Stack Trace</summary>
              <pre>{log.stack}</pre>
            </details>
          )}
        </div>
      ))}
    </div>
  );
}
```

### Option 3: SSH into Server

```bash
# SSH into your server
ssh user@your-server

# View logs
tail -f /app/logs/combined.log
tail -f /app/logs/error.log

# Search logs
grep "error" /app/logs/combined.log
grep -A 5 "ProductService" /app/logs/combined.log
```

---

## 📈 Monitoring Checklist

### Daily
- [ ] Check error count in last 24 hours
- [ ] Review critical errors
- [ ] Monitor API response times

### Weekly
- [ ] Review all warnings
- [ ] Check log file sizes
- [ ] Analyze error patterns
- [ ] Update alert thresholds

### Monthly
- [ ] Clean old logs
- [ ] Review performance metrics
- [ ] Update logging strategy
- [ ] Team review of common errors

---

## 🐛 Debugging Tips

### Finding Specific Errors

```typescript
// Search for errors related to a specific user
const logs = logger.searchLogs({
  level: LogLevel.ERROR,
  context: 'UserService'
});

// Find slow operations
const slowOps = logger.searchLogs({
  context: 'Performance'
}).filter(log => log.data?.slow === true);
```

### Correlating Frontend/Backend Errors

Add request IDs:

```typescript
// Backend: Add request ID
import { v4 as uuidv4 } from 'uuid';

app.use((req, res, next) => {
  req.id = uuidv4();
  res.setHeader('X-Request-ID', req.id);
  next();
});

// Log with request ID
logger.log('Request received', 'HTTP', { requestId: req.id });

// Frontend: Include in error logs
logError(error, { requestId: response.headers.get('X-Request-ID') });
```

---

## 🎯 Key Metrics to Track

1. **Error Rate**: Errors per hour/day
2. **Response Time**: Average API response time
3. **Slow Operations**: Operations >1000ms
4. **Error Patterns**: Most common error types
5. **User Impact**: Errors per user session
6. **Recovery Time**: Time to fix critical errors

---

## 🚀 Next Steps

1. ✅ Logging system implemented
2. ⏳ Set up log rotation cron job
3. ⏳ Configure production alerts (email/Slack)
4. ⏳ Create admin logs dashboard
5. ⏳ Consider Sentry/LogRocket for advanced tracking
6. ⏳ Set up performance monitoring
7. ⏳ Train team on log analysis

---

## 📚 Additional Resources

- [NestJS Logging](https://docs.nestjs.com/techniques/logger)
- [Winston Logger](https://github.com/winstonjs/winston)
- [Sentry Documentation](https://docs.sentry.io/)
- [LogRocket](https://logrocket.com/)
- [CloudWatch Logs](https://aws.amazon.com/cloudwatch/)

---

**Remember**: Good logging is essential for production applications. Monitor logs regularly and act on patterns you see!
