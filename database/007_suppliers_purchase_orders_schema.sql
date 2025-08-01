-- Migration: 007_suppliers_purchase_orders_schema.sql
-- Description: Create suppliers and purchase orders tables with comprehensive business logic

-- Create suppliers table
CREATE TYPE supplier_status AS ENUM ('active', 'inactive', 'suspended', 'pending_approval');
CREATE TYPE supplier_type AS ENUM ('manufacturer', 'distributor', 'wholesaler', 'retailer', 'service_provider', 'other');

CREATE TABLE suppliers (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    supplier_code VARCHAR(100) UNIQUE,
    supplier_type supplier_type DEFAULT 'distributor',
    status supplier_status DEFAULT 'active',
    
    -- Contact Information
    contact_person VARCHAR(255),
    email VARCHAR(255),
    phone VARCHAR(50),
    website VARCHAR(255),
    
    -- Address Information
    address_line1 VARCHAR(255),
    address_line2 VARCHAR(255),
    city VARCHAR(100),
    state_province VARCHAR(100),
    postal_code VARCHAR(20),
    country VARCHAR(100) DEFAULT 'US',
    
    -- Business Information
    tax_id VARCHAR(50),
    business_registration VARCHAR(100),
    industry VARCHAR(100),
    
    -- Financial Information
    preferred_currency VARCHAR(3) DEFAULT 'USD',
    payment_terms_days INTEGER DEFAULT 30,
    credit_limit DECIMAL(12,2),
    
    -- Shipping Information
    shipping_cost DECIMAL(10,2) DEFAULT 0,
    lead_time_days INTEGER,
    minimum_order_amount DECIMAL(12,2),
    
    -- Performance Metrics
    reliability_score DECIMAL(3,2) DEFAULT 0 CHECK (reliability_score >= 0 AND reliability_score <= 5),
    quality_score DECIMAL(3,2) DEFAULT 0 CHECK (quality_score >= 0 AND quality_score <= 5),
    on_time_delivery_rate DECIMAL(5,2) DEFAULT 0 CHECK (on_time_delivery_rate >= 0 AND on_time_delivery_rate <= 100),
    
    -- Metadata
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP,
    
    CONSTRAINT suppliers_name_check CHECK (LENGTH(name) > 0)
);

-- Create supplier_products table (junction table with pricing)
CREATE TABLE supplier_products (
    id SERIAL PRIMARY KEY,
    supplier_id INTEGER NOT NULL REFERENCES suppliers(id) ON DELETE CASCADE,
    product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    
    -- Supplier-specific product information
    supplier_sku VARCHAR(100),
    supplier_product_name VARCHAR(255),
    
    -- Pricing Information
    unit_price DECIMAL(10,2) NOT NULL CHECK (unit_price >= 0),
    discount_percentage DECIMAL(5,2) DEFAULT 0 CHECK (discount_percentage >= 0 AND discount_percentage <= 100),
    last_price_update TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Order Information
    minimum_order_quantity INTEGER DEFAULT 1 CHECK (minimum_order_quantity > 0),
    lead_time_days INTEGER,
    
    -- Package Information
    package_size INTEGER DEFAULT 1,
    package_unit VARCHAR(50),
    
    -- Flags
    is_preferred BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    
    -- Metadata
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP,
    
    UNIQUE(supplier_id, product_id)
);

-- Create purchase orders table
CREATE TYPE purchase_order_status AS ENUM (
    'draft', 'pending_approval', 'approved', 'sent', 'acknowledged', 
    'partially_received', 'received', 'cancelled'
);

CREATE TYPE purchase_order_priority AS ENUM ('low', 'normal', 'high', 'urgent');

