# OptiPlatform Production Roadmap

## Overview
This document outlines the remaining tasks to prepare OptiPlatform for production deployment as a multi-tenant, offline-first desktop application.

---

## ✅ Completed (Current State)

### Testing Infrastructure
- ✅ **Backend**: 236 tests, 54% coverage
- ✅ **Frontend**: 298 tests, 23.39% coverage
  - All service tests (99.04% coverage)
  - All API client tests (100% coverage)
  - Login page tests (23 tests)
- ✅ **CI/CD**: GitHub Actions pipeline running all tests
- ✅ **TypeScript**: Full type safety, no compilation errors

### Core Features
- ✅ Authentication & Authorization (JWT, role-based permissions)
- ✅ Inventory Management (products, categories, stock tracking)
- ✅ Advanced Transactions (transfers, adjustments, history)
- ✅ Suppliers Management
- ✅ Purchase Orders
- ✅ Reports & Analytics
- ✅ User Management
- ✅ Error Handling & Logging System
- ✅ Responsive UI with Material Design

---

## 🚧 Phase 1: Multi-Tenancy & Deployment (High Priority)

### 1.1 Multi-Tenant Architecture

**Problem**: Each business needs their own isolated instance.

**Solutions**:

#### Option A: Self-Hosted Docker Deployment (Recommended for MVP)
```yaml
# docker-compose.yml per customer
version: '3.8'
services:
  postgres:
    image: postgres:15
    environment:
      POSTGRES_DB: optiplatform_${CUSTOMER_ID}
      POSTGRES_USER: ${DB_USER}
      POSTGRES_PASSWORD: ${DB_PASSWORD}
    volumes:
      - ${CUSTOMER_ID}_data:/var/lib/postgresql/data
  
  backend:
    build: ./server
    environment:
      DATABASE_URL: postgresql://${DB_USER}:${DB_PASSWORD}@postgres:5432/optiplatform_${CUSTOMER_ID}
      JWT_SECRET: ${JWT_SECRET}
    depends_on:
      - postgres
  
  frontend:
    build: .
    environment:
      VITE_BACKEND_URL: http://backend:3001
    ports:
      - "${EXTERNAL_PORT}:80"
    depends_on:
      - backend

volumes:
  ${CUSTOMER_ID}_data:
```

**Implementation Tasks**:
- [ ] Create deployment scripts for customer provisioning
- [ ] Build customer onboarding CLI tool
- [ ] Create infrastructure-as-code templates (Terraform/Pulumi)
- [ ] Set up monitoring per instance (Prometheus/Grafana)
- [ ] Create backup/restore scripts

**Files to Create**:
- `deployment/docker-compose.customer.yml`
- `deployment/provision-customer.sh`
- `deployment/terraform/` (infrastructure)
- `deployment/backup.sh`

#### Option B: SaaS Multi-Tenant Database (Future Scale)
```typescript
// Add tenant context to all queries
// server/src/common/tenant.decorator.ts
export const Tenant = createParamDecorator((data, ctx) => {
  const request = ctx.switchToHttp().getRequest();
  return request.user.tenantId; // From JWT
});

// server/src/common/tenant.guard.ts
export class TenantGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const user = request.user;
    const resourceTenantId = request.params.tenantId || request.body.tenantId;
    return user.tenantId === resourceTenantId;
  }
}
```

**Implementation Tasks**:
- [ ] Add `tenantId` to all database tables
- [ ] Implement tenant isolation middleware
- [ ] Add tenant-scoped queries to all resolvers
- [ ] Create tenant provisioning API
- [ ] Implement tenant subdomain routing
- [ ] Add usage tracking per tenant

**Migration Strategy**:
```sql
-- database/migrations/add_tenant_support.sql
ALTER TABLE users ADD COLUMN tenant_id UUID NOT NULL DEFAULT gen_random_uuid();
ALTER TABLE products ADD COLUMN tenant_id UUID NOT NULL DEFAULT gen_random_uuid();
ALTER TABLE categories ADD COLUMN tenant_id UUID NOT NULL DEFAULT gen_random_uuid();
-- ... repeat for all tables

-- Add indexes for tenant queries
CREATE INDEX idx_users_tenant_id ON users(tenant_id);
CREATE INDEX idx_products_tenant_id ON products(tenant_id);
```

