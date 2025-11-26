-- Migration: Add Multi-Tenant Support (Updated for actual schema)
-- Description: Adds tenant_id to all existing tables and creates tenant management infrastructure
-- Date: 2025-11-26

-- ============================================================================
-- STEP 1: Create tenants table
-- ============================================================================

CREATE TABLE IF NOT EXISTS tenants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(100) NOT NULL UNIQUE,
  owner_email VARCHAR(255) NOT NULL,
  plan VARCHAR(50) DEFAULT 'free', -- free, starter, professional, enterprise
  status VARCHAR(50) DEFAULT 'active', -- active, suspended, trial, cancelled
  settings JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes on tenants table
CREATE INDEX IF NOT EXISTS idx_tenants_slug ON tenants(slug);
CREATE INDEX IF NOT EXISTS idx_tenants_owner_email ON tenants(owner_email);
CREATE INDEX IF NOT EXISTS idx_tenants_status ON tenants(status);

-- ============================================================================
-- STEP 2: Add tenant_id to existing tables
-- ============================================================================

-- Core tables (already exist in your schema)
ALTER TABLE users ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE;
ALTER TABLE products ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE;
ALTER TABLE categories ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE;
ALTER TABLE inventory_transactions ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE;
ALTER TABLE device_tokens ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE;
ALTER TABLE activity_logs ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE;

-- Supplier-related tables (from active_suppliers view, check if base table exists)
-- Note: If 'suppliers' table doesn't exist yet, this will fail - run purchase_orders migration first
ALTER TABLE suppliers ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE;

-- Purchase order related (if table exists)
-- Note: Run this after purchase_orders table is created
-- ALTER TABLE purchase_orders ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE;

-- Price history (if exists)
-- ALTER TABLE price_history ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE;

-- Supplier products (if exists)
-- ALTER TABLE supplier_products ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE;

-- Product notes (if exists)
-- ALTER TABLE product_notes ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE;

-- User permissions (if exists)
-- ALTER TABLE user_permissions ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE;

-- User preferences (if exists)
-- ALTER TABLE user_preferences ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE;

