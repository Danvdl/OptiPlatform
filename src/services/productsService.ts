// Products Service - Local-First Implementation
import { db, LocalProduct } from '../db/dexie';
import { syncService } from '../db/sync.service';
import { isOnline } from '../db/offline.service';
import { getToken } from '../utils/authStore';
import { logError } from '../utils/frontendLogger';

export interface Product {
  id: number;
  name: string;
  description?: string;
  sku: string;
  categoryId?: number;
  quantity: number;
  restockThreshold?: number;
  price?: number;
  cost?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateProductInput {
  name: string;
  description?: string;
  sku: string;
  categoryId?: number;
  quantity: number;
  restockThreshold?: number;
  price?: number;
  cost?: number;
}

export interface UpdateProductInput {
  id: number;
  name?: string;
  description?: string;
  sku?: string;
  categoryId?: number;
  quantity?: number;
  restockThreshold?: number;
  price?: number;
  cost?: number;
}

// Get current tenant ID from auth context
// TODO: Extract from JWT or global state
function getCurrentTenantId(): string {
  return 'current'; // Placeholder until tenant context is implemented
}

/**
 * Fetch all products (local-first)
 * Returns local data immediately, then syncs in background
 */
export async function fetchProducts(): Promise<Product[]> {
  const tenantId = getCurrentTenantId();

  // 1. Return local data immediately
  const localProducts = await db.products
    .where('[tenantId+deleted]')
    .equals([tenantId, undefined] as any)
    .toArray();

  // 2. Trigger background sync if online
  if (isOnline()) {
    syncService.sync().catch(err => {
      logError(err, { context: 'fetchProducts background sync' });
    });
  }

  // 3. Convert local format to API format
  return localProducts.map(localToProduct);
}

/**
 * Fetch a single product by ID (local-first)
 */
export async function fetchProduct(id: number): Promise<Product | null> {
  const tenantId = getCurrentTenantId();

  // Check local database first
  const localProduct = await db.products
    .where('[tenantId+deleted]')
    .equals([tenantId, undefined] as any)
    .and(p => p.id === id)
    .first();

  if (localProduct) {
    return localToProduct(localProduct);
  }

  // If not found locally and online, try fetching from server
  if (isOnline()) {
    try {
      const serverProduct = await fetchProductFromServer(id);
      if (serverProduct) {
        // Save to local database
        await saveProductLocally(serverProduct);
        return serverProduct;
      }
    } catch (error) {
      logError(error instanceof Error ? error : new Error('Failed to fetch product'), { 
        context: 'fetchProduct from server',
        productId: id,
      });
    }
  }

  return null;
}

/**
 * Create a new product (optimistic update)
 */
export async function createProduct(input: CreateProductInput): Promise<Product> {
  const tenantId = getCurrentTenantId();
  
  // 1. Create with temporary negative ID (will be replaced by server ID)
  const tempId = -Date.now();
  const now = Date.now();

  const newProduct: LocalProduct = {
    id: tempId,
    tenantId,
    name: input.name,
    description: input.description || '',
    sku: input.sku,
    categoryId: input.categoryId,
    quantity: input.quantity,
    restockThreshold: input.restockThreshold ?? 0,
    price: input.price,
    cost: input.cost,
    synced: false,
    lastModified: now,
    deleted: false,
  };

  // 2. Save locally (optimistic update)
  await db.products.add(newProduct);

  // 3. Queue for sync
  await db.addToSyncQueue('product', tempId, 'create', input);

  // 4. Trigger sync if online
  if (isOnline()) {
    syncService.sync().catch(err => {
      logError(err, { context: 'createProduct sync' });
    });
  }

  return localToProduct(newProduct);
}

/**
 * Update an existing product (optimistic update)
 */
export async function updateProduct(input: UpdateProductInput): Promise<Product | null> {
  const tenantId = getCurrentTenantId();

  // 1. Find existing product
  const existing = await db.products.get(input.id);
  
  if (!existing || existing.tenantId !== tenantId) {
    throw new Error('Product not found or access denied');
  }

  // 2. Update locally (optimistic update)
  const updates: Partial<LocalProduct> = {
    ...input,
    synced: false,
    lastModified: Date.now(),
  };

  await db.products.update(input.id, updates);

  // 3. Queue for sync
  await db.addToSyncQueue('product', input.id, 'update', input);

  // 4. Trigger sync if online
  if (isOnline()) {
    syncService.sync().catch(err => {
      logError(err, { context: 'updateProduct sync' });
    });
  }

  // 5. Return updated product
  const updated = await db.products.get(input.id);
  return updated ? localToProduct(updated) : null;
}

/**
 * Delete a product (soft delete + optimistic update)
 */
export async function deleteProduct(id: number): Promise<boolean> {
  const tenantId = getCurrentTenantId();

  // 1. Find existing product
  const existing = await db.products.get(id);
  
  if (!existing || existing.tenantId !== tenantId) {
    throw new Error('Product not found or access denied');
  }

  // 2. Soft delete locally
  await db.products.update(id, {
    deleted: true,
    synced: false,
    lastModified: Date.now(),
  });

  // 3. Queue for sync
  await db.addToSyncQueue('product', id, 'delete', { id });

  // 4. Trigger sync if online
  if (isOnline()) {
    syncService.sync().catch(err => {
      logError(err, { context: 'deleteProduct sync' });
    });
  }

  return true;
}

/**
 * Search products by name or SKU (local-first)
 */
export async function searchProducts(query: string): Promise<Product[]> {
  const tenantId = getCurrentTenantId();
  const lowerQuery = query.toLowerCase();

  const results = await db.products
    .where('[tenantId+deleted]')
    .equals([tenantId, undefined] as any)
    .filter(p => 
      p.name.toLowerCase().includes(lowerQuery) ||
      p.sku.toLowerCase().includes(lowerQuery)
    )
    .toArray();

  return results.map(localToProduct);
}

/**
 * Get low stock products (local-first)
 */
export async function getLowStockProducts(): Promise<Product[]> {
  const tenantId = getCurrentTenantId();

  const results = await db.products
    .where('[tenantId+deleted]')
    .equals([tenantId, undefined] as any)
    .filter(p => {
      const threshold = p.restockThreshold ?? 0;
      return p.quantity <= threshold;
    })
    .toArray();

  return results.map(localToProduct);
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Convert LocalProduct to Product (API format)
 */
function localToProduct(local: LocalProduct): Product {
  return {
    id: local.id,
    name: local.name,
    description: local.description,
    sku: local.sku,
    categoryId: local.categoryId,
    quantity: local.quantity,
    restockThreshold: local.restockThreshold,
    price: local.price,
    cost: local.cost,
    // Convert timestamp to ISO string
    updatedAt: new Date(local.lastModified).toISOString(),
  };
}

/**
 * Save a server product to local database
 */
async function saveProductLocally(product: Product): Promise<void> {
  const tenantId = getCurrentTenantId();

  const localProduct: LocalProduct = {
    id: product.id,
    tenantId,
    name: product.name,
    description: product.description || '',
    sku: product.sku,
    categoryId: product.categoryId,
    quantity: product.quantity,
    restockThreshold: product.restockThreshold ?? 0,
    price: product.price,
    cost: product.cost,
    synced: true,
    lastModified: product.updatedAt ? new Date(product.updatedAt).getTime() : Date.now(),
    deleted: false,
  };

  await db.products.put(localProduct);
}

/**
 * Fetch product from server (GraphQL)
 */
async function fetchProductFromServer(id: number): Promise<Product | null> {
  const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001';
  const token = await getToken();

  if (!token) {
    return null;
  }

  const query = `
    query GetProduct($id: Int!) {
      product(id: $id) {
        id name description sku categoryId quantity restockThreshold price cost updatedAt
      }
    }
  `;

  try {
    const response = await fetch(`${backendUrl}/graphql`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ query, variables: { id } }),
    });

    const result = await response.json();

    if (result.errors) {
      throw new Error(result.errors[0].message);
    }

    return result.data?.product || null;
  } catch (error) {
    logError(error instanceof Error ? error : new Error('GraphQL error'), {
      context: 'fetchProductFromServer',
      productId: id,
    });
    return null;
  }
}

// ============================================================================
// Sync Helpers (called by sync service)
// ============================================================================

/**
 * Pull products from server and merge with local database
 * Called by sync service
 */
export async function pullProductsFromServer(since?: number): Promise<number> {
  const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001';
  const token = await getToken();

  if (!token) {
    return 0;
  }

  const query = `
    query GetProducts($since: String) {
      products(since: $since) {
        id name description sku categoryId quantity restockThreshold price cost updatedAt
      }
    }
  `;

  const response = await fetch(`${backendUrl}/graphql`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({ 
      query, 
      variables: { since: since ? new Date(since).toISOString() : null }
    }),
  });

  const result = await response.json();

  if (result.errors) {
    throw new Error(result.errors[0].message);
  }

  const products = result.data?.products || [];

  // Save to local database
  await db.transaction('rw', db.products, async () => {
    for (const product of products) {
      await saveProductLocally(product);
    }
  });

  return products.length;
}