CREATE TABLE purchase_orders (
    id SERIAL PRIMARY KEY,
    po_number VARCHAR(50) UNIQUE NOT NULL,
    supplier_id INTEGER NOT NULL REFERENCES suppliers(id),
    created_by_user_id INTEGER NOT NULL REFERENCES users(id),
    approved_by_user_id INTEGER REFERENCES users(id),
    
    -- Status and Priority
    status purchase_order_status DEFAULT 'draft',
    priority purchase_order_priority DEFAULT 'normal',
    
    -- Descriptions
    description TEXT,
    notes TEXT,
    
    -- Financial Information
    subtotal_amount DECIMAL(12,2) NOT NULL DEFAULT 0,
    tax_amount DECIMAL(12,2) DEFAULT 0,
    shipping_amount DECIMAL(12,2) DEFAULT 0,
    discount_amount DECIMAL(12,2) DEFAULT 0,
    total_amount DECIMAL(12,2) NOT NULL DEFAULT 0,
    currency VARCHAR(3) DEFAULT 'USD',
    
    -- Dates
    order_date DATE,
    expected_delivery_date DATE,
    requested_delivery_date DATE,
    sent_at TIMESTAMP,
    acknowledged_at TIMESTAMP,
    approved_at TIMESTAMP,
    
    -- Delivery Information
    delivery_address TEXT,
    delivery_contact VARCHAR(255),
    delivery_phone VARCHAR(50),
    delivery_instructions TEXT,
    
    -- Tracking Information
    tracking_number VARCHAR(100),
    carrier VARCHAR(100),
    
    -- Terms and Conditions
    payment_terms_days INTEGER,
    payment_method VARCHAR(100),
    terms_conditions TEXT,
    
    -- References
    supplier_reference VARCHAR(100),
    requisition_number VARCHAR(100),
    project_code VARCHAR(100),
    
    -- Flags
    is_auto_generated BOOLEAN DEFAULT FALSE,
    requires_approval BOOLEAN DEFAULT FALSE,
    is_recurring BOOLEAN DEFAULT FALSE,
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP,
    
    CONSTRAINT po_total_check CHECK (total_amount >= 0)
);

-- Create purchase order items table
CREATE TYPE purchase_order_item_status AS ENUM (
    'pending', 'partially_received', 'received', 'cancelled'
);

CREATE TABLE purchase_order_items (
    id SERIAL PRIMARY KEY,
    purchase_order_id INTEGER NOT NULL REFERENCES purchase_orders(id) ON DELETE CASCADE,
    product_id INTEGER NOT NULL REFERENCES products(id),
    
    -- Product Information
    supplier_sku VARCHAR(100),
    product_name VARCHAR(255),
    description TEXT,
    
    -- Quantity Information
    quantity_ordered INTEGER NOT NULL CHECK (quantity_ordered > 0),
    quantity_received INTEGER DEFAULT 0 CHECK (quantity_received >= 0),
    quantity_cancelled INTEGER DEFAULT 0 CHECK (quantity_cancelled >= 0),
    
    -- Pricing Information
    unit_price DECIMAL(10,2) NOT NULL CHECK (unit_price >= 0),
    discount_percentage DECIMAL(5,2) DEFAULT 0 CHECK (discount_percentage >= 0 AND discount_percentage <= 100),
    tax_percentage DECIMAL(5,2) DEFAULT 0 CHECK (tax_percentage >= 0 AND tax_percentage <= 100),
    discount_amount DECIMAL(10,2) DEFAULT 0,
    tax_amount DECIMAL(10,2) DEFAULT 0,
    line_total DECIMAL(10,2) DEFAULT 0,
    
    -- Additional Information
    unit_of_measure VARCHAR(50),
    lead_time_days INTEGER,
    expected_delivery_date DATE,
    actual_delivery_date DATE,
    
    -- Status and Quality
    status purchase_order_item_status DEFAULT 'pending',
    received_at TIMESTAMP,
    quality_rating DECIMAL(2,1) CHECK (quality_rating >= 1 AND quality_rating <= 5),
    quality_notes TEXT,
    quality_approved BOOLEAN,
    
    -- Metadata
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP,
    
    CONSTRAINT poi_quantity_check CHECK (quantity_received + quantity_cancelled <= quantity_ordered)
);

-- Create indexes for performance
CREATE INDEX idx_suppliers_status ON suppliers(status);
CREATE INDEX idx_suppliers_type ON suppliers(supplier_type);
CREATE INDEX idx_suppliers_code ON suppliers(supplier_code);

CREATE INDEX idx_supplier_products_supplier ON supplier_products(supplier_id);
CREATE INDEX idx_supplier_products_product ON supplier_products(product_id);
CREATE INDEX idx_supplier_products_preferred ON supplier_products(is_preferred) WHERE is_preferred = TRUE;
CREATE INDEX idx_supplier_products_active ON supplier_products(is_active) WHERE is_active = TRUE;

