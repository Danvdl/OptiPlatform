# Multi-Tenancy Testing Guide

## Overview
This guide will help you verify that multi-tenant isolation is working correctly across the entire application.

## ✅ Implementation Checklist

### 1. Database Layer ✅
- [x] `tenants` table created
- [x] All 14 tables have `tenant_id` column
- [x] Indexes created on `tenant_id` columns
- [x] Existing data assigned to tenant: `d5dc31d2-b588-4586-8c46-a617ceb1947a`

### 2. Backend Entities ✅
- [x] All 10 entities include `tenantId` field:
  - User (+ tenantRole)
  - Product
  - Category
  - InventoryTransaction
  - Supplier
  - PurchaseOrder
  - PurchaseOrderItem
  - SupplierProduct
  - PriceHistory
  - ProductNote

### 3. Authentication ✅
- [x] JWT strategy extracts `tenantId` and `tenantRole` from token
- [x] `auth.service.ts` includes tenant fields in JWT payload
- [x] JWT tokens contain: `{ sub, username, tenantId, tenantRole }`

### 4. GraphQL Decorators ✅
- [x] `@TenantId()` decorator created
- [x] `@CurrentUser()` decorator created
- [x] Both decorators properly extract data from request context

### 5. Resolvers Updated ✅
- [x] ProductResolver - All 9 methods use `@TenantId()`
- [x] CategoryResolver - All 5 methods use `@TenantId()`
- [x] SuppliersResolver - All 10 methods use `@TenantId()`

### 6. Services Updated ✅
- [x] InventoryService:
  - createProduct, updateProduct, removeProduct
  - findAllProducts, findProduct
  - createCategory, updateCategory, removeCategory
  - findAllCategories, findCategory
  - getProductProfitability, getTopProfitableProducts
  - getInventoryValuation
- [x] SuppliersService:
  - createSupplier, updateSupplier, deleteSupplier
  - findAllSuppliers, findSupplier, findActiveSuppliers
  - getSupplierPerformanceMetrics

### 7. Frontend Integration ✅
- [x] `authUtils.ts` created with JWT decoding
- [x] `getCurrentTenantIdSync()` extracts tenantId
- [x] `productsService.ts` filters local Dexie queries by tenantId

## 🧪 Testing Multi-Tenant Isolation

### Test 1: Verify Database Schema
```sql
-- Check tenants table exists
SELECT * FROM tenants ORDER BY created_at DESC;

-- Verify all products have tenant_id
SELECT COUNT(*) as orphaned_products 
FROM products 
WHERE tenant_id IS NULL;
-- Should return 0

-- Check tenant data distribution
SELECT 
  tenant_id,
  COUNT(*) as product_count
FROM products 
GROUP BY tenant_id;
```

### Test 2: Verify JWT Token Structure
1. Login via GraphQL:
```graphql
mutation {
  login(username: "admin", password: "your-password") {
    access_token
    user {
      id
      username
      tenantId
      tenantRole
    }
  }
}
```

