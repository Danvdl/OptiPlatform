-- Migration: Add User Management & Permissions System
-- Date: 2025-08-03

-- First, alter existing users table to add new columns
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS email VARCHAR(255) UNIQUE,
ADD COLUMN IF NOT EXISTS first_name VARCHAR(100),
ADD COLUMN IF NOT EXISTS last_name VARCHAR(100),
ADD COLUMN IF NOT EXISTS role VARCHAR(20) DEFAULT 'staff',
ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'active',
ADD COLUMN IF NOT EXISTS phone_number VARCHAR(20),
ADD COLUMN IF NOT EXISTS department VARCHAR(100),
ADD COLUMN IF NOT EXISTS position VARCHAR(100),
ADD COLUMN IF NOT EXISTS avatar TEXT,
ADD COLUMN IF NOT EXISTS last_login_at TIMESTAMP,
ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT NOW(),
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT NOW();

-- Create check constraints for enums
ALTER TABLE users 
DROP CONSTRAINT IF EXISTS users_role_check,
ADD CONSTRAINT users_role_check CHECK (role IN ('admin', 'manager', 'staff'));

ALTER TABLE users 
DROP CONSTRAINT IF EXISTS users_status_check,
ADD CONSTRAINT users_status_check CHECK (status IN ('active', 'inactive', 'suspended'));

-- Create user_permissions table
CREATE TABLE IF NOT EXISTS user_permissions (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  permission VARCHAR(50) NOT NULL,
  granted_at TIMESTAMP DEFAULT NOW(),
  granted_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
  UNIQUE(user_id, permission)
);

-- Create activity_logs table
CREATE TABLE IF NOT EXISTS activity_logs (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  activity_type VARCHAR(20) NOT NULL,
  description TEXT NOT NULL,
  entity_type VARCHAR(50),
  entity_id INTEGER,
  details TEXT,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create user_preferences table
CREATE TABLE IF NOT EXISTS user_preferences (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  preference_type VARCHAR(50) NOT NULL,
  value TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, preference_type)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_permissions_user_id ON user_permissions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_permissions_permission ON user_permissions(permission);
CREATE INDEX IF NOT EXISTS idx_activity_logs_user_id_created_at ON activity_logs(user_id, created_at);
CREATE INDEX IF NOT EXISTS idx_activity_logs_entity_type_entity_id ON activity_logs(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_activity_type_created_at ON activity_logs(activity_type, created_at);
CREATE INDEX IF NOT EXISTS idx_user_preferences_user_id ON user_preferences(user_id);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_status ON users(status);

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Add triggers for updated_at
DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users 
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_user_preferences_updated_at ON user_preferences;
CREATE TRIGGER update_user_preferences_updated_at BEFORE UPDATE ON user_preferences 
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Add permission type constraint
ALTER TABLE user_permissions 
DROP CONSTRAINT IF EXISTS user_permissions_permission_check,
ADD CONSTRAINT user_permissions_permission_check CHECK (
  permission IN (
    'inventory:read', 'inventory:write', 'inventory:delete',
    'product:create', 'product:update', 'product:delete',
    'transaction:read', 'transaction:create', 'transaction:update', 'transaction:delete',
    'supplier:read', 'supplier:create', 'supplier:update', 'supplier:delete',
    'purchase_order:read', 'purchase_order:create', 'purchase_order:update', 
    'purchase_order:delete', 'purchase_order:approve',
    'reports:read', 'reports:export', 'reports:advanced',
    'user:read', 'user:create', 'user:update', 'user:delete', 'user:permissions',
    'system:settings', 'system:backup', 'system:logs',
    'notification:send', 'notification:manage',
    'location:read', 'location:create', 'location:update', 'location:delete'
  )
);

-- Add activity type constraint
ALTER TABLE activity_logs 
DROP CONSTRAINT IF EXISTS activity_logs_activity_type_check,
ADD CONSTRAINT activity_logs_activity_type_check CHECK (
  activity_type IN (
    'login', 'logout', 'create', 'update', 'delete', 'view', 'export', 'import',
    'approve', 'reject', 'transfer', 'adjustment', 'purchase', 'sale'
  )
);

-- Add preference type constraint
ALTER TABLE user_preferences 
DROP CONSTRAINT IF EXISTS user_preferences_preference_type_check,
ADD CONSTRAINT user_preferences_preference_type_check CHECK (
  preference_type IN (
    'dashboard_layout', 'theme', 'language', 'timezone', 'notification_settings',
    'default_view', 'table_settings', 'chart_preferences', 'export_format', 'page_size'
  )
);

-- Insert default admin user if none exists
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM users WHERE role = 'admin') THEN
    INSERT INTO users (username, email, password, role, status, first_name, last_name)
    VALUES (
      'admin',
      'admin@optiplatform.local',
      '$2b$10$rGlhNdNKmBCJKTddF7/KfuFGD0l0qHLpPHE.z.vYxOYUr9M9Lwr1O', -- password: 'admin123'
      'admin',
      'active',
      'System',
      'Administrator'
    );
  END IF;
END $$;

-- Grant all permissions to admin users
INSERT INTO user_permissions (user_id, permission)
SELECT u.id, p.permission
FROM users u
CROSS JOIN (VALUES 
  ('inventory:read'), ('inventory:write'), ('inventory:delete'),
  ('product:create'), ('product:update'), ('product:delete'),
  ('transaction:read'), ('transaction:create'), ('transaction:update'), ('transaction:delete'),
  ('supplier:read'), ('supplier:create'), ('supplier:update'), ('supplier:delete'),
  ('purchase_order:read'), ('purchase_order:create'), ('purchase_order:update'), 
  ('purchase_order:delete'), ('purchase_order:approve'),
  ('reports:read'), ('reports:export'), ('reports:advanced'),
  ('user:read'), ('user:create'), ('user:update'), ('user:delete'), ('user:permissions'),
  ('system:settings'), ('system:backup'), ('system:logs'),
  ('notification:send'), ('notification:manage'),
  ('location:read'), ('location:create'), ('location:update'), ('location:delete')
) AS p(permission)
WHERE u.role = 'admin'
ON CONFLICT (user_id, permission) DO NOTHING;

COMMIT;
