# Quick Start: Business Registration System

## 🚀 Getting Started (3 Steps)

### Step 1: Run Database Migration

1. Open your Supabase dashboard
2. Navigate to SQL Editor
3. Copy and paste the entire contents of `database/migrations/03_tenant_business_profile.sql`
4. Click "Run"
5. Verify success by running:
   ```sql
   SELECT business_name, industry, max_users, max_products 
   FROM tenants 
   LIMIT 1;
   ```

### Step 2: Restart TypeScript Server

**In VS Code:**
1. Press `Cmd/Ctrl + Shift + P`
2. Type "TypeScript: Restart TS Server"
3. Press Enter
4. Wait for TypeScript to recognize Apollo Client

### Step 3: Test the Registration Flow

1. Start your development server:
   ```bash
   npm run dev
   ```

2. Navigate to the registration component (or create a test route)

3. Test the GraphQL endpoint directly in GraphQL Playground:
   ```graphql
   mutation TestRegistration {
     registerBusiness(input: {
       username: "testuser"
       email: "test@example.com"
       password: "password123"
       firstName: "Test"
       lastName: "User"
       businessName: "Test Business LLC"
       industry: "retail"
       companySize: "1"
       currency: "USD"
       timezone: "UTC"
     }) {
       accessToken
       tenant {
         id
         name
         slug
         businessName
         plan
         status
         trialEndsAt
         maxUsers
         maxProducts
       }
       user {
         id
         username
         email
         firstName
         lastName
         tenantRole
       }
       message
     }
   }
   ```

---

## 📋 Verification Checklist

After running the migration, verify these fields exist:

```sql
-- Check tenant table columns
SELECT column_name 
FROM information_schema.columns 
WHERE table_name = 'tenants' 
AND column_name IN (
  'business_name',
  'legal_name',
  'tax_id',
  'industry',
  'company_size',
  'website',
  'phone_number',
  'support_email',
  'address_line1',
  'city',
  'state',
  'postal_code',
  'country',
  'currency',
  'timezone',
  'language',
  'trial_ends_at',
  'max_users',
  'max_products',
  'onboarding_completed',
  'onboarding_step'
);
```

Expected result: 22 rows

---

## 🧪 Quick Test Script

**Test 1: Register a Business**
```graphql
mutation {
  registerBusiness(input: {
    username: "acmeowner"
    email: "owner@acme.com"
    password: "securepass123"
    firstName: "John"
    lastName: "Doe"
    businessName: "Acme Corporation"
    legalName: "Acme Corporation Inc."
    taxId: "12-3456789"
    industry: "retail"
    companySize: "2-10"
    website: "https://acme.com"
    phoneNumber: "+1-555-0100"
    addressLine1: "123 Main St"
    city: "New York"
    state: "NY"
    postalCode: "10001"
    country: "US"
    currency: "USD"
    timezone: "America/New_York"
  }) {
    accessToken
    tenant { id, slug, businessName, maxUsers, maxProducts }
    user { id, username, tenantRole }
    message
  }
}
```

**Test 2: Get Business Profile** (use JWT from test 1)
```graphql
query {
  myBusiness {
    id
    slug
    businessName
    industry
    plan
    status
  }
}
```

**Test 3: Get Business Settings**
```graphql
query {
  businessSettings {
    tenant { businessName, maxUsers, maxProducts }
    totalUsers
    totalProducts
    daysUntilTrialEnds
  }
}
```

**Test 4: Create Team Member** (owner/admin only)
```graphql
mutation {
  createTeamMember(input: {
    username: "janedoe"
    email: "jane@acme.com"
    password: "password123"
    firstName: "Jane"
    lastName: "Doe"
    tenantRole: "manager"
    department: "Warehouse"
    position: "Warehouse Manager"
  }) {
    user {
      id
      username
      email
      tenantRole
      department
    }
  }
}
```

**Test 5: List Team Members**
```graphql
query {
  teamMembers {
    id
    username
    email
    firstName
    lastName
    tenantRole
    department
    position
    status
    createdAt
  }
}
```