2. Decode the JWT token at [jwt.io](https://jwt.io):
```json
{
  "username": "admin",
  "sub": 10,
  "tenantId": "d5dc31d2-b588-4586-8c46-a617ceb1947a",
  "tenantRole": "owner",
  "iat": 1234567890,
  "exp": 1234567890
}
```

### Test 3: GraphQL Product Queries (Same Tenant)
```graphql
# Should return only tenant's products
query {
  products {
    id
    name
    sku
  }
}

# Should return product if it belongs to tenant
query {
  product(id: 1) {
    id
    name
    sku
  }
}
```

### Test 4: Cross-Tenant Security
**Setup:** Create a second tenant and product

```sql
-- Create second tenant
INSERT INTO tenants (id, name, slug, owner_email, plan, status)
VALUES (
  'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee',
  'Test Company 2',
  'test-company-2',
  'test@company2.com',
  'free',
  'active'
);

-- Create product for tenant 2
INSERT INTO products (name, sku, quantity, tenant_id)
VALUES ('Tenant 2 Product', 'T2-001', 100, 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee');
```

**Test:** Try to access Tenant 2's product while logged in as Tenant 1
```graphql
# Get the product ID from tenant 2
# Try to query it while authenticated as tenant 1
query {
  product(id: <tenant2_product_id>) {
    id
    name
  }
}
# Should return null (not found)
```

### Test 5: Verify Create Operations
```graphql
mutation {
  createProduct(data: {
    name: "Multi-Tenant Test Product"
    sku: "MT-TEST-001"
    quantity: 50
    restockThreshold: 10
  }) {
    id
    name
    sku
  }
}
```

**Verify in Database:**
```sql
SELECT id, name, sku, tenant_id 
FROM products 
WHERE sku = 'MT-TEST-001';
-- tenant_id should match your JWT's tenantId
```

### Test 6: Verify Update Operations
```graphql
mutation {
  updateProduct(data: {
    id: 1
    name: "Updated Product Name"
  }) {
    id
    name
  }
}
# Should only succeed if product belongs to your tenant
```

### Test 7: Verify Delete Operations
```graphql
mutation {
  removeProduct(id: 999999)
}
# Should return false if product doesn't exist or belongs to another tenant
```

### Test 8: Analytics Isolation
```graphql
query {
  inventoryValuation
}
# Should only calculate valuation for current tenant's products

query {
  topProfitableProducts(limit: 10)
}
# Should only return current tenant's products
```

### Test 9: Frontend Local-First Isolation
1. Login to the application
2. Open DevTools → Application → IndexedDB → OptiPlatformDB
3. Check `products` table
4. Verify all products have `tenantId` matching JWT

```javascript
// In browser console
import { getCurrentTenantIdSync } from './utils/authUtils';
const tenantId = getCurrentTenantIdSync();
console.log('Current Tenant:', tenantId);

// Check local database
const db = await import('./db/dexie');
const products = await db.db.products
  .where('[tenantId+deleted]')
  .equals([tenantId, undefined])
  .toArray();
console.log('My Products:', products);
```

### Test 10: Error Handling
**Test 1: No Authentication**
```graphql
# Without Authorization header
query {
  products {
    id
  }
}
# Should return "Unauthorized" error
```

**Test 2: Invalid Token**
```bash
# With invalid token
Authorization: Bearer invalid-token-here
```
Should return authentication error

**Test 3: Missing Tenant Context**
```sql
-- Update user to have no tenant
UPDATE users SET tenant_id = NULL WHERE id = 10;
```
Then try to login - should prevent access or show error

## 🔍 Manual Security Audit

### 1. Code Review Checklist
- [ ] All `find()` queries include `where: { tenantId }`
- [ ] All `findOne()` queries include `where: { id, tenantId }`
- [ ] All `delete()` operations use `{ id, tenantId }`
- [ ] All `create()` operations include `tenantId` in payload
- [ ] No resolver bypasses `@TenantId()` decorator
- [ ] No direct database queries without tenant filtering

### 2. Search for Potential Vulnerabilities
```bash
# In PowerShell
cd c:\Users\Daniël\OptiPlatform-1\server\src

# Find all database queries without tenantId
Select-String -Path "*.service.ts" -Pattern "\.find\(" | Where-Object { $_.Line -notmatch "tenantId" }

# Find all findOne queries
Select-String -Path "*.service.ts" -Pattern "\.findOne\(" | Where-Object { $_.Line -notmatch "tenantId" }

# Find all delete operations
Select-String -Path "*.service.ts" -Pattern "\.delete\(" | Where-Object { $_.Line -notmatch "tenantId" }
```

### 3. Database Audit Queries
```sql
-- 1. Find any orphaned records (no tenant_id)
SELECT 'products' as table_name, COUNT(*) as orphaned_count FROM products WHERE tenant_id IS NULL
UNION ALL
SELECT 'categories', COUNT(*) FROM categories WHERE tenant_id IS NULL
UNION ALL
SELECT 'suppliers', COUNT(*) FROM suppliers WHERE tenant_id IS NULL
UNION ALL
SELECT 'inventory_transactions', COUNT(*) FROM inventory_transactions WHERE tenant_id IS NULL
UNION ALL
SELECT 'purchase_orders', COUNT(*) FROM purchase_orders WHERE tenant_id IS NULL;
-- All counts should be 0

-- 2. Verify referential integrity
SELECT 
  p.id as product_id,
  p.tenant_id as product_tenant,
  c.tenant_id as category_tenant
FROM products p
LEFT JOIN categories c ON p.category_id = c.id
WHERE p.tenant_id != c.tenant_id;
-- Should return 0 rows (no cross-tenant references)

-- 3. Check transaction isolation
SELECT 
  it.id,
  it.tenant_id as transaction_tenant,
  p.tenant_id as product_tenant
FROM inventory_transactions it
JOIN products p ON it.product_id = p.id
WHERE it.tenant_id != p.tenant_id;
-- Should return 0 rows
```

## 🚀 Production Readiness

### Remaining Tasks
1. [ ] Remove `testCreateCategory` endpoint (bypasses auth)
2. [ ] Enable Row-Level Security (RLS) policies in Supabase
3. [ ] Create tenant registration API
4. [ ] Implement tenant onboarding flow
5. [ ] Add tenant switching for admin users
6. [ ] Create tenant management dashboard
7. [ ] Add tenant usage analytics
8. [ ] Implement tenant-level rate limiting

### Row-Level Security (Recommended)
```sql
-- Enable RLS on all tables
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE suppliers ENABLE ROW LEVEL SECURITY;
-- ... etc for all 14 tables

-- Create RLS policies
CREATE POLICY tenant_isolation_policy ON products
  FOR ALL
  USING (tenant_id = current_setting('app.current_tenant_id')::uuid);

CREATE POLICY tenant_isolation_policy ON categories
  FOR ALL
  USING (tenant_id = current_setting('app.current_tenant_id')::uuid);

-- Repeat for all tables
```

## ✅ Success Criteria

Your multi-tenancy implementation is complete when:

1. ✅ All database tables have `tenant_id` column with indexes
2. ✅ All backend entities include `tenantId` field
3. ✅ JWT tokens include `tenantId` and `tenantRole`
4. ✅ All resolvers use `@TenantId()` decorator
5. ✅ All service methods filter by `tenantId`
6. ✅ Frontend extracts `tenantId` from JWT
7. ✅ Local Dexie queries filter by `tenantId`
8. ✅ Cross-tenant access returns null/empty
9. ✅ No orphaned records (tenant_id IS NULL)
10. ✅ E2E tests pass

## 📊 Performance Monitoring

Monitor these metrics in production:

1. **Query Performance:**
   - Average query time by tenant
   - Slow queries per tenant
   - Index usage statistics

2. **Tenant Growth:**
   - New tenants per day/week/month
   - Products per tenant (average/median)
   - Active users per tenant

3. **Security Metrics:**
   - Failed cross-tenant access attempts
   - Invalid token rejections
   - Missing tenant context errors

## 🐛 Troubleshooting

### Issue: "No tenant context" error
**Solution:** User needs to re-login to get updated JWT with tenantId

### Issue: Products from other tenants appearing
**Solution:** Check service method - ensure `where: { tenantId }` in query

### Issue: Cannot create products
**Solution:** Verify JWT includes tenantId, check decorator is applied

### Issue: Null tenantId in database
**Solution:** Check entity create operation includes tenantId from decorator
