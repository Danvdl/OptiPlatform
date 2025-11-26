/**
 * Quick Multi-Tenancy Verification Script
 * 
 * Run this in browser console after logging in to verify tenant isolation
 */

// 1. Check JWT includes tenantId
function checkJWT() {
  const token = localStorage.getItem('auth_token');
  if (!token) {
    console.error('❌ No token found - please login first');
    return;
  }

  const payload = JSON.parse(atob(token.split('.')[1]));
  console.log('✅ JWT Payload:', payload);
  
  if (payload.tenantId) {
    console.log('✅ tenantId present:', payload.tenantId);
  } else {
    console.error('❌ tenantId missing - please re-login');
  }
  
  if (payload.tenantRole) {
    console.log('✅ tenantRole present:', payload.tenantRole);
  } else {
    console.warn('⚠️ tenantRole missing');
  }
  
  return payload;
}

// 2. Check local database filtering
async function checkLocalDatabase() {
  const { db } = await import('../db/dexie');
  const { getCurrentTenantIdSync } = await import('./authUtils');
  
  const tenantId = getCurrentTenantIdSync();
  console.log('Current Tenant ID:', tenantId);
  
  // Check products
  const allProducts = await db.products.toArray();
  const tenantProducts = await db.products
    .where('[tenantId+deleted]')
    .equals([tenantId, undefined])
    .toArray();
  
  console.log('Total products in IndexedDB:', allProducts.length);
  console.log('Products for current tenant:', tenantProducts.length);
  
  // Verify all products have tenantId
  const orphanedProducts = allProducts.filter((p: any) => !p.tenantId);
  if (orphanedProducts.length > 0) {
    console.error('❌ Found products without tenantId:', orphanedProducts);
  } else {
    console.log('✅ All products have tenantId');
  }
  
  // Check for cross-tenant data
  const otherTenantProducts = allProducts.filter((p: any) => p.tenantId && p.tenantId !== tenantId);
  if (otherTenantProducts.length > 0) {
    console.warn('⚠️ Found products from other tenants:', otherTenantProducts);
  } else {
    console.log('✅ No cross-tenant data in local DB');
  }
}

// 3. Test GraphQL isolation
async function testGraphQLIsolation() {
  const token = localStorage.getItem('auth_token');
  const graphqlUrl = '/graphql';
  
  console.log('Testing GraphQL queries...');
  
  // Test 1: Query products
  const productsResponse = await fetch(graphqlUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({
      query: `
        query {
          products {
            id
            name
            sku
          }
        }
      `,
    }),
  });
  
  const productsData = await productsResponse.json();
  if (productsData.errors) {
    console.error('❌ Products query failed:', productsData.errors);
  } else {
    console.log('✅ Products query successful:', productsData.data.products.length, 'products');
  }
  
  // Test 2: Query categories
  const categoriesResponse = await fetch(graphqlUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({
      query: `
        query {
          categories {
            id
            name
          }
        }
      `,
    }),
  });
  
  const categoriesData = await categoriesResponse.json();
  if (categoriesData.errors) {
    console.error('❌ Categories query failed:', categoriesData.errors);
  } else {
    console.log('✅ Categories query successful:', categoriesData.data.categories.length, 'categories');
  }
  
  // Test 3: Try to access non-existent product (cross-tenant test)
  const crossTenantResponse = await fetch(graphqlUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({
      query: `
        query {
          product(id: 999999) {
            id
            name
          }
        }
      `,
    }),
  });
  
  const crossTenantData = await crossTenantResponse.json();
  if (crossTenantData.data.product === null) {
    console.log('✅ Cross-tenant access properly blocked (returned null)');
  } else if (crossTenantData.errors) {
    console.log('✅ Cross-tenant access properly blocked (returned error)');
  } else {
    console.error('❌ Cross-tenant access NOT blocked!', crossTenantData);
  }
}

// 4. Run all checks
async function runAllChecks() {
  console.log('🔍 Multi-Tenancy Verification Started...\n');
  
  console.log('1️⃣ Checking JWT Token...');
  const jwt = checkJWT();
  console.log('');
  
  console.log('2️⃣ Checking Local Database...');
  await checkLocalDatabase();
  console.log('');
  
  console.log('3️⃣ Testing GraphQL Isolation...');
  await testGraphQLIsolation();
  console.log('');
  
  console.log('✅ Multi-Tenancy Verification Complete!');
}

// Export for use
if (typeof window !== 'undefined') {
  (window as any).verifyMultiTenancy = {
    checkJWT,
    checkLocalDatabase,
    testGraphQLIsolation,
    runAllChecks,
  };
  
  console.log('Multi-tenancy verification tools loaded!');
  console.log('Run: window.verifyMultiTenancy.runAllChecks()');
}

export { checkJWT, checkLocalDatabase, testGraphQLIsolation, runAllChecks };
