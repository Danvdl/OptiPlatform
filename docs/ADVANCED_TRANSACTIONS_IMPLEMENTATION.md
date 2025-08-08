# Advanced Transaction Types Implementation

## Overview
The OptiPlatform inventory system now supports comprehensive transaction types beyond simple add/remove operations, including adjustments, transfers, returns, waste tracking, and reservations.

## New Transaction Types

### 1. Adjustments (`adjustment`)
**Purpose**: Count corrections and system adjustments
- **Use Cases**: Physical inventory counts, system corrections, audit findings
- **Features**:
	- Positive or negative quantity adjustments
	- Reason tracking ('count_correction', 'system_error', 'audit_finding')
	- Automatic low stock alerts after adjustments
	- Cost tracking for accounting

**GraphQL Usage**:
```graphql
mutation CreateAdjustment {
	createAdjustment(data: {
		productId: 1
		adjustmentQuantity: -5
		reason: "count_correction"
		notes: "Physical count found 5 less than system"
		unitCost: 10.50
	}) {
		id
		quantity
		transactionType
		notes
	}
}
```

### 2. Transfers (`transfer_out` / `transfer_in`)
**Purpose**: Move inventory between locations
- **Use Cases**: Warehouse transfers, store restocking, location optimization
- **Features**:
	- Linked out/in transactions with references
	- Source/destination location tracking
	- Stock validation at source location
	- Automatic transaction pairing

**GraphQL Usage**:
```graphql
mutation CreateTransfer {
	createTransfer(data: {
		productId: 1
		quantity: 10
		fromLocationId: 1
		toLocationId: 2
		notes: "Restocking main floor"
		transferReference: "TR-2025-001"
	}) {
		outTransaction { id transactionType }
		inTransaction { id transactionType referenceTransactionId }
	}
}
```

### 3. Returns (`return_to_supplier` / `return_from_customer`)
**Purpose**: Handle returned merchandise
- **Use Cases**: Defective products, customer returns, supplier exchanges
- **Features**:
	- Return type classification
	- Supplier information tracking
	- Reason code classification
	- Refund amount tracking
	- Stock validation for outbound returns

**GraphQL Usage**:
```graphql
mutation CreateReturn {
	createReturn(data: {
		productId: 1
		quantity: 3
		returnType: "to_supplier"
		supplierName: "ACME Corp"
		supplierReference: "RMA-12345"
		reason: "defective"
		refundAmount: 150.00
	}) {
		id
		transactionType
		supplierName
		reasonCode
	}
}
```

### 4. Waste & Damage Tracking (`waste` / `damaged`)
**Purpose**: Track inventory losses
- **Use Cases**: Expired products, damaged goods, spoilage, breakage
- **Features**:
	- Waste type classification
	- Comprehensive reason codes
	- Expiry date tracking
	- Loss value calculation
	- Automatic high-value waste alerts
	- Stock validation

**GraphQL Usage**:
```graphql
mutation CreateWaste {
	createWaste(data: {
		productId: 1
		quantity: 2
		wasteType: "waste"
		reasonCode: "expired"
		expiryDate: "2025-07-15"
		lossValue: 50.00
		notes: "Found expired in back storage"
	}) {
		id
		transactionType
		reasonCode
		expiryDate
	}
}
```

### 5. Reservations (`reserve` / `unreserve`)
**Purpose**: Allocate stock for pending orders
- **Use Cases**: Order fulfillment, customer holds, sales reservations
- **Features**:
	- Available stock validation (current - reserved)
	- Expiration date management
	- Reference tracking (order numbers)
	- Customer information storage
	- Automatic expiration detection
	- Release reason tracking

**GraphQL Usage**:
```graphql
# Create reservation
mutation CreateReservation {
	createReservation(data: {
		productId: 1
		quantity: 5
		reservationReference: "ORDER-2025-001"
		expiresAt: "2025-08-08T10:00:00Z"
		customerInfo: "John Doe - Premium Customer"
	}) {
		id
		reservationReference
		reservationExpiresAt
	}
}

# Release reservation
mutation ReleaseReservation {
	releaseReservation(data: {
		reservationTransactionId: 123
		reason: "fulfilled"
		notes: "Order shipped"
	}) {
		id
		transactionType
		referenceTransactionId
	}
}
```

## Enhanced Entity Structure

### Transaction Status Enum
- `pending`: Transaction initiated but not completed
- `completed`: Transaction successfully processed
- `cancelled`: Transaction cancelled before completion
- `reversed`: Transaction reversed/undone

### New Database Fields
- `status`: Transaction status tracking
- `fromLocationId` / `toLocationId`: Location tracking for transfers
- `referenceTransactionId`: Links related transactions
- `supplierName` / `supplierReference`: Supplier information
- `reasonCode`: Categorized reason for transaction
- `expiryDate`: Product expiry for waste tracking
- `reservationReference`: External reference (order number)
- `reservationExpiresAt`: Reservation expiration timestamp
- `createdAt` / `updatedAt`: Audit timestamps

