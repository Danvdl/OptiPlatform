# Database Setup Guide - Multi-Tenancy

## Current Setup: Supabase PostgreSQL

✅ **Database hosted:** Supabase (aws-0-eu-west-2)  
✅ **Connection working:** Backend already connected  
✅ **Free tier:** 500 MB storage, unlimited requests  

---

## Recommendation: **Stick with Supabase**

**Why:**
- Already working and configured
- Generous free tier for development
- Built-in features (auth, storage, realtime)
- Easy upgrade path to production ($25/mo)

**Alternative (if you need more storage):** Neon (3 GB free)

---

## Setup Steps

### Step 1: Apply Multi-Tenant Database Migration

You have two options to run the migration:

#### Option A: Supabase Web UI (Easiest)

1. Go to https://supabase.com/dashboard
2. Select your project (eljsjkxwgwolpdaamsev)
3. Click **"SQL Editor"** in the left sidebar
4. Click **"New Query"**
5. Copy the entire contents of `database/migrations/001_add_tenant_support.sql`
6. Paste into the editor
7. Click **"Run"** (or press Ctrl+Enter)

#### Option B: Command Line (psql)

If you have PostgreSQL installed locally:

```powershell
# Navigate to project root
cd C:\Users\Daniël\OptiPlatform-1

# Run migration
psql "postgresql://postgres.eljsjkxwgwolpdaamsev:OptiBDdev123@aws-0-eu-west-2.pooler.supabase.com:6543/postgres" -f database/migrations/001_add_tenant_support.sql
```

**Don't have psql?** Install PostgreSQL from: https://www.postgresql.org/download/windows/

#### Option C: Docker (if you have Docker Desktop)

```powershell
docker run --rm -i postgres:15 psql "postgresql://postgres.eljsjkxwgwolpdaamsev:OptiBDdev123@aws-0-eu-west-2.pooler.supabase.com:6543/postgres" < database/migrations/001_add_tenant_support.sql
```

---

### Step 2: Verify Migration

After running the migration, verify it worked:

**In Supabase SQL Editor, run:**

```sql
-- Check if tenants table exists
SELECT * FROM information_schema.tables 
WHERE table_name = 'tenants';

-- Check if tenant_id was added to products
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'products' 
  AND column_name = 'tenant_id';

-- Check all indexes
SELECT indexname, tablename 
FROM pg_indexes 
WHERE schemaname = 'public' 
  AND indexname LIKE '%tenant%';
```

**Expected results:**
- `tenants` table exists ✅
- `products.tenant_id` column exists ✅
- Multiple `idx_*_tenant_id` indexes exist ✅

---

### Step 3: Create Test Tenant

Create your first tenant for testing:

```sql
-- Insert test tenant
INSERT INTO tenants (name, slug, owner_email, plan, status)
VALUES 
  ('Test Company', 'test-company', 'test@example.com', 'free', 'active')
RETURNING *;

-- Get the tenant ID (save this!)
SELECT id, name, slug FROM tenants;
```

**Save the tenant ID!** You'll need it for testing.

---

### Step 4: Update Backend Entities (Add tenant_id)

The migration added `tenant_id` columns to the database, but we need to update TypeORM entities to match.

#### Products Entity

Add to `server/src/inventory/entities/product.entity.ts`:

```typescript
@Field({ nullable: true })
@Column({ nullable: true, name: 'tenant_id' })
tenantId?: string;

@Field()
@Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP', name: 'updated_at' })
updatedAt: Date;
```

#### Categories Entity

Add to `server/src/inventory/entities/category.entity.ts`:

```typescript
@Field({ nullable: true })
@Column({ nullable: true, name: 'tenant_id' })
tenantId?: string;

@Field()
@Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP', name: 'updated_at' })
updatedAt: Date;
```

#### Repeat for all entities:
- `inventory-transaction.entity.ts`
- `supplier.entity.ts`
- `supplier-product.entity.ts`
- `purchase-order.entity.ts`
- `user.entity.ts`

---

### Step 5: Create Tenant Middleware (Backend)

Create tenant extraction middleware:

**File:** `server/src/common/tenant.middleware.ts`

