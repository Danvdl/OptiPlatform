// Sync Service for Offline-First Architecture
import { db, SyncOperation } from './dexie';
import { isOnline, subscribeToNetworkStatus, waitForOnline } from './offline.service';
import { getToken } from '../utils/authStore';
import { logError } from '../utils/frontendLogger';

export interface SyncStatus {
  syncing: boolean;
  lastSyncTime: number | null;
  pendingOperations: number;
  failedOperations: number;
  error: string | null;
}

class SyncService {
  private syncInterval: NodeJS.Timeout | null = null;
  private syncing = false;
  private listeners = new Set<(status: SyncStatus) => void>();
  private status: SyncStatus = {
    syncing: false,
    lastSyncTime: null,
    pendingOperations: 0,
    failedOperations: 0,
    error: null,
  };

  constructor() {
    // Subscribe to network changes
    subscribeToNetworkStatus((networkStatus) => {
      if (networkStatus.online && !this.syncing) {
        // When coming back online, sync immediately
        this.sync().catch(console.error);
      }
    });
  }

  // Start periodic sync
  start(intervalMs = 30000) {
    if (this.syncInterval) {
      return;
    }

    console.log('[Sync] Starting sync service, interval:', intervalMs, 'ms');
    
    // Initial sync
    this.sync().catch(console.error);

    // Periodic sync
    this.syncInterval = setInterval(() => {
      this.sync().catch(console.error);
    }, intervalMs);
  }