## Advanced Query Capabilities

### Stock Analysis
```graphql
# Get reserved stock for a product
query ReservedStock {
	reservedStock(productId: 1)
}

# Get stock by location
query LocationStock {
	locationStock(productId: 1, locationId: 2)
}

# Get active reservations
query ActiveReservations {
	activeReservations(productId: 1) {
		id
		quantity
		reservationReference
		reservationExpiresAt
		notes
	}
}
```

### Transaction History
```graphql
# Get transactions by type
query TransactionsByType {
	transactionsByType(type: WASTE, limit: 20) {
		id
		quantity
		reasonCode
		occurredAt
		product { name sku }
	}
}

# Get expired reservations
query ExpiredReservations {
	expiredReservations {
		id
		reservationReference
		reservationExpiresAt
		product { name }
	}
}
```

## Business Logic Features

### Stock Validation
- **Adjustments**: Prevents negative stock
- **Transfers**: Validates source location availability
- **Returns**: Ensures sufficient stock for outbound returns
- **Waste**: Confirms stock before removal
- **Reservations**: Checks available stock (current - reserved)

### Automatic Notifications
- **Low Stock**: Triggered after adjustments
- **Waste Alerts**: High-value waste notifications
- **Expiring Reservations**: Automated detection

### Data Integrity
- **Linked Transactions**: Transfer pairs reference each other
- **Reservation Tracking**: Prevents double-release
- **Reason Classification**: Standardized codes for analysis

## Database Views & Performance

### Created Views
1. **active_reservations**: Shows unreleased reservations with product details
2. **stock_by_location**: Current stock quantities by location
3. **transaction_summary**: Daily transaction summaries by type

### Performance Optimizations
- Indexed on transaction type, status, location IDs
- Indexed on reservation references and expiration dates
- Optimized queries for stock calculations
- Efficient reservation status checking

## Error Handling & Validation

### Input Validation
- Required fields enforcement
- Positive quantity validation
- Date format validation
- Enum value validation

### Business Rules
- Stock availability checks
- Location existence validation
- Reservation uniqueness
- Expiration date logic

### Error Codes
- `VALIDATION`: Input validation failures
- `NOT_FOUND`: Missing products/transactions
- Specific messages for each validation scenario

## Migration & Deployment

### Database Migration
- Non-destructive schema updates
- Backward compatibility maintained
- New indexes for performance
- Views for complex queries
- Constraints for data integrity

### API Compatibility
- New GraphQL mutations/queries
- Existing functionality preserved
- Enhanced transaction entity
- Advanced input types

## Use Case Examples

### 1. Warehouse Management
```graphql
# Transfer stock from warehouse to retail location
mutation {
	createTransfer(data: {
		productId: 101
		quantity: 50
		fromLocationId: 1  # Warehouse
		toLocationId: 2    # Retail Store
		notes: "Weekly restocking"
	})
}
```

### 2. Quality Control
```graphql
# Report damaged goods
mutation {
	createWaste(data: {
		productId: 101
		quantity: 3
		wasteType: "damaged"
		reasonCode: "damaged_in_transit"
		lossValue: 75.00
	})
}
```

### 3. Order Management
```graphql
# Reserve stock for order
mutation {
	createReservation(data: {
		productId: 101
		quantity: 10
		reservationReference: "WEB-ORDER-12345"
		expiresAt: "2025-08-10T23:59:59Z"
	})
}
```

### 4. Inventory Auditing
```graphql
# Correct count discrepancy
mutation {
	createAdjustment(data: {
		productId: 101
		adjustmentQuantity: -2
		reason: "count_correction"
		notes: "Annual inventory audit - found 2 less"
	})
}
```

## Benefits Achieved

1. **Complete Transaction Lifecycle**: All inventory movements tracked
2. **Enhanced Traceability**: Full audit trail with reasons and references
3. **Improved Accuracy**: Stock validation prevents errors
4. **Better Planning**: Reservation system for demand management
5. **Loss Prevention**: Comprehensive waste and damage tracking
6. **Multi-Location Support**: Transfer capabilities for distributed inventory
7. **Automated Alerts**: Proactive notifications for critical events
8. **Business Intelligence**: Rich data for analytics and reporting

The advanced transaction system transforms OptiPlatform from basic stock tracking to a comprehensive inventory management solution capable of handling complex business scenarios with full auditability and data integrity.

# Advanced Transaction Types Implementation

The OptiPlatform inventory system now supports comprehensive transaction types beyond simple add/remove operations, including adjustments, transfers, returns, waste tracking, and reservations.

[Note] This document was moved from the repository root to docs/. Any root references have been updated.