```typescript
import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class TenantMiddleware implements NestMiddleware {
  constructor(private jwtService: JwtService) {}

  use(req: Request, res: Response, next: NextFunction) {
    try {
      const authHeader = req.headers.authorization;
      
      if (authHeader?.startsWith('Bearer ')) {
        const token = authHeader.substring(7);
        const payload = this.jwtService.verify(token);
        
        // Extract tenant ID from JWT
        (req as any).tenantId = payload.tenantId || null;
        (req as any).userId = payload.sub;
      }
    } catch (error) {
      // Invalid/expired token - continue without tenant context
    }
    
    next();
  }
}
```

**Apply middleware in `app.module.ts`:**

```typescript
import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { TenantMiddleware } from './common/tenant.middleware';

@Module({
  // ... existing config
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(TenantMiddleware)
      .forRoutes('*'); // Apply to all routes
  }
}
```

---

### Step 6: Update JWT Payload (Include tenantId)

**File:** `server/src/auth/auth.service.ts`

When creating JWT tokens, include `tenantId`:

```typescript
async login(user: User) {
  const payload = { 
    username: user.username, 
    sub: user.id,
    tenantId: user.tenantId, // Add this
  };
  
  return {
    access_token: this.jwtService.sign(payload),
  };
}
```

---

### Step 7: Update Resolvers to Filter by Tenant

**Example:** `server/src/inventory/product.resolver.ts`

```typescript
@Query(() => [Product])
@UseGuards(JwtAuthGuard)
products(@Context() context: any) {
  const tenantId = context.req.tenantId;
  
  if (!tenantId) {
    throw new UnauthorizedException('No tenant context');
  }
  
  return this.service.findAllProducts(tenantId);
}
```

**Update service:** `server/src/inventory/inventory.service.ts`

```typescript
findAllProducts(tenantId: string) {
  return this.products.find({ where: { tenantId } });
}
```

---

### Step 8: Test Multi-Tenancy

1. **Create a user with tenantId:**

```sql
-- Update existing test user
UPDATE users 
SET tenant_id = '<your-tenant-id-from-step-3>'
WHERE username = 'test';
```

2. **Login and verify JWT contains tenantId:**

```bash
# Decode your JWT at https://jwt.io
# Should see: { "sub": 1, "tenantId": "abc-123-..." }
```

3. **Create a product:**

```graphql
mutation {
  createProduct(data: {
    name: "Test Product"
    sku: "TST-001"
  }) {
    id
    name
    tenantId
  }
}
```

4. **Verify tenant isolation:**

```sql
-- Check product has correct tenant_id
SELECT id, name, tenant_id FROM products;
```

---

## Switching to Neon (Optional)

If you want **3 GB storage** instead of 500 MB:

### 1. Create Neon Account

1. Go to https://neon.tech
2. Sign up (GitHub/Google)
3. Create a new project
4. Copy connection string

### 2. Update .env

```env
# Replace Supabase with Neon
DB_URL=postgresql://user:password@ep-xyz.us-east-2.aws.neon.tech/neondb?sslmode=require
```

### 3. Run Migration

```bash
psql $DB_URL -f database/migrations/001_add_tenant_support.sql
```

### 4. Benefits of Neon

- ✅ **3 GB storage** (vs 500 MB)
- ✅ **Database branching** (create test branches like Git)
- ✅ **Serverless** (instant cold starts)
- ✅ **Point-in-time restore**

---

## Troubleshooting

### Migration Failed

**Error:** "relation already exists"
- Some tables already exist, that's OK
- Skip to next statement or run only missing parts

### Connection Timeout

**Error:** "Connection timed out"
- Supabase auto-pauses after 7 days inactivity
- Just retry - it will auto-resume

### psql Not Found

**Windows:**
```powershell
# Install PostgreSQL
winget install PostgreSQL.PostgreSQL

# Or download from: https://www.postgresql.org/download/windows/
```

### Can't Connect from Local Machine

- Check Supabase dashboard → Settings → Database → Connection Pooling
- Make sure "Direct Connection" is enabled
- Port should be 6543 (pooler) or 5432 (direct)

---

## Summary

**Current Status:**
- ✅ Supabase PostgreSQL connected
- 🔄 Need to apply tenant migration
- 🔄 Need to update backend entities
- 🔄 Need to add tenant middleware

**Next Steps:**
1. Apply migration (Step 1)
2. Create test tenant (Step 3)
3. Update entities (Step 4)
4. Add middleware (Step 5-6)
5. Test isolation (Step 8)

**Recommendation:** Stick with Supabase for now. It's working well and has everything you need for development!