  // Stop periodic sync
  stop() {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
      console.log('[Sync] Stopped sync service');
    }
  }

  // Main sync function
  async sync(): Promise<void> {
    if (this.syncing) {
      console.log('[Sync] Already syncing, skipping');
      return;
    }

    if (!isOnline()) {
      console.log('[Sync] Offline, skipping sync');
      return;
    }

    this.syncing = true;
    this.updateStatus({ syncing: true, error: null });

    try {
      // Step 1: Pull changes from server
      await this.pullChanges();

      // Step 2: Push local changes to server
      await this.pushChanges();

      // Step 3: Update status
      const pendingOps = await db.syncQueue.count();
      const failedOps = await db.syncQueue.where('retryCount').above(0).count();

      this.updateStatus({
        syncing: false,
        lastSyncTime: Date.now(),
        pendingOperations: pendingOps,
        failedOperations: failedOps,
        error: null,
      });

      console.log('[Sync] Completed successfully');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown sync error';
      this.updateStatus({
        syncing: false,
        error: errorMessage,
      });
      logError(error instanceof Error ? error : new Error(errorMessage), { context: 'sync' });
      console.error('[Sync] Failed:', error);
    } finally {
      this.syncing = false;
    }
  }

  // Pull changes from server
  private async pullChanges(): Promise<void> {
    const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001';
    const token = await getToken();

    if (!token) {
      console.log('[Sync] No token, skipping pull');
      return;
    }

    const headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    };

    // Get last sync times for each entity
    const lastSyncTimes = {
      products: await db.getLastSyncTime('products'),
      categories: await db.getLastSyncTime('categories'),
      transactions: await db.getLastSyncTime('transactions'),
      suppliers: await db.getLastSyncTime('suppliers'),
      purchaseOrders: await db.getLastSyncTime('purchaseOrders'),
    };

    // Pull products
    if (await this.shouldPull('products', lastSyncTimes.products)) {
      const query = `
        query GetProducts($since: String) {
          products(since: $since) {
            id name description sku categoryId quantity restockThreshold price cost updatedAt
          }
        }
      `;
      
      const response = await fetch(`${backendUrl}/graphql`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ 
          query, 
          variables: { since: lastSyncTimes.products ? new Date(lastSyncTimes.products).toISOString() : null }
        }),
      });

      if (!response.ok) {
        console.warn('[Sync] Products pull failed:', response.status, response.statusText);
        // Continue with other sync operations instead of failing completely
        return;
      }

      const result = await response.json();
      
      if (result.errors) {
        console.warn('[Sync] GraphQL errors during products pull:', result.errors);
        // Skip this sync if backend doesn't support the query
        return;
      }
      
      const { data } = result;
      if (data?.products) {
        await db.transaction('rw', db.products, async () => {
          for (const product of data.products) {
            await db.products.put({
              ...product,
              tenantId: 'current', // Will be replaced with actual tenant context
              synced: true,
              lastModified: new Date(product.updatedAt).getTime(),
              deleted: false,
            });
          }
        });
        await db.setLastSyncTime('products', Date.now());
        console.log('[Sync] Pulled', data.products.length, 'products');
      }
    }

    // Similar pull logic for other entities (categories, suppliers, etc.)
    // TODO: Implement pull for other entities
  }

  // Push local changes to server
  private async pushChanges(): Promise<void> {
    const pendingOps = await db.getPendingSyncOperations();
    
    if (pendingOps.length === 0) {
      return;
    }

    console.log('[Sync] Pushing', pendingOps.length, 'operations');

    for (const op of pendingOps) {
      try {
        await this.executeSyncOperation(op);
        await db.removeFromSyncQueue(op.id!);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        await db.incrementRetryCount(op.id!, errorMessage);
        console.error('[Sync] Failed to push operation:', op, error);
      }
    }
  }

  // Execute a single sync operation
  private async executeSyncOperation(op: SyncOperation): Promise<void> {
    const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001';
    const token = await getToken();

    if (!token) {
      throw new Error('No authentication token');
    }

    const headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    };

    let mutation = '';
    let variables: any = {};

    switch (op.entityType) {
      case 'product':
        if (op.operation === 'create') {
          mutation = `
            mutation CreateProduct($input: CreateProductInput!) {
              createProduct(input: $input) { id }
            }
          `;
          variables = { input: op.data };
        } else if (op.operation === 'update') {
          mutation = `
            mutation UpdateProduct($id: Int!, $input: UpdateProductInput!) {
              updateProduct(id: $id, input: $input) { id }
            }
          `;
          variables = { id: op.entityId, input: op.data };
        } else if (op.operation === 'delete') {
          mutation = `
            mutation DeleteProduct($id: Int!) {
              deleteProduct(id: $id)
            }
          `;
          variables = { id: op.entityId };
        }
        break;

      // TODO: Add cases for other entity types
    }

    if (mutation) {
      const response = await fetch(`${backendUrl}/graphql`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ query: mutation, variables }),
      });

      const result = await response.json();
      
      if (result.errors) {
        throw new Error(result.errors[0].message);
      }

      // If create operation, update local ID with server ID
      if (op.operation === 'create' && result.data) {
        const serverEntity = Object.values(result.data)[0] as any;
        if (serverEntity?.id) {
          // Update local record with server ID
          // This requires additional logic in the specific entity tables
        }
      }
    }
  }

  // Check if we should pull data for an entity type
  private async shouldPull(entityType: string, lastSync: number | null): Promise<boolean> {
    if (!lastSync) {
      return true; // Never synced before
    }

    const hoursSinceSync = (Date.now() - lastSync) / (1000 * 60 * 60);
    return hoursSinceSync > 1; // Sync if more than 1 hour old
  }

  // Force immediate sync
  async forceSyncNow(): Promise<void> {
    if (!isOnline()) {
      await waitForOnline(10000); // Wait up to 10 seconds
    }
    return this.sync();
  }

  // Get current sync status
  getStatus(): SyncStatus {
    return { ...this.status };
  }

  // Subscribe to status changes
  subscribe(listener: (status: SyncStatus) => void): () => void {
    this.listeners.add(listener);
    listener(this.status); // Immediate call
    
    return () => {
      this.listeners.delete(listener);
    };
  }

  // Update status and notify listeners
  private updateStatus(updates: Partial<SyncStatus>) {
    this.status = { ...this.status, ...updates };
    this.listeners.forEach(listener => listener(this.status));
  }
}

// Singleton instance
export const syncService = new SyncService();

// React hook for sync status
import { useEffect, useState } from 'react';

export function useSyncStatus(): SyncStatus {
  const [status, setStatus] = useState<SyncStatus>(syncService.getStatus());

  useEffect(() => {
    return syncService.subscribe(setStatus);
  }, []);

  return status;
}

// Export convenience functions
export function startSync(intervalMs?: number) {
  syncService.start(intervalMs);
}

export function stopSync() {
  syncService.stop();
}

export function forceSync() {
  return syncService.forceSyncNow();
}
