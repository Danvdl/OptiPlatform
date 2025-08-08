> This document has moved to ../docs/database/MIGRATION_GUIDE.md

### 📋 Migration Files Created:
- `add_pricing_system.sql` - The migration script
- `migrate_pricing.bat` - Windows migration helper
- `migrate_pricing.sh` - Linux/Mac migration helper
- Updated `schema.sql` - For new installations

### 🚀 Quick Fix Options:

#### Option 1: Docker Compose (Recommended)
```bash
# Copy migration to database container and run it
docker cp database/add_pricing_system.sql [container_name]:/tmp/migration.sql
docker compose exec db psql -U postgres -d mydb -f /tmp/migration.sql
```

#### Option 2: Direct Database Connection
If you have `psql` installed:
```bash
psql -h localhost -p 5432 -U postgres -d mydb -f database/add_pricing_system.sql
```

#### Option 3: Database GUI Tool
Copy the contents of `add_pricing_system.sql` and run it in your database management tool (pgAdmin, DBeaver, etc.)

### 🔄 After Migration:
1. Restart your server: `npm run build && npm start` 
2. The database errors will be resolved
3. Your pricing system will be fully functional!

### 📈 New Features Available:
- Product pricing (purchase/sale prices)
- Transaction cost tracking
- Price history audit trail  
- Inventory valuation calculations
- Profitability analysis

**The migration adds these columns:**
- `products`: `purchase_price`, `sale_price`, `currency`
- `inventory_transactions`: `unit_cost`, `total_cost`  
- New table: `price_history`
- New view: `inventory_valuation`