CREATE INDEX idx_purchase_orders_status ON purchase_orders(status);
CREATE INDEX idx_purchase_orders_supplier ON purchase_orders(supplier_id);
CREATE INDEX idx_purchase_orders_created_by ON purchase_orders(created_by_user_id);
CREATE INDEX idx_purchase_orders_po_number ON purchase_orders(po_number);
CREATE INDEX idx_purchase_orders_order_date ON purchase_orders(order_date);
CREATE INDEX idx_purchase_orders_expected_delivery ON purchase_orders(expected_delivery_date);

CREATE INDEX idx_purchase_order_items_po ON purchase_order_items(purchase_order_id);
CREATE INDEX idx_purchase_order_items_product ON purchase_order_items(product_id);
CREATE INDEX idx_purchase_order_items_status ON purchase_order_items(status);

-- Create functions for auto-updating timestamps
CREATE OR REPLACE FUNCTION update_suppliers_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION update_supplier_products_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION update_purchase_orders_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION update_purchase_order_items_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers
CREATE TRIGGER trigger_suppliers_updated_at
    BEFORE UPDATE ON suppliers
    FOR EACH ROW
    EXECUTE FUNCTION update_suppliers_updated_at();

CREATE TRIGGER trigger_supplier_products_updated_at
    BEFORE UPDATE ON supplier_products
    FOR EACH ROW
    EXECUTE FUNCTION update_supplier_products_updated_at();

CREATE TRIGGER trigger_purchase_orders_updated_at
    BEFORE UPDATE ON purchase_orders
    FOR EACH ROW
    EXECUTE FUNCTION update_purchase_orders_updated_at();

CREATE TRIGGER trigger_purchase_order_items_updated_at
    BEFORE UPDATE ON purchase_order_items
    FOR EACH ROW
    EXECUTE FUNCTION update_purchase_order_items_updated_at();

-- Create function to automatically generate PO numbers
CREATE OR REPLACE FUNCTION generate_po_number()
RETURNS TRIGGER AS $$
DECLARE
    year_month TEXT;
    sequence_num INTEGER;
    new_po_number TEXT;
BEGIN
    -- Generate PO number if not provided
    IF NEW.po_number IS NULL OR NEW.po_number = '' THEN
        year_month := TO_CHAR(CURRENT_DATE, 'YYMM');
        
        -- Get the next sequence number for this month
        SELECT COALESCE(MAX(CAST(SUBSTRING(po_number FROM 7) AS INTEGER)), 0) + 1
        INTO sequence_num
        FROM purchase_orders
        WHERE po_number LIKE 'PO' || year_month || '%';
        
        new_po_number := 'PO' || year_month || LPAD(sequence_num::TEXT, 4, '0');
        NEW.po_number := new_po_number;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_generate_po_number
    BEFORE INSERT ON purchase_orders
    FOR EACH ROW
    EXECUTE FUNCTION generate_po_number();

-- Create views for common queries
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

-- Insert some sample data for testing
INSERT INTO suppliers (name, supplier_code, supplier_type, contact_person, email, phone, payment_terms_days) VALUES
('Tech Supply Co', 'TSC001', 'distributor', 'John Smith', 'john@techsupply.com', '+1-555-0101', 30),
('Global Electronics', 'GE002', 'manufacturer', 'Sarah Johnson', 'sarah@globalelec.com', '+1-555-0102', 45),
('Office Supplies Plus', 'OSP003', 'wholesaler', 'Mike Wilson', 'mike@officesupply.com', '+1-555-0103', 15);

-- Grant permissions (adjust as needed for your application)
-- GRANT SELECT, INSERT, UPDATE, DELETE ON suppliers TO your_app_user;
-- GRANT SELECT, INSERT, UPDATE, DELETE ON supplier_products TO your_app_user;
-- GRANT SELECT, INSERT, UPDATE, DELETE ON purchase_orders TO your_app_user;
-- GRANT SELECT, INSERT, UPDATE, DELETE ON purchase_order_items TO your_app_user;
-- GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO your_app_user;
