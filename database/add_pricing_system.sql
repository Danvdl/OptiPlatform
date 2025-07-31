-- Add pricing columns to products table
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS purchase_price DECIMAL(10,2),
ADD COLUMN IF NOT EXISTS sale_price DECIMAL(10,2),
ADD COLUMN IF NOT EXISTS currency VARCHAR(10) DEFAULT 'USD';

-- Add cost tracking columns to inventory_transactions table
ALTER TABLE inventory_transactions 
ADD COLUMN IF NOT EXISTS unit_cost DECIMAL(10,2),
ADD COLUMN IF NOT EXISTS total_cost DECIMAL(10,2);

-- Create price_history table for tracking price changes
CREATE TABLE IF NOT EXISTS price_history (
    id SERIAL PRIMARY KEY,
    product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    price_type VARCHAR(20) NOT NULL CHECK (price_type IN ('purchase', 'sale')),
    old_price DECIMAL(10,2) NOT NULL,
    new_price DECIMAL(10,2) NOT NULL,
    currency VARCHAR(10) DEFAULT 'USD',
    reason TEXT,
    changed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_price_history_product_id ON price_history(product_id);
CREATE INDEX IF NOT EXISTS idx_price_history_price_type ON price_history(price_type);
CREATE INDEX IF NOT EXISTS idx_price_history_changed_at ON price_history(changed_at);

-- Add comments for documentation
COMMENT ON TABLE price_history IS 'Tracks all price changes for products over time';
COMMENT ON COLUMN price_history.price_type IS 'Type of price: purchase or sale';
COMMENT ON COLUMN price_history.old_price IS 'Previous price before the change';
COMMENT ON COLUMN price_history.new_price IS 'New price after the change';
COMMENT ON COLUMN price_history.reason IS 'Optional reason for the price change';

-- Update existing products to have default pricing if needed
UPDATE products 
SET currency = 'USD' 
WHERE currency IS NULL;

-- Create a view for easy inventory valuation queries
CREATE OR REPLACE VIEW inventory_valuation AS
SELECT 
    p.id,
    p.name,
    p.purchase_price,
    p.sale_price,
    p.currency,
    COALESCE(stock.current_stock, 0) as current_stock,
    COALESCE(p.purchase_price * stock.current_stock, 0) as inventory_value,
    COALESCE(p.sale_price * stock.current_stock, 0) as potential_revenue,
    COALESCE((p.sale_price - p.purchase_price) * stock.current_stock, 0) as potential_profit
FROM products p
LEFT JOIN (
    SELECT 
        product_id,
        SUM(quantity) as current_stock
    FROM inventory_transactions 
    GROUP BY product_id
) stock ON p.id = stock.product_id
WHERE p.purchase_price IS NOT NULL OR p.sale_price IS NOT NULL;

COMMENT ON VIEW inventory_valuation IS 'Provides real-time inventory valuation and profit calculations';
