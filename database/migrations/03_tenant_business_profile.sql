-- ============================================================================
-- ENHANCED TENANT MIGRATION - Business Profile Support
-- Run this in Supabase SQL Editor after the initial migration
-- ============================================================================

-- Update tenants table with business profile fields
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS business_name VARCHAR(255);
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS legal_name VARCHAR(255);
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS tax_id VARCHAR(100);
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS industry VARCHAR(50);
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS company_size VARCHAR(20);
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS website VARCHAR(500);
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS logo VARCHAR(1000);

-- Contact Information
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS phone_number VARCHAR(50);
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS support_email VARCHAR(255);

-- Address Information
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS address_line1 VARCHAR(255);
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS address_line2 VARCHAR(255);
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS city VARCHAR(100);
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS state VARCHAR(100);
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS postal_code VARCHAR(20);
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS country VARCHAR(100);

-- Business Settings
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS currency VARCHAR(10) DEFAULT 'USD';
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS timezone VARCHAR(50) DEFAULT 'UTC';
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS language VARCHAR(10) DEFAULT 'en';

-- Subscription & Limits
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS trial_ends_at TIMESTAMP;
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS subscription_starts_at TIMESTAMP;
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS subscription_ends_at TIMESTAMP;
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS max_users INTEGER DEFAULT 5;
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS max_products INTEGER DEFAULT 100;

-- Additional Settings
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS features JSONB DEFAULT '{}';

-- Onboarding
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN DEFAULT FALSE;
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS onboarding_step INTEGER DEFAULT 1;

-- Update existing status column to use better defaults
ALTER TABLE tenants ALTER COLUMN status SET DEFAULT 'trial';

-- Add users.tenant_role if not exists
ALTER TABLE users ADD COLUMN IF NOT EXISTS tenant_role VARCHAR(50);

-- Create indexes for new fields
CREATE INDEX IF NOT EXISTS idx_tenants_business_name ON tenants(business_name);
CREATE INDEX IF NOT EXISTS idx_tenants_industry ON tenants(industry);
CREATE INDEX IF NOT EXISTS idx_tenants_status ON tenants(status);
CREATE INDEX IF NOT EXISTS idx_users_tenant_role ON users(tenant_role);

-- ============================================================================
-- SAMPLE DATA: Create a demo tenant for testing
-- ============================================================================

-- Create demo tenant (only if it doesn't exist)
INSERT INTO tenants (
  id,
  name,
  slug,
  owner_email,
  business_name,
  legal_name,
  industry,
  company_size,
  plan,
  status,
  currency,
  timezone,
  max_users,
  max_products,
  trial_ends_at,
  onboarding_completed,
  features
)
VALUES (
  'd5dc31d2-b588-4586-8c46-a617ceb1947a',
  'Demo Business',
  'demo-business',
  'demo@optiplat form.com',
  'Demo Business Inc.',
  'Demo Business Incorporated',
  'retail',
  '2-10',
  'free',
  'trial',
  'USD',
  'America/New_York',
  5,
  100,
  NOW() + INTERVAL '14 days',
  false,
  '{"multiUser": true, "advancedAnalytics": false, "apiAccess": false, "customReports": false, "prioritySupport": false}'::jsonb
)
ON CONFLICT (id) DO UPDATE SET
  business_name = EXCLUDED.business_name,
  legal_name = EXCLUDED.legal_name,
  industry = EXCLUDED.industry,
  company_size = EXCLUDED.company_size,
  max_users = EXCLUDED.max_users,
  max_products = EXCLUDED.max_products,
  trial_ends_at = EXCLUDED.trial_ends_at,
  features = EXCLUDED.features;

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================

-- Check tenant structure
SELECT 
  id,
  name,
  slug,
  business_name,
  industry,
  company_size,
  status,
  plan,
  max_users,
  max_products,
  trial_ends_at,
  onboarding_completed
FROM tenants
ORDER BY created_at DESC;

-- Check user-tenant relationships
SELECT 
  u.id,
  u.username,
  u.email,
  u.tenant_role,
  t.name as tenant_name,
  t.business_name
FROM users u
LEFT JOIN tenants t ON u.tenant_id = t.id
ORDER BY u.created_at DESC;

-- Verify all fields were added successfully
SELECT 
  column_name,
  data_type,
  column_default,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'tenants'
ORDER BY ordinal_position;