-- ============================================================================
-- STEP 3: Add indexes for tenant_id on all tables
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_users_tenant_id ON users(tenant_id);
CREATE INDEX IF NOT EXISTS idx_products_tenant_id ON products(tenant_id);
CREATE INDEX IF NOT EXISTS idx_categories_tenant_id ON categories(tenant_id);
CREATE INDEX IF NOT EXISTS idx_inventory_transactions_tenant_id ON inventory_transactions(tenant_id);
CREATE INDEX IF NOT EXISTS idx_device_tokens_tenant_id ON device_tokens(tenant_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_tenant_id ON activity_logs(tenant_id);
CREATE INDEX IF NOT EXISTS idx_suppliers_tenant_id ON suppliers(tenant_id);

-- Uncomment as tables are created:
-- CREATE INDEX IF NOT EXISTS idx_purchase_orders_tenant_id ON purchase_orders(tenant_id);
-- CREATE INDEX IF NOT EXISTS idx_price_history_tenant_id ON price_history(tenant_id);
-- CREATE INDEX IF NOT EXISTS idx_supplier_products_tenant_id ON supplier_products(tenant_id);
-- CREATE INDEX IF NOT EXISTS idx_product_notes_tenant_id ON product_notes(tenant_id);
-- CREATE INDEX IF NOT EXISTS idx_user_permissions_tenant_id ON user_permissions(tenant_id);
-- CREATE INDEX IF NOT EXISTS idx_user_preferences_tenant_id ON user_preferences(tenant_id);

-- ============================================================================
-- STEP 4: Add tenant role to users table
-- ============================================================================

ALTER TABLE users ADD COLUMN IF NOT EXISTS tenant_role VARCHAR(50) DEFAULT 'member';

COMMENT ON COLUMN users.tenant_role IS 'User role within their tenant: owner, admin, member';

-- ============================================================================
-- STEP 5: Create tenant invitations table
-- ============================================================================

CREATE TABLE IF NOT EXISTS tenant_invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  email VARCHAR(255) NOT NULL,
  role VARCHAR(50) DEFAULT 'member', -- owner, admin, member
  token VARCHAR(255) NOT NULL UNIQUE,
  invited_by INTEGER, -- user_id who sent the invitation
  expires_at TIMESTAMP NOT NULL DEFAULT (NOW() + INTERVAL '7 days'),
  accepted_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_tenant_invitations_token ON tenant_invitations(token);
CREATE INDEX IF NOT EXISTS idx_tenant_invitations_tenant_id ON tenant_invitations(tenant_id);
CREATE INDEX IF NOT EXISTS idx_tenant_invitations_email ON tenant_invitations(email);

COMMENT ON TABLE tenant_invitations IS 'Manages team member invitations to tenants';

-- ============================================================================
-- STEP 6: Create tenant audit log
-- ============================================================================

CREATE TABLE IF NOT EXISTS tenant_audit_log (
  id SERIAL PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  user_id INTEGER,
  action VARCHAR(100) NOT NULL, -- created, updated, deleted, login, logout, etc.
  entity_type VARCHAR(100), -- product, category, transaction, user, etc.
  entity_id VARCHAR(100),
  changes JSONB, -- Before/after values
  ip_address VARCHAR(45),
  user_agent TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_tenant_audit_log_tenant_id ON tenant_audit_log(tenant_id);
CREATE INDEX IF NOT EXISTS idx_tenant_audit_log_created_at ON tenant_audit_log(created_at);
CREATE INDEX IF NOT EXISTS idx_tenant_audit_log_user_id ON tenant_audit_log(user_id);
CREATE INDEX IF NOT EXISTS idx_tenant_audit_log_action ON tenant_audit_log(action);

COMMENT ON TABLE tenant_audit_log IS 'Audit trail for all tenant operations';

-- ============================================================================
-- STEP 7: Create updated_at trigger function
-- ============================================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Add trigger for tenants table
DROP TRIGGER IF EXISTS update_tenants_updated_at ON tenants;
CREATE TRIGGER update_tenants_updated_at
    BEFORE UPDATE ON tenants
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- STEP 8: Enable Row-Level Security (RLS)
-- ============================================================================

-- Enable RLS on all tenant-aware tables
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE device_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;

-- Uncomment when tables exist:
-- ALTER TABLE purchase_orders ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE price_history ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE supplier_products ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE product_notes ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- STEP 9: Create RLS Policies (Optional - activate when JWT contains tenant_id)
-- ============================================================================

-- Note: These are commented out. Enable them when your JWT tokens include tenant_id
-- and you've configured Supabase to use them.

-- Example policy for products:
/*
CREATE POLICY tenant_isolation_policy ON products
  USING (tenant_id = current_setting('request.jwt.claims', true)::json->>'tenant_id'::UUID);

CREATE POLICY tenant_isolation_policy ON categories
  USING (tenant_id = current_setting('request.jwt.claims', true)::json->>'tenant_id'::UUID);

CREATE POLICY tenant_isolation_policy ON inventory_transactions
  USING (tenant_id = current_setting('request.jwt.claims', true)::json->>'tenant_id'::UUID);

CREATE POLICY tenant_isolation_policy ON suppliers
  USING (tenant_id = current_setting('request.jwt.claims', true)::json->>'tenant_id'::UUID);
*/

-- ============================================================================
-- STEP 10: Add helpful comments
-- ============================================================================

COMMENT ON TABLE tenants IS 'Stores tenant (business/organization) information for multi-tenancy';
COMMENT ON COLUMN tenants.slug IS 'URL-friendly unique identifier for the tenant';
COMMENT ON COLUMN tenants.plan IS 'Subscription plan: free, starter, professional, enterprise';
COMMENT ON COLUMN tenants.status IS 'Tenant status: active, suspended, trial, cancelled';
COMMENT ON COLUMN tenants.settings IS 'JSON settings for tenant customization';

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================

-- Run these queries after migration to verify everything worked:

-- 1. Check if tenants table exists
-- SELECT * FROM information_schema.tables WHERE table_name = 'tenants';

-- 2. Check if tenant_id was added to products
-- SELECT column_name, data_type FROM information_schema.columns 
-- WHERE table_name = 'products' AND column_name = 'tenant_id';

-- 3. Check all tenant indexes
-- SELECT indexname, tablename FROM pg_indexes 
-- WHERE schemaname = 'public' AND indexname LIKE '%tenant%';

-- 4. List all tables with tenant_id
-- SELECT table_name, column_name FROM information_schema.columns 
-- WHERE column_name = 'tenant_id' ORDER BY table_name;

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================

-- Next steps:
-- 1. Create a test tenant:
--    INSERT INTO tenants (name, slug, owner_email, plan, status)
--    VALUES ('Test Company', 'test-company', 'test@example.com', 'free', 'active')
--    RETURNING *;
--
-- 2. Update existing users to belong to test tenant:
--    UPDATE users SET tenant_id = '<tenant-id-from-step-1>' WHERE id = 1;
--
-- 3. Update backend entities to include tenantId field
-- 4. Add tenant middleware to extract tenantId from JWT
-- 5. Update all queries to filter by tenant_id