**Test 6: Update Business Profile**
```graphql
mutation {
  updateBusiness(input: {
    phoneNumber: "+1-555-0101"
    website: "https://www.acme.com"
    addressLine2: "Suite 500"
  }) {
    id
    businessName
    phoneNumber
    website
    addressLine2
  }
}
```

**Test 7: Test Plan Limit** (create 6 users on free plan)
```graphql
# Should fail with error: "User limit reached (5 users)"
mutation {
  createTeamMember(input: {
    username: "user6"
    email: "user6@acme.com"
    password: "password123"
    firstName: "User"
    lastName: "Six"
    tenantRole: "member"
  }) {
    user { id }
  }
}
```

**Test 8: Test Owner Protection** (try to edit owner)
```graphql
# Should fail with error: "Cannot modify the owner role"
mutation {
  updateTeamMember(input: {
    userId: 1  # Owner's user ID
    tenantRole: "admin"
  }) {
    id
  }
}
```

---

## 🔍 Troubleshooting

### Issue: TypeScript errors about Apollo Client

**Solution:**
```bash
# Verify package installed
npm list @apollo/client

# If not installed:
npm install @apollo/client graphql

# Restart TS server in VS Code
# Cmd/Ctrl + Shift + P → "TypeScript: Restart TS Server"
```

### Issue: Database migration fails

**Check:**
1. Supabase connection is active
2. You have permission to ALTER TABLE
3. Run verification query to see which columns are missing
4. Re-run specific ALTER statements if needed

### Issue: GraphQL mutation fails

**Debug:**
1. Check server logs for errors
2. Verify JWT is included in request headers
3. Check if TenantsModule is imported in app.module.ts
4. Restart NestJS server

### Issue: Can't create team members

**Possible causes:**
1. Current user is not owner/admin
2. Plan limit reached (check businessSettings)
3. Email/username already exists
4. Missing required fields

---

## 📊 Expected Database State After Tests

After running all test scripts, your database should have:

**Tenants Table:**
- 1 row: Acme Corporation
  - slug: "acme-corporation"
  - plan: "free"
  - status: "trial"
  - max_users: 5
  - max_products: 100
  - trial_ends_at: ~14 days from now

**Users Table:**
- User 1: John Doe (owner)
  - tenant_role: "owner"
- User 2: Jane Doe (manager)
  - tenant_role: "manager"

**Usage Stats:**
- Total users: 2/5
- Total products: 0/100
- Days until trial ends: 14

---

## 🎯 Integration with Existing App

### Option 1: Add to Router

```typescript
// src/App.tsx or src/router.tsx
import { BusinessRegistrationForm } from './components/auth/BusinessRegistrationForm';
import { BusinessSettings } from './components/settings/BusinessSettings';

// Add routes:
<Routes>
  <Route path="/register" element={<BusinessRegistrationForm />} />
  <Route path="/settings" element={<BusinessSettings />} />
  {/* Existing routes */}
</Routes>
```

### Option 2: Replace Existing Login

```typescript
// If you have an existing login page, add a link:
<Link to="/register">
  Don't have an account? Register your business
</Link>
```

### Option 3: Create Landing Page

```typescript
// src/pages/Landing.tsx
export const Landing = () => (
  <div>
    <h1>Welcome to OptiPlatform</h1>
    <Link to="/register">Start Free Trial</Link>
    <Link to="/login">Sign In</Link>
  </div>
);
```

---

## ✅ Success Criteria

Your implementation is working correctly if:

- [x] ✅ Database migration runs without errors
- [x] ✅ TypeScript compiles without errors
- [x] ✅ Can register new business via GraphQL
- [x] ✅ JWT is returned with tenantId
- [x] ✅ Can query myBusiness
- [x] ✅ Can create team members
- [x] ✅ Plan limits are enforced
- [x] ✅ Owner cannot be edited/removed
- [x] ✅ Usage stats are accurate

---

## 📞 Next Steps

1. **Run the migration** (5 minutes)
2. **Test GraphQL endpoints** (15 minutes)
3. **Integrate into router** (10 minutes)
4. **Create onboarding flow** (1-2 hours)
5. **Add to production roadmap** ✨

**You're ready to go! 🚀**