### 1.2 Cloud Deployment Options

#### Recommended: Railway.app (Easiest for MVP)
```bash
# Deploy with Railway CLI
npm install -g @railway/cli
railway login
railway init
railway up
```

**Setup**:
- [ ] Create Railway project
- [ ] Configure PostgreSQL addon
- [ ] Set environment variables
- [ ] Configure custom domain
- [ ] Set up deployment webhooks

#### Alternative: Render.com
```yaml
# render.yaml
services:
  - type: web
    name: optiplatform-backend
    env: node
    buildCommand: npm install && npm run build
    startCommand: npm run start:prod
    envVars:
      - key: DATABASE_URL
        fromDatabase:
          name: optiplatform-db
          property: connectionString
  
  - type: web
    name: optiplatform-frontend
    env: static
    buildCommand: npm install && npm run build
    staticPublishPath: ./dist

databases:
  - name: optiplatform-db
    plan: starter
```

#### Enterprise: AWS/Azure/GCP
- [ ] Set up Kubernetes cluster
- [ ] Configure load balancer
- [ ] Set up RDS/CloudSQL for PostgreSQL
- [ ] Configure auto-scaling
- [ ] Set up CDN for static assets

---

## 🔌 Phase 2: Offline-First Implementation (Critical)

### 2.1 Local Database Layer

**Current State**: All data operations go directly to backend API.

**Target**: Local-first with background sync.

#### Technology Stack
```json
{
  "dependencies": {
    "@electric-sql/client": "^0.8.0",
    "pglite": "^0.1.0",
    "dexie": "^3.2.4",
    "workbox-window": "^7.0.0"
  }
}
```

#### Implementation: Electric SQL (Recommended)

**Electric SQL** provides PostgreSQL-compatible local database with automatic sync.

```typescript
// src/db/electric.ts
import { ElectricClient } from '@electric-sql/client';
import { schema } from './schema';

export const electric = await ElectricClient.create({
  url: import.meta.env.VITE_ELECTRIC_URL,
  schema,
});

// Sync shapes (subsets of data)
const { synced } = await electric.sync({
  products: {
    where: { tenantId: currentUser.tenantId },
  },
  categories: true,
  transactions: {
    where: {
      createdAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }, // Last 30 days
    },
  },
});

await synced; // Wait for initial sync
```

**Tasks**:
- [ ] Set up Electric SQL backend service
- [ ] Define data sync shapes (what to sync per user)
- [ ] Create local schema matching server
- [ ] Implement conflict resolution strategies
- [ ] Add sync status indicators in UI
- [ ] Handle sync errors gracefully

**Files to Create**:
- `src/db/electric.ts` - Electric client setup
- `src/db/schema.ts` - Local schema definition
- `src/db/sync.ts` - Sync management
- `src/hooks/useSync.ts` - React hook for sync status
- `src/components/SyncIndicator.tsx` - UI component

#### Alternative: Dexie.js with Custom Sync

```typescript
// src/db/dexie.ts
import Dexie, { Table } from 'dexie';

export interface LocalProduct {
  id: number;
  name: string;
  sku: string;
  quantity: number;
  synced: boolean;
  lastModified: number;
  deleted?: boolean;
}

export class OptiPlatformDB extends Dexie {
  products!: Table<LocalProduct>;
  categories!: Table<LocalCategory>;
  transactions!: Table<LocalTransaction>;
  syncQueue!: Table<SyncOperation>;

  constructor() {
    super('OptiPlatformDB');
    this.version(1).stores({
      products: '++id, sku, synced, lastModified',
      categories: '++id, name, synced',
      transactions: '++id, productId, synced, lastModified',
      syncQueue: '++id, type, timestamp',
    });
  }
}

export const db = new OptiPlatformDB();

// Sync service
export class SyncService {
  private syncInterval: NodeJS.Timeout | null = null;

  async start() {
    this.syncInterval = setInterval(() => this.sync(), 30000); // Every 30s
    await this.sync(); // Initial sync
  }

  async sync() {
    if (!navigator.onLine) return;

    // Pull changes from server
    await this.pullChanges();
    
    // Push local changes to server
    await this.pushChanges();
  }

  private async pullChanges() {
    const lastSync = localStorage.getItem('lastSyncTimestamp');
    const changes = await fetch(`/api/sync?since=${lastSync}`).then(r => r.json());
    
    await db.transaction('rw', [db.products, db.categories], async () => {
      for (const product of changes.products) {
        await db.products.put({ ...product, synced: true });
      }
    });

    localStorage.setItem('lastSyncTimestamp', Date.now().toString());
  }

  private async pushChanges() {
    const unsyncedProducts = await db.products.where('synced').equals(false).toArray();
    
    for (const product of unsyncedProducts) {
      try {
        await fetch('/api/products', {
          method: product.id < 0 ? 'POST' : 'PUT', // Negative IDs = new items
          body: JSON.stringify(product),
        });
        
        await db.products.update(product.id, { synced: true });
      } catch (err) {
        // Will retry on next sync
        console.error('Sync failed for product', product.id, err);
      }
    }
  }

  stop() {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
    }
  }
}

export const syncService = new SyncService();
```

