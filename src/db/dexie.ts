// Dexie Database Setup for Offline-First Architecture
import Dexie, { Table } from 'dexie';

// Local database interfaces matching server types
export interface LocalProduct {
  id: number;
  tenantId: string;
  name: string;
  description?: string;
  sku: string;
  categoryId?: number;
  quantity: number;
  restockThreshold: number;
  price?: number;
  cost?: number;
  // Sync metadata
  synced: boolean;
  lastModified: number;
  deleted?: boolean;
  serverVersion?: number;
}

export interface LocalCategory {
  id: number;
  tenantId: string;
  name: string;
  description?: string;
  // Sync metadata
  synced: boolean;
  lastModified: number;
  deleted?: boolean;
}

export interface LocalTransaction {
  id: number;
  tenantId: string;
  productId: number;
  transactionType: string;
  quantity: number;
  fromLocationId?: number;
  toLocationId?: number;
  referenceTransactionId?: number;
  notes?: string;
  createdAt: string;
  // Sync metadata
  synced: boolean;
  lastModified: number;
  deleted?: boolean;
}

export interface LocalSupplier {
  id: number;
  tenantId: string;
  name: string;
  contactPerson?: string;
  email?: string;
  phone?: string;
  address?: string;
  supplierType?: string;
  status?: string;
  // Sync metadata
  synced: boolean;
  lastModified: number;
  deleted?: boolean;
}

export interface LocalPurchaseOrder {
  id: number;
  tenantId: string;
  supplierId: number;
  orderDate: string;
  expectedDeliveryDate?: string;
  status: string;
  priority?: string;
  totalAmount?: number;
  notes?: string;
  // Sync metadata
  synced: boolean;
  lastModified: number;
  deleted?: boolean;
}

export interface LocalUser {
  id: number;
  tenantId: string;
  username: string;
  email: string;
  firstName?: string;
  lastName?: string;
  role: string;
  status: string;
  tenantRole?: string;
  // Sync metadata (users always pulled from server)
  lastModified: number;
}

export interface SyncOperation {
  id?: number;
  entityType: 'product' | 'category' | 'transaction' | 'supplier' | 'purchaseOrder';
  entityId: number;
  operation: 'create' | 'update' | 'delete';
  data: any;
  timestamp: number;
  retryCount: number;
  error?: string;
}

export interface SyncMetadata {
  id?: number;
  key: string; // e.g., 'lastSync:products', 'lastSync:categories'
  value: string;
  timestamp: number;
}

// Dexie Database Class
export class OptiPlatformDB extends Dexie {
  // Tables
  products!: Table<LocalProduct, number>;
  categories!: Table<LocalCategory, number>;
  transactions!: Table<LocalTransaction, number>;
  suppliers!: Table<LocalSupplier, number>;
  purchaseOrders!: Table<LocalPurchaseOrder, number>;
  users!: Table<LocalUser, number>;
  syncQueue!: Table<SyncOperation, number>;
  syncMetadata!: Table<SyncMetadata, number>;

  constructor() {
    super('OptiPlatformDB');
    
    this.version(1).stores({
      products: '++id, tenantId, sku, synced, lastModified, deleted, [tenantId+deleted]',
      categories: '++id, tenantId, name, synced, lastModified, deleted, [tenantId+deleted]',
      transactions: '++id, tenantId, productId, synced, lastModified, deleted, [tenantId+deleted]',
      suppliers: '++id, tenantId, name, synced, lastModified, deleted, [tenantId+deleted]',
      purchaseOrders: '++id, tenantId, supplierId, status, synced, lastModified, deleted, [tenantId+deleted]',
      users: '++id, tenantId, username, email, lastModified',
      syncQueue: '++id, entityType, timestamp, retryCount',
      syncMetadata: '++id, key, timestamp',
    });
  }

  // Helper: Clear all data for tenant switch
  async clearAllData() {
    await this.transaction('rw', 
      [this.products, this.categories, this.transactions, this.suppliers, this.purchaseOrders, this.users, this.syncQueue, this.syncMetadata],
      async () => {
        await this.products.clear();
        await this.categories.clear();
        await this.transactions.clear();
        await this.suppliers.clear();
        await this.purchaseOrders.clear();
        await this.users.clear();
        await this.syncQueue.clear();
        await this.syncMetadata.clear();
      }
    );
  }

  // Helper: Get unsynced items
  async getUnsyncedItems<T extends { synced: boolean }>(table: Table<T, number>): Promise<T[]> {
    return await table.where('synced').equals(0 as any).toArray();
  }

  // Helper: Mark items as synced
  async markAsSynced<T extends { id?: number }>(
    table: Table<T, number>,
    ids: number[]
  ): Promise<void> {
    await table.bulkUpdate(
      ids.map(id => ({
        key: id,
        changes: { synced: true } as any,
      }))
    );
  }

  // Helper: Get last sync time for entity type
  async getLastSyncTime(entityType: string): Promise<number | null> {
    const metadata = await this.syncMetadata.where('key').equals(`lastSync:${entityType}`).first();
    return metadata ? parseInt(metadata.value) : null;
  }

  // Helper: Update last sync time
  async setLastSyncTime(entityType: string, timestamp: number): Promise<void> {
    await this.syncMetadata.put({
      key: `lastSync:${entityType}`,
      value: timestamp.toString(),
      timestamp: Date.now(),
    });
  }

  // Helper: Add to sync queue
  async addToSyncQueue(
    entityType: SyncOperation['entityType'],
    entityId: number,
    operation: SyncOperation['operation'],
    data: any
  ): Promise<void> {
    await this.syncQueue.add({
      entityType,
      entityId,
      operation,
      data,
      timestamp: Date.now(),
      retryCount: 0,
    });
  }

  // Helper: Get pending sync operations
  async getPendingSyncOperations(): Promise<SyncOperation[]> {
    return await this.syncQueue
      .orderBy('timestamp')
      .filter(op => op.retryCount < 5) // Max 5 retries
      .toArray();
  }

  // Helper: Remove from sync queue
  async removeFromSyncQueue(id: number): Promise<void> {
    await this.syncQueue.delete(id);
  }

  // Helper: Increment retry count
  async incrementRetryCount(id: number, error: string): Promise<void> {
    const operation = await this.syncQueue.get(id);
    if (operation) {
      await this.syncQueue.update(id, {
        retryCount: operation.retryCount + 1,
        error,
      });
    }
  }
}

// Singleton instance
export const db = new OptiPlatformDB();

// Initialize database
export async function initializeDatabase(): Promise<void> {
  try {
    await db.open();
    console.log('[DB] Database initialized successfully');
  } catch (error) {
    console.error('[DB] Failed to initialize database:', error);
    throw error;
  }
}

// Export convenience functions
export async function clearDatabase(): Promise<void> {
  await db.clearAllData();
  console.log('[DB] Database cleared');
}

export function getDatabaseStats() {
  return {
    name: db.name,
    version: db.verno,
    isOpen: db.isOpen(),
  };
}
