-- Migration: 009_suppliers_align_fields.sql
-- Description: Align suppliers table with backend GraphQL model by adding missing columns
-- and adjusting score fields to match 1-100 integer scale.

-- NOTE: Supabase/Postgres cannot ALTER a column's type when views depend on it.
-- We drop dependent views first, perform the changes, then recreate the views.

-- 0) Drop dependent views that select from suppliers (active_suppliers and related)
DROP VIEW IF EXISTS active_suppliers;
DROP VIEW IF EXISTS pending_purchase_orders;
DROP VIEW IF EXISTS overdue_purchase_orders;

-- 1) Add missing columns if they do not exist
ALTER TABLE suppliers 
  ADD COLUMN IF NOT EXISTS description TEXT,
  ADD COLUMN IF NOT EXISTS address TEXT,
  ADD COLUMN IF NOT EXISTS discount_percentage DECIMAL(5,2) CHECK (discount_percentage >= 0 AND discount_percentage <= 100),
  ADD COLUMN IF NOT EXISTS free_shipping_threshold DECIMAL(12,2),
  ADD COLUMN IF NOT EXISTS tags TEXT,
  ADD COLUMN IF NOT EXISTS last_order_date TIMESTAMP;

-- 2) Ensure supplier_code exists and is unique (created in 007, but keep idempotency)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'suppliers' AND column_name = 'supplier_code'
  ) THEN
    ALTER TABLE suppliers ADD COLUMN supplier_code VARCHAR(100);
  END IF;
  -- Add unique constraint if missing
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conrelid = 'public.suppliers'::regclass AND conname = 'suppliers_supplier_code_key'
  ) THEN
    ALTER TABLE suppliers ADD CONSTRAINT suppliers_supplier_code_key UNIQUE (supplier_code);
  END IF;
END $$;

-- 3) Adjust reliability_score and quality_score from 0-5 decimal to 1-100 integer range
-- Drop old checks if they exist
ALTER TABLE suppliers DROP CONSTRAINT IF EXISTS suppliers_reliability_score_check;
ALTER TABLE suppliers DROP CONSTRAINT IF EXISTS suppliers_quality_score_check;

-- If columns are numeric/decimal in 0..5, scale them to 0..100 before changing type
-- (Safe to run multiple times; CASE ensures we don't rescale values already in 0..100 integer range)
UPDATE suppliers 
SET reliability_score = CASE 
      WHEN reliability_score IS NULL THEN NULL
      WHEN reliability_score <= 5 THEN ROUND(reliability_score * 20)::DECIMAL(5,2)
      ELSE reliability_score
    END,
    quality_score = CASE 
      WHEN quality_score IS NULL THEN NULL
      WHEN quality_score <= 5 THEN ROUND(quality_score * 20)::DECIMAL(5,2)
      ELSE quality_score
    END;

-- Convert any 0 values to NULL to satisfy the new 1..100 checks
UPDATE suppliers
SET reliability_score = NULL
WHERE reliability_score = 0;

UPDATE suppliers
SET quality_score = NULL
WHERE quality_score = 0;

-- Convert types to INTEGER and add new checks 1..100
ALTER TABLE suppliers 
  ALTER COLUMN reliability_score TYPE INTEGER USING 
    CASE WHEN reliability_score IS NULL THEN NULL ELSE ROUND(reliability_score)::INTEGER END,
  ALTER COLUMN quality_score TYPE INTEGER USING 
    CASE WHEN quality_score IS NULL THEN NULL ELSE ROUND(quality_score)::INTEGER END;

-- Remove old defaults (were 0), allow NULL by default
ALTER TABLE suppliers 
  ALTER COLUMN reliability_score DROP DEFAULT,
  ALTER COLUMN quality_score DROP DEFAULT;

ALTER TABLE suppliers 
  ADD CONSTRAINT suppliers_reliability_score_check CHECK (reliability_score >= 1 AND reliability_score <= 100),
  ADD CONSTRAINT suppliers_quality_score_check CHECK (quality_score >= 1 AND quality_score <= 100);

-- 4) Optional: comments for documentation
COMMENT ON COLUMN suppliers.description IS 'Freeform supplier description';
COMMENT ON COLUMN suppliers.address IS 'Single-line or multiline address (in addition to address_line1/2)';
COMMENT ON COLUMN suppliers.discount_percentage IS 'Default supplier-level discount percentage (0-100)';
COMMENT ON COLUMN suppliers.free_shipping_threshold IS 'Order total threshold for free shipping';
COMMENT ON COLUMN suppliers.tags IS 'Comma-separated tags for filtering';
COMMENT ON COLUMN suppliers.last_order_date IS 'Timestamp of the last purchase order for this supplier';
COMMENT ON COLUMN suppliers.reliability_score IS 'Reliability score as an integer from 1 to 100';
COMMENT ON COLUMN suppliers.quality_score IS 'Quality score as an integer from 1 to 100';

-- 5) Recreate the dropped views
CREATE VIEW active_suppliers AS
SELECT s.*, 
  COUNT(sp.id) as product_count,
  COUNT(po.id) as purchase_order_count
FROM suppliers s
LEFT JOIN supplier_products sp ON s.id = sp.supplier_id AND sp.is_active = TRUE
LEFT JOIN purchase_orders po ON s.id = po.supplier_id
WHERE s.status = 'active'
GROUP BY s.id;

CREATE VIEW pending_purchase_orders AS
SELECT po.*, s.name as supplier_name, s.contact_person, s.email
FROM purchase_orders po
JOIN suppliers s ON po.supplier_id = s.id
WHERE po.status IN ('pending_approval', 'approved', 'sent', 'acknowledged');

CREATE VIEW overdue_purchase_orders AS
SELECT po.*, s.name as supplier_name, s.contact_person, s.email
FROM purchase_orders po
JOIN suppliers s ON po.supplier_id = s.id
WHERE po.expected_delivery_date < CURRENT_DATE 
  AND po.status IN ('sent', 'acknowledged', 'partially_received');