**Tasks**:
- [ ] Implement Dexie database setup
- [ ] Create sync service
- [ ] Add optimistic UI updates
- [ ] Implement conflict resolution
- [ ] Add retry logic for failed syncs
- [ ] Create sync queue for offline operations

**Files to Create**:
- `src/db/dexie.ts` - Database setup
- `src/db/sync.service.ts` - Sync logic
- `src/db/offline.service.ts` - Offline detection
- `src/hooks/useOfflineStatus.ts` - Offline status hook

### 2.2 Service Worker & PWA

```typescript
// src/sw.ts
import { precacheAndRoute } from 'workbox-precaching';
import { registerRoute } from 'workbox-routing';
import { CacheFirst, NetworkFirst } from 'workbox-strategies';

declare let self: ServiceWorkerGlobalScope;

// Precache static assets
precacheAndRoute(self.__WB_MANIFEST);

// Cache API responses with network-first strategy
registerRoute(
  ({ url }) => url.pathname.startsWith('/api/'),
  new NetworkFirst({
    cacheName: 'api-cache',
    networkTimeoutSeconds: 3,
  })
);

// Cache images
registerRoute(
  ({ request }) => request.destination === 'image',
  new CacheFirst({
    cacheName: 'image-cache',
    plugins: [
      {
        cacheWillUpdate: async ({ response }) => {
          return response.status === 200 ? response : null;
        },
      },
    ],
  })
);

// Background sync for offline operations
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-operations') {
    event.waitUntil(syncOfflineOperations());
  }
});

async function syncOfflineOperations() {
  // Trigger sync service
  const clients = await self.clients.matchAll();
  clients.forEach((client) => {
    client.postMessage({ type: 'SYNC_NOW' });
  });
}
```

**Tasks**:
- [ ] Set up Workbox for service worker
- [ ] Configure caching strategies
- [ ] Implement background sync
- [ ] Add offline page
- [ ] Create PWA manifest
- [ ] Add install prompt

**Files to Create**:
- `src/sw.ts` - Service worker
- `public/manifest.json` - PWA manifest
- `src/pages/Offline.tsx` - Offline fallback page

### 2.3 Update Existing Services

**Modify existing API clients to use local database first**:

```typescript
// src/services/inventoryService.ts (UPDATED)
import { db } from '../db/dexie';
import { syncService } from '../db/sync.service';
import { fetchProducts as fetchProductsAPI } from '../utils/inventoryApi';

export async function fetchProducts(useCache = true): Promise<Product[]> {
  if (useCache) {
    // Try local first
    const localProducts = await db.products.toArray();
    if (localProducts.length > 0) {
      // Return local data immediately
      syncService.sync(); // Trigger background sync
      return localProducts;
    }
  }

  // Fallback to API if no local data
  try {
    const products = await fetchProductsAPI();
    await db.products.bulkPut(products.map(p => ({ ...p, synced: true })));
    return products;
  } catch (err) {
    // If offline, return whatever we have locally
    if (!navigator.onLine) {
      return await db.products.toArray();
    }
    throw err;
  }
}

export async function createProduct(input: CreateProductInput): Promise<Product> {
  const tempId = -Date.now(); // Negative ID for offline items
  const newProduct = {
    ...input,
    id: tempId,
    synced: false,
    lastModified: Date.now(),
  };

  // Save locally first (optimistic update)
  await db.products.add(newProduct);

  if (navigator.onLine) {
    try {
      // Sync to server
      const serverProduct = await createProductAPI(input);
      // Replace temp ID with real ID
      await db.products.delete(tempId);
      await db.products.add({ ...serverProduct, synced: true });
      return serverProduct;
    } catch (err) {
      // Stay with local version, will sync later
      console.error('Failed to sync new product', err);
    }
  }

  return newProduct as Product;
}
```

