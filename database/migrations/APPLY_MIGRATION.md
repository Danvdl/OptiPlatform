# Database Migration Instructions

## Apply Migration 004: Add updated_at Columns

### For Render PostgreSQL Database

1. **Connect to Render PostgreSQL database:**
   - Go to your Render Dashboard
   - Navigate to your PostgreSQL database
   - Click "Connect" and copy the external connection string

2. **Run the migration using psql:**
   ```bash
   psql "postgresql://USER:PASSWORD@HOST/DATABASE" -f database/migrations/004_add_updated_at_columns.sql
   ```

   OR using Render Shell:
   - Go to your Render PostgreSQL database dashboard
   - Click "Connect" > "External Connection"
   - Use the provided psql command and then:
   ```sql
   \i /path/to/004_add_updated_at_columns.sql
   ```

3. **Verify the migration:**
   The script includes a verification query at the end that will show:
   ```
   table_name              | has_updated_at
   ------------------------+---------------
   products                | t
   categories              | t
   inventory_transactions  | t
   ```

### Alternative: SQL Shell in Render Dashboard

1. Go to Render Dashboard > Your PostgreSQL Database
2. Click on "SQL Editor" (if available) or use the connection string with a SQL client
3. Copy and paste the contents of `004_add_updated_at_columns.sql`
4. Execute

## What This Migration Does

- Adds `updated_at` column to `products` table
- Adds `updated_at` column to `categories` table  
- Adds `updated_at` column to `inventory_transactions` table
- Creates triggers to automatically update `updated_at` on row updates
- Backfills existing records with `created_at` as initial value

## Rollback (if needed)

If you need to rollback this migration:

```sql
DROP TRIGGER IF EXISTS update_products_updated_at ON products;
DROP TRIGGER IF EXISTS update_categories_updated_at ON categories;
DROP TRIGGER IF EXISTS update_inventory_transactions_updated_at ON inventory_transactions;

ALTER TABLE products DROP COLUMN IF EXISTS updated_at;
ALTER TABLE categories DROP COLUMN IF EXISTS updated_at;
ALTER TABLE inventory_transactions DROP COLUMN IF EXISTS updated_at;

DROP FUNCTION IF EXISTS update_updated_at_column();
```

## Notes

- This migration is **idempotent** - it can be run multiple times safely
- It checks if columns exist before adding them
- It uses triggers for automatic timestamp updates
- No downtime required - columns are added with default values
