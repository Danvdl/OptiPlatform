-- Migration: Add updated_at columns to Product, Category, and InventoryTransaction tables
-- Date: 2025-11-26
-- Description: Adds timestamp tracking for last update to inventory-related tables

-- Add updated_at to products table if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'products' AND column_name = 'updated_at'
    ) THEN
        ALTER TABLE products 
        ADD COLUMN updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
        
        -- Update existing records to use created_at as initial value
        UPDATE products 
        SET updated_at = created_at 
        WHERE updated_at IS NULL;
    END IF;
END $$;

-- Add updated_at to categories table if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'categories' AND column_name = 'updated_at'
    ) THEN
        ALTER TABLE categories 
        ADD COLUMN updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
        
        -- Update existing records to use created_at as initial value
        UPDATE categories 
        SET updated_at = created_at 
        WHERE updated_at IS NULL;
    END IF;
END $$;

-- Add updated_at to inventory_transactions table if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'inventory_transactions' AND column_name = 'updated_at'
    ) THEN
        ALTER TABLE inventory_transactions 
        ADD COLUMN updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
        
        -- Update existing records to use created_at as initial value
        UPDATE inventory_transactions 
        SET updated_at = created_at 
        WHERE updated_at IS NULL;
    END IF;
END $$;

-- Create or replace function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for automatic timestamp updates
DROP TRIGGER IF EXISTS update_products_updated_at ON products;
CREATE TRIGGER update_products_updated_at 
    BEFORE UPDATE ON products 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_categories_updated_at ON categories;
CREATE TRIGGER update_categories_updated_at 
    BEFORE UPDATE ON categories 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_inventory_transactions_updated_at ON inventory_transactions;
CREATE TRIGGER update_inventory_transactions_updated_at 
    BEFORE UPDATE ON inventory_transactions 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Verify the migration
SELECT 
    'products' as table_name,
    EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'products' AND column_name = 'updated_at'
    ) as has_updated_at
UNION ALL
SELECT 
    'categories' as table_name,
    EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'categories' AND column_name = 'updated_at'
    ) as has_updated_at
UNION ALL
SELECT 
    'inventory_transactions' as table_name,
    EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'inventory_transactions' AND column_name = 'updated_at'
    ) as has_updated_at;