**Tasks**:
- [ ] Update all service files to use local DB first
- [ ] Add optimistic updates to all mutations
- [ ] Implement rollback for failed syncs
- [ ] Add sync status to UI

**Files to Update**:
- `src/services/inventoryService.ts`
- `src/services/pricingService.ts`
- `src/services/purchaseOrdersService.ts`
- `src/services/suppliersService.ts`
- `src/services/transactionsService.ts`

---

## 🖥️ Phase 3: Desktop App (Tauri)

### 3.1 Current Tauri Setup

**Already Present**:
- ✅ `src-tauri/` directory exists
- ✅ `tauri.conf.json` configuration
- ✅ Rust backend scaffold

### 3.2 Complete Tauri Implementation

```toml
# src-tauri/Cargo.toml (UPDATED)
[package]
name = "optiplatform"
version = "1.0.0"
description = "OptiPlatform Inventory Management"
authors = ["Your Name"]
license = "MIT"
edition = "2021"

[build-dependencies]
tauri-build = { version = "1.5", features = [] }

[dependencies]
tauri = { version = "1.5", features = ["shell-open", "fs-all", "dialog-all", "notification-all"] }
serde = { version = "1.0", features = ["derive"] }
serde_json = "1.0"
tokio = { version = "1", features = ["full"] }
sqlx = { version = "0.7", features = ["runtime-tokio-native-tls", "postgres"] }
```

```json
// src-tauri/tauri.conf.json (UPDATED)
{
  "build": {
    "beforeDevCommand": "npm run dev",
    "beforeBuildCommand": "npm run build",
    "devPath": "http://localhost:5173",
    "distDir": "../dist",
    "withGlobalTauri": true
  },
  "package": {
    "productName": "OptiPlatform",
    "version": "1.0.0"
  },
  "tauri": {
    "allowlist": {
      "all": false,
      "fs": {
        "all": true,
        "scope": ["$APPDATA/*", "$APPDATA/**"]
      },
      "dialog": {
        "all": true
      },
      "notification": {
        "all": true
      },
      "shell": {
        "open": true
      },
      "window": {
        "all": true
      }
    },
    "bundle": {
      "active": true,
      "targets": ["msi", "app", "deb", "appimage"],
      "identifier": "com.optiplatform.app",
      "icon": [
        "icons/32x32.png",
        "icons/128x128.png",
        "icons/128x128@2x.png",
        "icons/icon.icns",
        "icons/icon.ico"
      ],
      "resources": [],
      "externalBin": [],
      "copyright": "Copyright © 2025",
      "category": "Business",
      "shortDescription": "Inventory Management System",
      "longDescription": "Complete inventory management solution with offline capabilities"
    },
    "security": {
      "csp": "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:;"
    },
    "windows": [
      {
        "title": "OptiPlatform",
        "width": 1280,
        "height": 800,
        "minWidth": 800,
        "minHeight": 600,
        "resizable": true,
        "fullscreen": false
      }
    ]
  }
}
```

```rust
// src-tauri/src/main.rs
#![cfg_attr(
    all(not(debug_assertions), target_os = "windows"),
    windows_subsystem = "windows"
)]

use tauri::{Manager, Window};
use std::fs;

#[tauri::command]
async fn export_data(window: Window, data: String, filename: String) -> Result<String, String> {
    let path = window.app_handle()
        .path_resolver()
        .app_data_dir()
        .unwrap()
        .join(&filename);
    
    fs::write(&path, data)
        .map_err(|e| e.to_string())?;
    
    Ok(path.to_string_lossy().to_string())
}

#[tauri::command]
async fn import_data(window: Window, filename: String) -> Result<String, String> {
    let path = window.app_handle()
        .path_resolver()
        .app_data_dir()
        .unwrap()
        .join(&filename);
    
    fs::read_to_string(&path)
        .map_err(|e| e.to_string())
}

#[tauri::command]
fn send_notification(title: String, body: String) {
    tauri::api::notification::Notification::new("com.optiplatform.app")
        .title(&title)
        .body(&body)
        .show()
        .unwrap();
}

fn main() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![
            export_data,
            import_data,
            send_notification
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
```

