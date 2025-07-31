CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  username TEXT NOT NULL UNIQUE,
  password TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS categories (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS products (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  unit TEXT,
  sku TEXT UNIQUE,
  category_id INTEGER REFERENCES categories(id) ON DELETE SET NULL,
  restock_threshold INTEGER DEFAULT 5,
  purchase_price DECIMAL(10,2),
  sale_price DECIMAL(10,2),
  currency VARCHAR(10) DEFAULT 'USD',
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS inventory_transactions (
  id SERIAL PRIMARY KEY,
  product_id INTEGER REFERENCES products(id) ON DELETE CASCADE,
  user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  quantity INTEGER NOT NULL,
  transaction_type TEXT NOT NULL,
  notes TEXT,
  unit_cost DECIMAL(10,2),
  total_cost DECIMAL(10,2),
  occurred_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS device_tokens (
  id SERIAL PRIMARY KEY,
  token TEXT UNIQUE NOT NULL,
  user_id INTEGER REFERENCES users(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS product_notes (
  id SERIAL PRIMARY KEY,
  product_id INTEGER REFERENCES products(id) ON DELETE CASCADE,
  user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  note TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

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

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_price_history_product_id ON price_history(product_id);
CREATE INDEX IF NOT EXISTS idx_price_history_price_type ON price_history(price_type);
CREATE INDEX IF NOT EXISTS idx_price_history_changed_at ON price_history(changed_at);

-- Create inventory valuation view
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

-- Insert some default categories for demo purposes
INSERT INTO categories (name, description) VALUES 
  ('Electronics', 'Electronic devices and components'),
  ('Office Supplies', 'General office and administrative supplies'),
  ('Raw Materials', 'Raw materials and production inputs'),
  ('Finished Goods', 'Completed products ready for sale')
ON CONFLICT (name) DO NOTHING;

