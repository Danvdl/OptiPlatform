> This document has moved to ../docs/database/README_MIGRATION.md

## Manual Options

### Option 1: Copy migration file to container
```bash
# Copy the migration file to the container
docker cp database/add_pricing_system.sql optiplatform-db-1:/tmp/migration.sql

# Execute the migration
docker compose exec db psql -U postgres -d mydb -f /tmp/migration.sql
```

### Option 2: Run migration from host (if psql is installed)
```bash
# If you have psql installed on your host machine
psql -h localhost -p 5432 -U postgres -d mydb -f database/add_pricing_system.sql
```

### Option 3: Interactive database session
```bash
# Open interactive psql session
docker compose exec db psql -U postgres -d mydb

# Then copy/paste the contents of add_pricing_system.sql
```

## Verification

After applying the migration, verify it worked:

```sql
-- Check new columns exist
\d products
\d inventory_transactions  
\d price_history

-- Check the new view
SELECT * FROM inventory_valuation;
```

## Restart Server

After applying the migration, restart your NestJS server:

```bash
# In the server directory
npm run build
npm start
```

The database errors should now be resolved! 🎉