```typescript
// src/utils/tauri.ts
import { invoke } from '@tauri-apps/api/tauri';
import { save, open } from '@tauri-apps/api/dialog';
import { sendNotification as tauriNotify } from '@tauri-apps/api/notification';

export const isTauri = () => {
  return window.__TAURI__ !== undefined;
};

export async function exportToFile(data: any, defaultFilename: string) {
  if (!isTauri()) {
    // Browser fallback
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = defaultFilename;
    a.click();
    return;
  }

  const path = await save({
    defaultPath: defaultFilename,
    filters: [{ name: 'JSON', extensions: ['json'] }],
  });

  if (path) {
    await invoke('export_data', {
      data: JSON.stringify(data, null, 2),
      filename: path,
    });
  }
}

export async function importFromFile() {
  if (!isTauri()) {
    // Browser fallback
    return new Promise((resolve) => {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = '.json';
      input.onchange = (e: any) => {
        const file = e.target.files[0];
        const reader = new FileReader();
        reader.onload = (event) => resolve(JSON.parse(event.target?.result as string));
        reader.readAsText(file);
      };
      input.click();
    });
  }

  const path = await open({
    filters: [{ name: 'JSON', extensions: ['json'] }],
    multiple: false,
  });

  if (path && typeof path === 'string') {
    const data = await invoke('import_data', { filename: path });
    return JSON.parse(data as string);
  }
}

export async function sendNotification(title: string, body: string) {
  if (isTauri()) {
    await invoke('send_notification', { title, body });
  } else if ('Notification' in window && Notification.permission === 'granted') {
    new Notification(title, { body });
  }
}
```

**Tasks**:
- [ ] Complete Tauri Rust backend
- [ ] Add file system access commands
- [ ] Implement export/import functionality
- [ ] Add system notifications
- [ ] Create app icons (all sizes)
- [ ] Test on Windows, macOS, Linux
- [ ] Set up code signing
- [ ] Create installers for each platform
- [ ] Add auto-updater

**Files to Create/Update**:
- `src-tauri/src/main.rs` - Main Tauri backend
- `src-tauri/src/db.rs` - Local database operations
- `src/utils/tauri.ts` - Tauri API wrapper
- `src-tauri/icons/` - App icons

### 3.3 Build & Distribution

```json
// package.json scripts
{
  "scripts": {
    "tauri:dev": "tauri dev",
    "tauri:build": "tauri build",
    "tauri:build:windows": "tauri build --target x86_64-pc-windows-msvc",
    "tauri:build:mac": "tauri build --target x86_64-apple-darwin",
    "tauri:build:linux": "tauri build --target x86_64-unknown-linux-gnu"
  }
}
```

**Distribution Options**:
1. **Direct Download** - Host installers on website
2. **Windows Store** - Submit MSI to Microsoft Store
3. **Mac App Store** - Submit .app with Apple Developer account
4. **Linux** - Publish to Snap Store, Flathub

**Tasks**:
- [ ] Set up GitHub releases for auto-builds
- [ ] Create update server
- [ ] Implement auto-update check
- [ ] Add crash reporting
- [ ] Create installation guide

---

## 📊 Phase 4: Monitoring & Analytics

### 4.1 Error Tracking

```typescript
// src/utils/errorTracking.ts
import * as Sentry from '@sentry/react';
import { BrowserTracing } from '@sentry/tracing';

export function initErrorTracking() {
  if (import.meta.env.PROD) {
    Sentry.init({
      dsn: import.meta.env.VITE_SENTRY_DSN,
      integrations: [new BrowserTracing()],
      tracesSampleRate: 0.1,
      environment: import.meta.env.MODE,
    });
  }
}

export function captureError(error: Error, context?: any) {
  Sentry.captureException(error, { extra: context });
  logError(error, context); // Existing logger
}
```

