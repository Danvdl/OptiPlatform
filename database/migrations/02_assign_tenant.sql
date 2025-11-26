-- ============================================================================
-- TENANT SETUP - Part 2: Assign Tenant to Users
-- ============================================================================

-- Your tenant ID: d5dc31d2-b588-4586-8c46-a617ceb1947a

-- STEP 1: Check your existing users
SELECT id, username, email, tenant_id, tenant_role 
FROM users 
ORDER BY id;

-- STEP 2: Assign tenant to your user(s)
-- Replace the user ID with your actual user ID from the query above

-- For user ID 1 (update this ID based on your actual user):
UPDATE users 
SET 
  tenant_id = 'd5dc31d2-b588-4586-8c46-a617ceb1947a',
  tenant_role = 'owner'
WHERE id = 1;

-- If you have multiple users, assign them to the same tenant:
-- UPDATE users 
-- SET tenant_id = 'd5dc31d2-b588-4586-8c46-a617ceb1947a',
--     tenant_role = 'member'  -- or 'admin'
-- WHERE id IN (2, 3, 4);

-- STEP 3: Verify users are now assigned
SELECT id, username, email, tenant_id, tenant_role 
FROM users 
WHERE tenant_id IS NOT NULL;

-- STEP 4: (Optional) Assign tenant to existing data
-- If you have existing products/categories/etc, assign them to this tenant

-- Update products
UPDATE products 
SET tenant_id = 'd5dc31d2-b588-4586-8c46-a617ceb1947a'
WHERE tenant_id IS NULL;

-- Update categories
UPDATE categories 
SET tenant_id = 'd5dc31d2-b588-4586-8c46-a617ceb1947a'
WHERE tenant_id IS NULL;

-- Update suppliers
UPDATE suppliers 
SET tenant_id = 'd5dc31d2-b588-4586-8c46-a617ceb1947a'
WHERE tenant_id IS NULL;

-- Update inventory_transactions
UPDATE inventory_transactions 
SET tenant_id = 'd5dc31d2-b588-4586-8c46-a617ceb1947a'
WHERE tenant_id IS NULL;

-- Update purchase_orders
UPDATE purchase_orders 
SET tenant_id = 'd5dc31d2-b588-4586-8c46-a617ceb1947a'
WHERE tenant_id IS NULL;

-- STEP 5: Verify everything has a tenant
SELECT 
  (SELECT COUNT(*) FROM products WHERE tenant_id IS NULL) as products_without_tenant,
  (SELECT COUNT(*) FROM categories WHERE tenant_id IS NULL) as categories_without_tenant,
  (SELECT COUNT(*) FROM suppliers WHERE tenant_id IS NULL) as suppliers_without_tenant,
  (SELECT COUNT(*) FROM inventory_transactions WHERE tenant_id IS NULL) as transactions_without_tenant,
  (SELECT COUNT(*) FROM users WHERE tenant_id IS NULL) as users_without_tenant;

-- All counts should be 0!

-- ============================================================================
-- COMPLETE! Your database is now multi-tenant ready
-- ============================================================================

-- Summary:
-- ✅ Tenant created: My Company (d5dc31d2-b588-4586-8c46-a617ceb1947a)
-- ✅ Users assigned to tenant
-- ✅ Existing data assigned to tenant
-- 
-- Next steps:
-- 1. Update backend entities to include tenantId field
-- 2. Add tenant middleware to extract tenantId from JWT
-- 3. Update JWT to include tenantId claim
-- 4. Update all resolvers to filter by tenant_id

