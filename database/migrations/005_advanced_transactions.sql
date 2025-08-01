-- Migration: Advanced Transaction Types Support
-- Add new columns to inventory_transactions table for advanced transaction features

-- Add status column with enum
ALTER TABLE inventory_transactions 
ADD COLUMN status VARCHAR(20) DEFAULT 'completed' NOT NULL;

-- Add location tracking for transfers
ALTER TABLE inventory_transactions 
ADD COLUMN from_location_id INTEGER,
ADD COLUMN to_location_id INTEGER;

-- Add reference transaction for linked operations
ALTER TABLE inventory_transactions 
ADD COLUMN reference_transaction_id INTEGER;

-- Add supplier information for returns
ALTER TABLE inventory_transactions 
ADD COLUMN supplier_name VARCHAR(255),
ADD COLUMN supplier_reference VARCHAR(255);

-- Add reason codes for waste/damage/adjustments
ALTER TABLE inventory_transactions 
ADD COLUMN reason_code VARCHAR(100);

-- Add expiry date for waste tracking
ALTER TABLE inventory_transactions 
ADD COLUMN expiry_date DATE;

-- Add reservation details
ALTER TABLE inventory_transactions 
ADD COLUMN reservation_reference VARCHAR(255),
ADD COLUMN reservation_expires_at TIMESTAMP;

-- Add timestamps for better tracking
ALTER TABLE inventory_transactions 
ADD COLUMN created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN updated_at TIMESTAMP;

-- Update transaction_type to support enum values
ALTER TABLE inventory_transactions 
ALTER COLUMN transaction_type TYPE VARCHAR(30);

-- Add indexes for better query performance
CREATE INDEX idx_inventory_transactions_type ON inventory_transactions(transaction_type);
CREATE INDEX idx_inventory_transactions_status ON inventory_transactions(status);
CREATE INDEX idx_inventory_transactions_from_location ON inventory_transactions(from_location_id);
CREATE INDEX idx_inventory_transactions_to_location ON inventory_transactions(to_location_id);
CREATE INDEX idx_inventory_transactions_reference ON inventory_transactions(reference_transaction_id);
CREATE INDEX idx_inventory_transactions_reservation_ref ON inventory_transactions(reservation_reference);
CREATE INDEX idx_inventory_transactions_reason_code ON inventory_transactions(reason_code);
CREATE INDEX idx_inventory_transactions_expires_at ON inventory_transactions(reservation_expires_at);

-- Add foreign key constraints (if locations table exists)
-- ALTER TABLE inventory_transactions 
-- ADD CONSTRAINT fk_from_location FOREIGN KEY (from_location_id) REFERENCES locations(id);
-- ALTER TABLE inventory_transactions 
-- ADD CONSTRAINT fk_to_location FOREIGN KEY (to_location_id) REFERENCES locations(id);

-- Add foreign key for reference transactions
ALTER TABLE inventory_transactions 
ADD CONSTRAINT fk_reference_transaction FOREIGN KEY (reference_transaction_id) REFERENCES inventory_transactions(id);

-- Add check constraints for data integrity
ALTER TABLE inventory_transactions 
ADD CONSTRAINT chk_positive_quantity CHECK (quantity > 0);

ALTER TABLE inventory_transactions 
ADD CONSTRAINT chk_valid_status CHECK (status IN ('pending', 'completed', 'cancelled', 'reversed'));

ALTER TABLE inventory_transactions 
ADD CONSTRAINT chk_valid_transaction_type CHECK (
  transaction_type IN (
    'add', 'remove', 'adjustment', 'transfer_out', 'transfer_in',
    'return_to_supplier', 'return_from_customer', 'waste', 'damaged',
    'reserve', 'unreserve', 'sale', 'purchase'
  )
);

-- Add trigger for updating updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_inventory_transactions_updated_at 
BEFORE UPDATE ON inventory_transactions 
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create views for common queries

-- Active reservations view
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

-- Create indexes on views for better performance
CREATE INDEX idx_active_reservations_product ON inventory_transactions(product_id) 
WHERE transaction_type = 'reserve' AND status = 'completed';

CREATE INDEX idx_active_reservations_expires ON inventory_transactions(reservation_expires_at) 
WHERE transaction_type = 'reserve' AND status = 'completed';

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

-- Grant appropriate permissions (adjust as needed for your setup)
-- GRANT SELECT ON active_reservations TO inventory_read_role;
-- GRANT SELECT ON stock_by_location TO inventory_read_role;
-- GRANT SELECT ON transaction_summary TO inventory_read_role;
