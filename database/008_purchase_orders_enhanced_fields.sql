-- Migration: 008_purchase_orders_enhanced_fields.sql
-- Description: Add missing fields to purchase_orders table for enhanced workflow tracking

-- Add new timestamp fields for tracking purchase order lifecycle
ALTER TABLE purchase_orders 
ADD COLUMN IF NOT EXISTS received_at TIMESTAMP,
ADD COLUMN IF NOT EXISTS cancelled_at TIMESTAMP,
ADD COLUMN IF NOT EXISTS rejected_at TIMESTAMP;

-- Add fields for approval and rejection tracking
ALTER TABLE purchase_orders 
ADD COLUMN IF NOT EXISTS approval_notes TEXT,
ADD COLUMN IF NOT EXISTS rejection_reason TEXT,
ADD COLUMN IF NOT EXISTS cancellation_reason TEXT;

-- Add foreign key for rejected by user
ALTER TABLE purchase_orders 
ADD COLUMN IF NOT EXISTS rejected_by_user_id INTEGER REFERENCES users(id);

-- Create index for new fields
CREATE INDEX IF NOT EXISTS idx_purchase_orders_received_at ON purchase_orders(received_at);
CREATE INDEX IF NOT EXISTS idx_purchase_orders_cancelled_at ON purchase_orders(cancelled_at);
CREATE INDEX IF NOT EXISTS idx_purchase_orders_rejected_at ON purchase_orders(rejected_at);
CREATE INDEX IF NOT EXISTS idx_purchase_orders_rejected_by ON purchase_orders(rejected_by_user_id);

-- Update the existing views to include new fields
DROP VIEW IF EXISTS pending_purchase_orders;
CREATE VIEW pending_purchase_orders AS
SELECT po.*, s.name as supplier_name, s.contact_person, s.email,
       u1.email as created_by_email,
       u2.email as approved_by_email,
       u3.email as rejected_by_email
FROM purchase_orders po
JOIN suppliers s ON po.supplier_id = s.id
LEFT JOIN users u1 ON po.created_by_user_id = u1.id
LEFT JOIN users u2 ON po.approved_by_user_id = u2.id
LEFT JOIN users u3 ON po.rejected_by_user_id = u3.id
WHERE po.status IN ('pending_approval', 'approved', 'sent', 'acknowledged');

DROP VIEW IF EXISTS overdue_purchase_orders;
CREATE VIEW overdue_purchase_orders AS
SELECT po.*, s.name as supplier_name, s.contact_person, s.email,
       CASE 
           WHEN po.received_at IS NOT NULL AND po.expected_delivery_date IS NOT NULL
           THEN po.received_at > po.expected_delivery_date
           ELSE po.expected_delivery_date < CURRENT_DATE
       END as is_overdue_delivery
FROM purchase_orders po
JOIN suppliers s ON po.supplier_id = s.id
WHERE po.expected_delivery_date < CURRENT_DATE 
  AND po.status IN ('sent', 'acknowledged', 'partially_received');

-- Create new helpful views
CREATE OR REPLACE VIEW purchase_order_summary AS
SELECT 
    po.id,
    po.po_number,
    po.status,
    po.priority,
    po.total_amount,
    po.currency,
    po.order_date,
    po.expected_delivery_date,
    po.received_at,
    s.name as supplier_name,
    s.supplier_code,
    u1.email as created_by,
    u2.email as approved_by,
    u3.email as rejected_by,
    COUNT(poi.id) as item_count,
    SUM(poi.quantity_ordered) as total_quantity_ordered,
    SUM(poi.quantity_received) as total_quantity_received,
    CASE 
        WHEN po.expected_delivery_date IS NOT NULL AND po.received_at IS NOT NULL
        THEN po.received_at <= po.expected_delivery_date
        ELSE NULL
    END as delivered_on_time
FROM purchase_orders po
LEFT JOIN suppliers s ON po.supplier_id = s.id
LEFT JOIN users u1 ON po.created_by_user_id = u1.id
LEFT JOIN users u2 ON po.approved_by_user_id = u2.id
LEFT JOIN users u3 ON po.rejected_by_user_id = u3.id
LEFT JOIN purchase_order_items poi ON po.id = poi.purchase_order_id
GROUP BY po.id, s.id, u1.id, u2.id, u3.id;

-- Create view for supplier performance analytics
CREATE OR REPLACE VIEW supplier_performance_analytics AS
SELECT 
    s.id as supplier_id,
    s.name as supplier_name,
    s.supplier_code,
    COUNT(po.id) as total_orders,
    SUM(po.total_amount) as total_value,
    AVG(po.total_amount) as average_order_value,
    COUNT(CASE WHEN po.status = 'received' THEN 1 END) as completed_orders,
    COUNT(CASE WHEN po.status = 'cancelled' THEN 1 END) as cancelled_orders,
    COUNT(CASE 
        WHEN po.status = 'received' 
        AND po.received_at IS NOT NULL 
        AND po.expected_delivery_date IS NOT NULL 
        AND po.received_at <= po.expected_delivery_date 
        THEN 1 
    END) as on_time_deliveries,
    CASE 
        WHEN COUNT(CASE WHEN po.status = 'received' THEN 1 END) > 0
        THEN (COUNT(CASE 
            WHEN po.status = 'received' 
            AND po.received_at IS NOT NULL 
            AND po.expected_delivery_date IS NOT NULL 
            AND po.received_at <= po.expected_delivery_date 
            THEN 1 
        END) * 100.0 / COUNT(CASE WHEN po.status = 'received' THEN 1 END))
        ELSE 0
    END as on_time_delivery_rate,
    COUNT(sp.id) as active_products
FROM suppliers s
LEFT JOIN purchase_orders po ON s.id = po.supplier_id
LEFT JOIN supplier_products sp ON s.id = sp.supplier_id AND sp.is_active = TRUE
WHERE s.status = 'active'
GROUP BY s.id;

-- Add comments for documentation
COMMENT ON COLUMN purchase_orders.received_at IS 'Timestamp when the purchase order was fully received';
COMMENT ON COLUMN purchase_orders.cancelled_at IS 'Timestamp when the purchase order was cancelled';
COMMENT ON COLUMN purchase_orders.rejected_at IS 'Timestamp when the purchase order was rejected during approval';
COMMENT ON COLUMN purchase_orders.approval_notes IS 'Notes added during the approval process';
COMMENT ON COLUMN purchase_orders.rejection_reason IS 'Reason provided when rejecting the purchase order';
COMMENT ON COLUMN purchase_orders.cancellation_reason IS 'Reason provided when cancelling the purchase order';
COMMENT ON COLUMN purchase_orders.rejected_by_user_id IS 'User who rejected the purchase order';

-- Grant permissions (adjust as needed for your application)
-- GRANT SELECT ON purchase_order_summary TO your_app_user;
-- GRANT SELECT ON supplier_performance_analytics TO your_app_user;
