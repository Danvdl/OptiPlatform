# OptiPlatform Database Schema

**Database:** PostgreSQL (Supabase)  
**Schema:** public  
**Last Updated:** November 26, 2025

---

## Table of Contents

- [Core Tables](#core-tables)
  - [tenants](#tenants)
  - [users](#users)
- [Product Management](#product-management)
  - [categories](#categories)
  - [products](#products)
  - [product_notes](#product_notes)
  - [price_history](#price_history)
- [Inventory Management](#inventory-management)
  - [inventory_transactions](#inventory_transactions)
- [Supplier Management](#supplier-management)
  - [suppliers](#suppliers)
  - [supplier_products](#supplier_products)
  - [purchase_orders](#purchase_orders)
  - [purchase_order_items](#purchase_order_items)
- [User Management](#user-management)
  - [user_permissions](#user_permissions)
  - [user_preferences](#user_preferences)
  - [activity_logs](#activity_logs)
  - [device_tokens](#device_tokens)
- [Tenant Management](#tenant-management)
  - [tenant_invitations](#tenant_invitations)
  - [tenant_audit_log](#tenant_audit_log)
- [Entity Relationship Diagram](#entity-relationship-diagram)

---

## Core Tables

### tenants

**Purpose:** Multi-tenant isolation - stores business/organization information

**Primary Key:** `id` (string/varchar)

**Columns:**
- `id` - Unique tenant identifier
- `name` - Business name
- `slug` - URL-friendly identifier
- `owner_email` - Primary contact email
- `plan` - Subscription tier (FREE, BASIC, PROFESSIONAL, ENTERPRISE)
- `status` - Account status (ACTIVE, SUSPENDED, TRIAL, CANCELLED)
- `business_name` - Display name
- `legal_name` - Legal entity name
- `tax_id` - Tax identification number
- `industry` - Business industry type
- `company_size` - Organization size
- `website` - Company website
- `logo` - Logo URL
- `phone_number` - Contact phone
- `support_email` - Support contact
- `address_line_1`, `address_line_2`, `city`, `state`, `postal_code`, `country` - Address fields
- `currency` - Default currency (e.g., USD)
- `timezone` - Default timezone
- `language` - Default language
- `trial_ends_at` - Trial expiration date
- `subscription_starts_at` - Subscription start
- `subscription_ends_at` - Subscription end
- `max_users` - User limit
- `max_products` - Product limit
- `settings` - JSONB configuration
- `features` - JSONB feature flags
- `onboarding_completed` - Onboarding status
- `onboarding_step` - Current onboarding step
- `created_at`, `updated_at` - Timestamps

**Referenced By:**
- `users.tenant_id`
- `categories.tenant_id`
- `products.tenant_id`
- `inventory_transactions.tenant_id`
- `product_notes.tenant_id`
- `price_history.tenant_id`
- `suppliers.tenant_id`
- `supplier_products.tenant_id`
- `purchase_orders.tenant_id`
- `purchase_order_items.tenant_id`
- `user_permissions.tenant_id`
- `activity_logs.tenant_id`
- `user_preferences.tenant_id`
- `device_tokens.tenant_id`
- `tenant_invitations.tenant_id`
- `tenant_audit_log.tenant_id`

---

### users

**Purpose:** User accounts with role-based access control

**Primary Key:** `id` (integer)

**Foreign Keys:**
- `tenant_id` → `tenants.id`

**Columns:**
- `id` - User ID
- `username` - Login username (unique)
- `email` - Email address
- `password_hash` - Hashed password
- `first_name`, `last_name` - Personal info
- `role` - System role (ADMIN, MANAGER, STAFF)
- `status` - Account status (ACTIVE, INACTIVE, SUSPENDED)
- `phone_number` - Contact phone
- `department` - Department/team
- `position` - Job title
- `avatar` - Profile picture URL
- `last_login_at` - Last login timestamp
- `tenant_id` - Tenant association
- `tenant_role` - Role within tenant
- `created_at`, `updated_at` - Timestamps

**Referenced By:**
- `inventory_transactions.user_id`
- `product_notes.user_id`
- `price_history.user_id`
- `purchase_orders.created_by_user_id`
- `purchase_orders.approved_by_user_id`
- `purchase_orders.rejected_by_user_id`
- `user_permissions.user_id`
- `user_permissions.granted_by`
- `activity_logs.user_id`
- `user_preferences.user_id`
- `device_tokens.user_id`

---

## Product Management

### categories

**Purpose:** Product categorization/grouping

**Primary Key:** `id` (integer)

**Foreign Keys:**
- `tenant_id` → `tenants.id`

**Columns:**
- `id` - Category ID
- `name` - Category name
- `description` - Category description
- `tenant_id` - Tenant isolation
- `created_at`, `updated_at` - Timestamps

**Referenced By:**
- `products.category_id`

---

### products

**Purpose:** Product catalog with inventory tracking

**Primary Key:** `id` (integer)

**Foreign Keys:**
- `category_id` → `categories.id`
- `tenant_id` → `tenants.id`

**Columns:**
- `id` - Product ID
- `name` - Product name
- `description` - Product description
- `unit` - Unit of measure (e.g., "pcs", "kg", "liter")
- `sku` - Stock Keeping Unit (unique per tenant)
- `category_id` - Category reference
- `restock_threshold` - Low stock alert threshold
- `purchase_price` - Cost price
- `sale_price` - Selling price
- `currency` - Price currency
- `tenant_id` - Tenant isolation
- `created_at`, `updated_at` - Timestamps

**Referenced By:**
- `inventory_transactions.product_id`
- `product_notes.product_id`
- `price_history.product_id`
- `supplier_products.product_id`
- `purchase_order_items.product_id`

**Indexes:**
- Unique constraint on `(tenant_id, sku)`

---

### product_notes

**Purpose:** Notes/comments attached to products

**Primary Key:** `id` (integer)

**Foreign Keys:**
- `product_id` → `products.id`
- `user_id` → `users.id`
- `tenant_id` → `tenants.id`

**Columns:**
- `id` - Note ID
- `product_id` - Associated product
- `user_id` - Author
- `note` - Note content (text)
- `tenant_id` - Tenant isolation
- `created_at` - Timestamp

---

### price_history

**Purpose:** Track price changes over time

**Primary Key:** `id` (integer)

**Foreign Keys:**
- `product_id` → `products.id`
- `user_id` → `users.id`
- `tenant_id` → `tenants.id`

**Columns:**
- `id` - Record ID
- `product_id` - Product reference
- `user_id` - User who changed price
- `price_type` - Type (e.g., "purchase", "sale")
- `old_price` - Previous price
- `new_price` - New price
- `currency` - Price currency
- `reason` - Reason for change
- `tenant_id` - Tenant isolation
- `changed_at` - When change occurred

---

## Inventory Management

### inventory_transactions

**Purpose:** All inventory movements (additions, removals, adjustments, transfers)

**Primary Key:** `id` (integer)

**Foreign Keys:**
- `product_id` → `products.id`
- `user_id` → `users.id`
- `reference_transaction_id` → `inventory_transactions.id` (self-referencing)
- `tenant_id` → `tenants.id`

**Columns:**
- `id` - Transaction ID
- `product_id` - Product reference
- `user_id` - User who performed transaction
- `quantity` - Quantity (positive/negative)
- `transaction_type` - Type (ADD, REMOVE, ADJUSTMENT, TRANSFER_OUT, TRANSFER_IN, RETURN_TO_SUPPLIER, RETURN_FROM_CUSTOMER, WASTE, DAMAGED, RESERVE, UNRESERVE, SALE, PURCHASE)
- `status` - Status (PENDING, COMPLETED, CANCELLED, REVERSED)
- `notes` - Transaction notes
- `unit_cost` - Cost per unit
- `total_cost` - Total transaction cost
- `from_location_id` - Source location (for transfers)
- `to_location_id` - Destination location (for transfers)
- `reference_transaction_id` - Related transaction (for reversals)
- `supplier_name` - Supplier reference
- `supplier_reference` - Supplier's reference number
- `reason_code` - Reason for transaction
- `expiry_date` - Product expiry date
- `reservation_reference` - Reservation identifier
- `reservation_expires_at` - Reservation expiration
- `tenant_id` - Tenant isolation
- `occurred_at` - When transaction occurred
- `created_at`, `updated_at` - Timestamps

---

## Supplier Management

### suppliers

**Purpose:** Supplier/vendor information

**Primary Key:** `id` (integer)

**Foreign Keys:**
- `tenant_id` → `tenants.id`

**Columns:**
- `id` - Supplier ID
- `name` - Supplier name
- `supplier_code` - Internal code
- `description` - Supplier description
- `type` - Type (MANUFACTURER, DISTRIBUTOR, WHOLESALER, RETAILER, SERVICE_PROVIDER)
- `status` - Status (ACTIVE, INACTIVE, SUSPENDED, PENDING_APPROVAL)
- `contact_person` - Primary contact name
- `email` - Contact email
- `phone` - Contact phone
- `website` - Supplier website
- `address`, `city`, `state`, `postal_code`, `country` - Address fields
- `tax_id` - Tax identification
- `registration_number` - Business registration
- `payment_terms_days` - Payment terms (e.g., 30 days)
- `preferred_currency` - Currency preference
- `discount_percentage` - Default discount
- `lead_time_days` - Average lead time
- `minimum_order_amount` - Minimum order value
- `shipping_cost` - Standard shipping cost
- `free_shipping_threshold` - Free shipping minimum
- `reliability_score` - Performance score (0-100)
- `quality_score` - Quality rating (0-100)
- `on_time_delivery_rate` - On-time delivery percentage
- `notes` - Additional notes
- `tags` - Searchable tags
- `tenant_id` - Tenant isolation
- `created_at`, `updated_at` - Timestamps
- `last_order_date` - Last purchase date

**Referenced By:**
- `supplier_products.supplier_id`
- `purchase_orders.supplier_id`

---

### supplier_products

**Purpose:** Product catalog from suppliers (pricing, SKUs, lead times)

**Primary Key:** `id` (integer)

**Foreign Keys:**
- `supplier_id` → `suppliers.id`
- `product_id` → `products.id`
- `tenant_id` → `tenants.id`

**Columns:**
- `id` - Record ID
- `supplier_id` - Supplier reference
- `product_id` - Product reference
- `supplier_sku` - Supplier's SKU
- `supplier_product_name` - Supplier's product name
- `unit_price` - Supplier's price
- `currency` - Price currency
- `minimum_order_quantity` - MOQ
- `lead_time_days` - Delivery lead time
- `discount_percentage` - Volume discount
- `package_size` - Package quantity
- `package_unit` - Package unit
- `notes` - Additional notes
- `is_active` - Active status
- `is_preferred` - Preferred supplier flag
- `last_price_update` - Last price change
- `tenant_id` - Tenant isolation
- `created_at`, `updated_at` - Timestamps

---

### purchase_orders

**Purpose:** Purchase orders to suppliers

**Primary Key:** `id` (integer)

**Foreign Keys:**
- `supplier_id` → `suppliers.id`
- `created_by_user_id` → `users.id`
- `approved_by_user_id` → `users.id`
- `rejected_by_user_id` → `users.id`
- `tenant_id` → `tenants.id`

**Columns:**
- `id` - PO ID
- `po_number` - Purchase order number (unique)
- `supplier_id` - Supplier reference
- `created_by_user_id` - Creator
- `approved_by_user_id` - Approver
- `rejected_by_user_id` - Rejecter
- `status` - Status (DRAFT, PENDING_APPROVAL, APPROVED, SENT, ACKNOWLEDGED, PARTIALLY_RECEIVED, RECEIVED, COMPLETED, CANCELLED, REJECTED)
- `priority` - Priority (LOW, NORMAL, HIGH, URGENT)
- `description` - PO description
- `notes` - Internal notes
- `subtotal_amount` - Subtotal
- `tax_amount` - Tax
- `shipping_amount` - Shipping cost
- `discount_amount` - Discount
- `total_amount` - Total amount
- `currency` - Currency
- `order_date` - Order date
- `expected_delivery_date` - Expected delivery
- `requested_delivery_date` - Requested delivery
- `sent_at`, `acknowledged_at`, `approved_at`, `received_at`, `cancelled_at`, `rejected_at` - Status timestamps
- `approval_notes` - Approval comments
- `rejection_reason` - Rejection reason
- `cancellation_reason` - Cancellation reason
- `delivery_address`, `delivery_contact`, `delivery_phone`, `delivery_instructions` - Delivery info
- `tracking_number` - Shipment tracking
- `carrier` - Shipping carrier
- `payment_terms_days` - Payment terms
- `payment_method` - Payment method
- `terms_conditions` - T&C
- `supplier_reference` - Supplier's PO number
- `requisition_number` - Internal requisition
- `project_code` - Project/cost center
- `is_auto_generated` - Auto-generated flag
- `requires_approval` - Approval required flag
- `is_recurring` - Recurring PO flag
- `tenant_id` - Tenant isolation
- `created_at`, `updated_at` - Timestamps

**Referenced By:**
- `purchase_order_items.purchase_order_id`

---

### purchase_order_items

**Purpose:** Line items in purchase orders

**Primary Key:** `id` (integer)

**Foreign Keys:**
- `purchase_order_id` → `purchase_orders.id`
- `product_id` → `products.id`
- `tenant_id` → `tenants.id`

**Columns:**
- `id` - Item ID
- `purchase_order_id` - PO reference
- `product_id` - Product reference
- `status` - Item status (PENDING, ORDERED, PARTIALLY_RECEIVED, RECEIVED, CANCELLED, BACKORDERED)
- `supplier_sku` - Supplier's SKU
- `product_name` - Product name snapshot
- `description` - Item description
- `quantity_ordered` - Ordered quantity
- `quantity_received` - Received quantity
- `quantity_cancelled` - Cancelled quantity
- `quantity_backordered` - Backordered quantity
- `unit_price` - Price per unit
- `line_total` - Line total
- `discount_percentage` - Discount %
- `discount_amount` - Discount amount
- `tax_percentage` - Tax %
- `tax_amount` - Tax amount
- `unit_of_measure` - Unit
- `lead_time_days` - Lead time
- `expected_delivery_date` - Expected delivery
- `actual_delivery_date` - Actual delivery
- `notes` - Item notes
- `quality_notes` - Quality inspection notes
- `quality_rating` - Quality rating
- `quality_approved` - Quality approval flag
- `tenant_id` - Tenant isolation
- `created_at`, `updated_at` - Timestamps
- `received_at` - Received timestamp

---

## User Management

### user_permissions

**Purpose:** Granular permission assignments

**Primary Key:** `id` (integer)

**Foreign Keys:**
- `user_id` → `users.id`
- `granted_by` → `users.id`
- `tenant_id` → `tenants.id`

**Columns:**
- `id` - Permission ID
- `user_id` - User reference
- `permission` - Permission name (enum)
- `granted_by` - Who granted permission
- `tenant_id` - Tenant isolation
- `granted_at` - Grant timestamp
- `created_at`, `updated_at` - Timestamps

**Available Permissions:**
- INVENTORY_READ, INVENTORY_WRITE, INVENTORY_DELETE
- PRODUCT_CREATE, PRODUCT_UPDATE, PRODUCT_DELETE
- TRANSACTION_READ, TRANSACTION_CREATE, TRANSACTION_UPDATE, TRANSACTION_DELETE
- SUPPLIER_READ, SUPPLIER_CREATE, SUPPLIER_UPDATE, SUPPLIER_DELETE
- PURCHASE_ORDER_READ, PURCHASE_ORDER_CREATE, PURCHASE_ORDER_UPDATE, PURCHASE_ORDER_DELETE, PURCHASE_ORDER_APPROVE
- REPORTS_READ, REPORTS_EXPORT, REPORTS_ADVANCED
- USER_READ, USER_CREATE, USER_UPDATE, USER_DELETE, USER_PERMISSIONS
- SYSTEM_SETTINGS, SYSTEM_BACKUP, SYSTEM_LOGS
- NOTIFICATION_SEND, NOTIFICATION_MANAGE
- LOCATION_READ, LOCATION_CREATE, LOCATION_UPDATE, LOCATION_DELETE

---

### user_preferences

**Purpose:** User-specific UI/UX preferences

**Primary Key:** `id` (integer)

**Foreign Keys:**
- `user_id` → `users.id`
- `tenant_id` → `tenants.id`

**Columns:**
- `id` - Preference ID
- `user_id` - User reference
- `preference_type` - Type (DASHBOARD_LAYOUT, THEME, LANGUAGE, TIMEZONE, NOTIFICATION_SETTINGS, DEFAULT_VIEW, TABLE_SETTINGS, CHART_PREFERENCES, EXPORT_FORMAT, PAGE_SIZE)
- `value` - Preference value (JSON string)
- `tenant_id` - Tenant isolation
- `created_at`, `updated_at` - Timestamps

---

### activity_logs

**Purpose:** Audit trail of user actions

**Primary Key:** `id` (integer)

**Foreign Keys:**
- `user_id` → `users.id`
- `tenant_id` → `tenants.id`

**Columns:**
- `id` - Log ID
- `user_id` - User who performed action
- `activity_type` - Type (LOGIN, LOGOUT, CREATE, UPDATE, DELETE, VIEW, EXPORT, IMPORT, APPROVE, REJECT, TRANSFER, ADJUSTMENT, PURCHASE, SALE)
- `description` - Activity description
- `entity_type` - Entity type (e.g., "Product", "PurchaseOrder")
- `entity_id` - Entity ID
- `details` - JSONB additional details
- `ip_address` - User's IP
- `user_agent` - Browser/client info
- `tenant_id` - Tenant isolation
- `created_at` - Timestamp

---

### device_tokens

**Purpose:** Push notification device tokens (FCM/APNS)

**Primary Key:** `id` (integer)

**Foreign Keys:**
- `user_id` → `users.id`
- `tenant_id` → `tenants.id`

**Columns:**
- `id` - Token ID
- `user_id` - User reference
- `token` - Device token
- `device_type` - Platform (ios, android, web)
- `tenant_id` - Tenant isolation
- `created_at`, `updated_at` - Timestamps

---

## Tenant Management

### tenant_invitations

**Purpose:** Pending team member invitations

**Primary Key:** `id` (uuid)

**Foreign Keys:**
- `tenant_id` → `tenants.id`

**Columns:**
- `id` - Invitation ID (UUID)
- `tenant_id` - Tenant reference
- `email` - Invitee email
- `role` - Invited role
- `status` - Status (pending, accepted, expired)
- `invited_by` - User who sent invitation
- `token` - Invitation token
- `expires_at` - Expiration timestamp
- `created_at`, `updated_at` - Timestamps

---

### tenant_audit_log

**Purpose:** Tenant-level audit trail (settings changes, subscription changes, etc.)

**Primary Key:** `id` (integer)

**Foreign Keys:**
- `tenant_id` → `tenants.id`

**Columns:**
- `id` - Log ID
- `tenant_id` - Tenant reference
- `action` - Action performed
- `entity_type` - Entity type
- `entity_id` - Entity ID
- `changes` - JSONB change details
- `performed_by` - User who performed action
- `ip_address` - IP address
- `created_at` - Timestamp

---

## Entity Relationship Diagram

```
┌─────────────────┐
│    tenants      │ (Central multi-tenant hub)
│   PK: id        │
└────────┬────────┘
         │
         │ Referenced by (tenant_id):
         ├─────────────────────────────────────────┐
         │                                         │
    ┌────▼─────┐                            ┌─────▼──────┐
    │  users   │                            │ categories │
    │ PK: id   │                            │  PK: id    │
    └────┬─────┘                            └─────┬──────┘
         │                                        │
         │ Referenced by:                         │
         ├──► user_permissions                    │
         ├──► user_preferences              ┌─────▼──────────┐
         ├──► activity_logs                 │   products     │
         ├──► device_tokens                 │    PK: id      │
         ├──► inventory_transactions        │ FK: category_id│
         ├──► product_notes                 │ FK: tenant_id  │
         ├──► price_history                 └────┬───────────┘
         ├──► purchase_orders (3 FKs)            │
         │                                       │ Referenced by:
         │                                       ├──► inventory_transactions
    ┌────▼──────────┐                           ├──► product_notes
    │   suppliers   │                           ├──► price_history
    │    PK: id     │                           ├──► supplier_products
    │ FK: tenant_id │                           └──► purchase_order_items
    └────┬──────────┘
         │
         │ Referenced by:
         ├──► supplier_products
         └──► purchase_orders
                  │
             ┌────▼─────────────────┐
             │  purchase_orders     │
             │       PK: id         │
             │ FK: supplier_id      │
             │ FK: created_by       │
             │ FK: approved_by      │
             │ FK: rejected_by      │
             │ FK: tenant_id        │
             └────┬─────────────────┘
                  │
             ┌────▼──────────────────┐
             │ purchase_order_items  │
             │       PK: id          │
             │ FK: purchase_order_id │
             │ FK: product_id        │
             │ FK: tenant_id         │
             └───────────────────────┘
```

---

## Key Design Patterns

### 1. Multi-Tenancy
- All core tables have `tenant_id` foreign key
- Ensures data isolation between businesses
- Row-level security enforced at application layer

### 2. Soft Deletes
- Most tables use status fields instead of hard deletes
- Audit trail preserved
- Examples: `users.status`, `suppliers.status`

### 3. Audit Trail
- `activity_logs` tracks user actions
- `tenant_audit_log` tracks tenant-level changes
- All tables have `created_at`, most have `updated_at`

### 4. Timestamps
- `created_at` - Record creation
- `updated_at` - Last modification (auto-updated by triggers)
- Domain-specific timestamps: `occurred_at`, `sent_at`, `approved_at`, etc.

### 5. Self-Referencing
- `inventory_transactions.reference_transaction_id` - for reversals/corrections

### 6. Flexible Metadata
- JSONB columns: `tenants.settings`, `tenants.features`, `activity_logs.details`
- Allows schema evolution without migrations

---

## Indexes (Recommended)

**High-Priority:**
- `products (tenant_id, sku)` - Unique constraint
- `users (tenant_id, username)` - Unique constraint
- `inventory_transactions (product_id, occurred_at DESC)`
- `purchase_orders (tenant_id, status, created_at DESC)`
- `activity_logs (tenant_id, created_at DESC)`

**Medium-Priority:**
- `categories (tenant_id)`
- `suppliers (tenant_id, status)`
- `supplier_products (supplier_id, product_id)`
- `user_permissions (user_id, tenant_id)`

---

## Notes

- **updated_at Columns**: Added via migration `004_add_updated_at_columns.sql` to `products`, `categories`, `inventory_transactions`
- **Triggers**: Automatic `updated_at` update triggers implemented
- **JWT Authentication**: `tenant_id` extracted from JWT token for row-level filtering
- **GraphQL Schema**: See `server/schema.gql` for API types
- **Frontend Sync**: Offline-first architecture syncs from GraphQL API to IndexedDB

---

**Schema Version:** 1.1  
**Migration Status:** Up to date (004_add_updated_at_columns applied)
