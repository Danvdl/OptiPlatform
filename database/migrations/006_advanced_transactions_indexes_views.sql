-- Complementary Migration: Add Missing Indexes and Views for Advanced Transactions
-- This adds only the missing performance optimizations since the schema columns are already present

-- Add missing indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_inventory_transactions_type ON inventory_transactions(transaction_type);
CREATE INDEX IF NOT EXISTS idx_inventory_transactions_status ON inventory_transactions(status);
CREATE INDEX IF NOT EXISTS idx_inventory_transactions_from_location ON inventory_transactions(from_location_id);
CREATE INDEX IF NOT EXISTS idx_inventory_transactions_to_location ON inventory_transactions(to_location_id);
CREATE INDEX IF NOT EXISTS idx_inventory_transactions_reference ON inventory_transactions(reference_transaction_id);
CREATE INDEX IF NOT EXISTS idx_inventory_transactions_reservation_ref ON inventory_transactions(reservation_reference);
CREATE INDEX IF NOT EXISTS idx_inventory_transactions_reason_code ON inventory_transactions(reason_code);
CREATE INDEX IF NOT EXISTS idx_inventory_transactions_expires_at ON inventory_transactions(reservation_expires_at);

-- Add trigger for updating updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_inventory_transactions_updated_at ON inventory_transactions;
CREATE TRIGGER update_inventory_transactions_updated_at 
BEFORE UPDATE ON inventory_transactions 
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create views for common queries

-- Active reservations view
DROP VIEW IF EXISTS active_reservations;
CREATE VIEW active_reservations AS
SELECT 
  r.*,
  p.name as product_name,
  p.sku as product_sku
FROM inventory_transactions r
JOIN products p ON r.product_id = p.id
WHERE r.transaction_type = 'reserve'
  AND r.status = 'completed'
  AND r.id NOT IN (
    SELECT DISTINCT reference_transaction_id 
    FROM inventory_transactions 
    WHERE transaction_type = 'unreserve' 
      AND reference_transaction_id IS NOT NULL
  );

-- Stock by location view
DROP VIEW IF EXISTS stock_by_location;
CREATE VIEW stock_by_location AS
SELECT 
  product_id,
  COALESCE(from_location_id, to_location_id) as location_id,
  SUM(CASE 
    WHEN to_location_id IS NOT NULL THEN quantity 
    WHEN from_location_id IS NOT NULL THEN -quantity 
    ELSE 0 
  END) as stock_quantity
FROM inventory_transactions
WHERE (from_location_id IS NOT NULL OR to_location_id IS NOT NULL)
  AND status = 'completed'
GROUP BY product_id, COALESCE(from_location_id, to_location_id)
HAVING SUM(CASE 
  WHEN to_location_id IS NOT NULL THEN quantity 
  WHEN from_location_id IS NOT NULL THEN -quantity 
  ELSE 0 
END) > 0;

-- Transaction summary view
DROP VIEW IF EXISTS transaction_summary;
CREATE VIEW transaction_summary AS
SELECT 
  DATE(occurred_at) as transaction_date,
  transaction_type,
  COUNT(*) as transaction_count,
  SUM(quantity) as total_quantity,
  SUM(total_cost) as total_value
FROM inventory_transactions
WHERE status = 'completed'
GROUP BY DATE(occurred_at), transaction_type
ORDER BY transaction_date DESC, transaction_type;

-- Create partial indexes for better performance on specific queries
CREATE INDEX IF NOT EXISTS idx_active_reservations_product ON inventory_transactions(product_id) 
WHERE transaction_type = 'reserve' AND status = 'completed';

CREATE INDEX IF NOT EXISTS idx_active_reservations_expires ON inventory_transactions(reservation_expires_at) 
WHERE transaction_type = 'reserve' AND status = 'completed';

-- Add missing index on occurred_at for time-based queries
CREATE INDEX IF NOT EXISTS idx_inventory_transactions_occurred_at ON inventory_transactions(occurred_at);

-- Add composite index for product + transaction type queries
CREATE INDEX IF NOT EXISTS idx_inventory_transactions_product_type ON inventory_transactions(product_id, transaction_type);

-- Add index for user-based queries
CREATE INDEX IF NOT EXISTS idx_inventory_transactions_user_id ON inventory_transactions(user_id);

-- Add comments for documentation
COMMENT ON COLUMN inventory_transactions.status IS 'Transaction status: pending, completed, cancelled, reversed';
COMMENT ON COLUMN inventory_transactions.from_location_id IS 'Source location for transfers';
COMMENT ON COLUMN inventory_transactions.to_location_id IS 'Destination location for transfers';
COMMENT ON COLUMN inventory_transactions.reference_transaction_id IS 'Links related transactions (transfers, reversals)';
COMMENT ON COLUMN inventory_transactions.supplier_name IS 'Supplier name for returns';
COMMENT ON COLUMN inventory_transactions.supplier_reference IS 'Supplier reference number for returns';
COMMENT ON COLUMN inventory_transactions.reason_code IS 'Reason code for adjustments, waste, damage';
COMMENT ON COLUMN inventory_transactions.expiry_date IS 'Product expiry date for waste tracking';
COMMENT ON COLUMN inventory_transactions.reservation_reference IS 'External reference for reservations (order number, etc.)';
COMMENT ON COLUMN inventory_transactions.reservation_expires_at IS 'When the reservation expires';

COMMENT ON VIEW active_reservations IS 'Shows all active (unreleased) reservations';
COMMENT ON VIEW stock_by_location IS 'Current stock quantity by location';
COMMENT ON VIEW transaction_summary IS 'Daily transaction summary by type';