**Tasks**:
- [ ] Set up Sentry account
- [ ] Integrate Sentry SDK
- [ ] Add error boundaries
- [ ] Configure source maps upload
- [ ] Set up alerts

### 4.2 Usage Analytics

```typescript
// src/utils/analytics.ts
import posthog from 'posthog-js';

export function initAnalytics() {
  if (import.meta.env.PROD && !isTauri()) {
    posthog.init(import.meta.env.VITE_POSTHOG_KEY, {
      api_host: 'https://app.posthog.com',
      autocapture: false, // Manual tracking only
    });
  }
}

export function trackEvent(eventName: string, properties?: any) {
  if (import.meta.env.PROD && !isTauri()) {
    posthog.capture(eventName, properties);
  }
}

export function identifyUser(userId: number, traits?: any) {
  if (import.meta.env.PROD && !isTauri()) {
    posthog.identify(userId.toString(), traits);
  }
}
```

**Tasks**:
- [ ] Set up PostHog/Mixpanel
- [ ] Add event tracking to key actions
- [ ] Create analytics dashboard
- [ ] Respect privacy settings

---

## 🔒 Phase 5: Security Hardening

### 5.1 Security Checklist

**Backend**:
- [ ] Enable CORS with strict origins
- [ ] Add rate limiting (express-rate-limit)
- [ ] Implement request validation (class-validator)
- [ ] Add SQL injection protection (parameterized queries)
- [ ] Enable HTTPS only
- [ ] Add security headers (helmet)
- [ ] Implement CSRF protection
- [ ] Add audit logging
- [ ] Encrypt sensitive data at rest
- [ ] Regular dependency updates (Dependabot)

**Frontend**:
- [ ] Add Content Security Policy
- [ ] Sanitize user inputs (DOMPurify)
- [ ] Implement XSS protection
- [ ] Secure localStorage (encrypt sensitive data)
- [ ] Add integrity checks for scripts
- [ ] Implement subresource integrity

**Infrastructure**:
- [ ] Regular backups
- [ ] Disaster recovery plan
- [ ] Penetration testing
- [ ] Security audit
- [ ] Compliance check (GDPR, etc.)

---

## 📱 Phase 6: Mobile Support (Future)

### 6.1 Progressive Web App
- [ ] Add to home screen prompt
- [ ] Optimize for mobile viewport
- [ ] Touch-friendly UI
- [ ] Offline support

### 6.2 Native Mobile Apps (Optional)
- React Native version
- Capacitor wrapper

---

## 🚀 Deployment Timeline

### Week 1-2: Offline-First Foundation
- Set up Dexie/Electric SQL
- Implement sync service
- Update existing services
- Test offline scenarios

### Week 3: Multi-Tenancy
- Choose deployment strategy (self-hosted vs SaaS)
- Implement tenant isolation
- Set up customer provisioning

### Week 4: Desktop App
- Complete Tauri implementation
- Test on all platforms
- Create installers

### Week 5-6: Polish & Testing
- Security hardening
- Performance optimization
- User acceptance testing
- Documentation

### Week 7: Production Launch
- Deploy to production
- Monitor metrics
- Gather user feedback

---

## 📝 Next Immediate Steps

1. **Choose Multi-Tenancy Strategy**: Self-hosted Docker or SaaS?
2. **Implement Offline Database**: Start with Dexie for quick MVP
3. **Complete Tauri Setup**: Finish desktop app scaffolding
4. **Set Up Deployment**: Choose cloud provider and configure

**Priority Order**:
1. 🔴 **Critical**: Offline-first implementation (users need to work without internet)
2. 🟠 **High**: Multi-tenancy setup (each business needs isolation)
3. 🟡 **Medium**: Desktop app polish (Tauri refinement)
4. 🟢 **Nice-to-have**: Advanced monitoring, mobile apps

---

## 📚 Resources

- **Electric SQL**: https://electric-sql.com
- **Dexie.js**: https://dexie.org
- **Tauri**: https://tauri.app
- **Railway**: https://railway.app
- **Render**: https://render.com
- **Sentry**: https://sentry.io
- **PostHog**: https://posthog.com

---

**Last Updated**: November 26, 2025
