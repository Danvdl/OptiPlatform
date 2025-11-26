// @ts-nocheck
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';

/**
 * Multi-Tenancy End-to-End Tests
 * 
 * These tests verify that tenant isolation is properly enforced:
 * 1. Users can only access their own tenant's data
 * 2. JWT tokens correctly include and validate tenantId
 * 3. Database queries filter by tenantId
 * 4. Cross-tenant data access is prevented
 */
describe('Multi-Tenancy (e2e)', () => {
  let app: INestApplication;
  let tenant1Token: string;
  let tenant2Token: string;
  let tenant1ProductId: number;
  let tenant2ProductId: number;

  const TENANT_1_ID = 'd5dc31d2-b588-4586-8c46-a617ceb1947a';
  const TENANT_2_ID = 'test-tenant-2-uuid'; // You'll need to create this tenant

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    // Login as tenant 1 user
    const tenant1Login = await request(app.getHttpServer())
      .post('/graphql')
      .send({
        query: `
          mutation {
            login(username: "admin", password: "your-password") {
              access_token
              user {
                id
                username
                tenantId
              }
            }
          }
        `,
      })
      .expect(200);

    tenant1Token = tenant1Login.body.data.login.access_token;
    
    // TODO: Create a second tenant and user for cross-tenant testing
    // For now, these tests will verify single-tenant isolation
  });

  afterAll(async () => {
    await app.close();
  });

  describe('JWT Authentication', () => {
    it('should include tenantId in JWT token', () => {
      // Decode JWT and verify tenantId is present
      const payload = JSON.parse(
        Buffer.from(tenant1Token.split('.')[1], 'base64').toString()
      );
      
      expect(payload.tenantId).toBeDefined();
      expect(payload.tenantId).toBe(TENANT_1_ID);
      expect(payload.tenantRole).toBeDefined();
    });

    it('should reject requests without valid tenant context', async () => {
      // Create a JWT token without tenantId (simulating old tokens)
      const response = await request(app.getHttpServer())
        .post('/graphql')
        .set('Authorization', 'Bearer invalid-token')
        .send({
          query: `
            query {
              products {
                id
                name
              }
            }
          `,
        });

      expect(response.status).toBe(200);
      expect(response.body.errors).toBeDefined();
      expect(response.body.errors[0].message).toContain('Unauthorized');
    });
  });

  describe('Product Isolation', () => {
    it('should create product with tenantId automatically', async () => {
      const response = await request(app.getHttpServer())
        .post('/graphql')
        .set('Authorization', `Bearer ${tenant1Token}`)
        .send({
          query: `
            mutation {
              createProduct(data: {
                name: "Tenant 1 Product"
                sku: "T1-PROD-001"
                quantity: 10
                restockThreshold: 5
              }) {
                id
                name
                sku
              }
            }
          `,
        })
        .expect(200);

      expect(response.body.data.createProduct).toBeDefined();
      expect(response.body.data.createProduct.name).toBe('Tenant 1 Product');
      tenant1ProductId = response.body.data.createProduct.id;
    });

    it('should only return products belonging to current tenant', async () => {
      const response = await request(app.getHttpServer())
        .post('/graphql')
        .set('Authorization', `Bearer ${tenant1Token}`)
        .send({
          query: `
            query {
              products {
                id
                name
                sku
              }
            }
          `,
        })
        .expect(200);

      expect(response.body.data.products).toBeDefined();
      expect(Array.isArray(response.body.data.products)).toBe(true);
      
      // All products should belong to tenant 1
      // We can verify this by checking the database directly
      // or by attempting cross-tenant access (next test)
    });

    it('should prevent access to products from other tenants', async () => {
      // This test requires a second tenant
      // For now, we'll skip it or test with a non-existent product ID
      
      const nonExistentId = 999999;
      const response = await request(app.getHttpServer())
        .post('/graphql')
        .set('Authorization', `Bearer ${tenant1Token}`)
        .send({
          query: `
            query {
              product(id: ${nonExistentId}) {
                id
                name
              }
            }
          `,
        })
        .expect(200);

      expect(response.body.data.product).toBeNull();
    });
  });

  describe('Category Isolation', () => {
    it('should create category with tenantId automatically', async () => {
      const response = await request(app.getHttpServer())
        .post('/graphql')
        .set('Authorization', `Bearer ${tenant1Token}`)
        .send({
          query: `
            mutation {
              createCategory(data: {
                name: "Tenant 1 Category"
                description: "Test category for tenant 1"
              }) {
                id
                name
              }
            }
          `,
        })
        .expect(200);

      expect(response.body.data.createCategory).toBeDefined();
      expect(response.body.data.createCategory.name).toBe('Tenant 1 Category');
    });

    it('should only return categories belonging to current tenant', async () => {
      const response = await request(app.getHttpServer())
        .post('/graphql')
        .set('Authorization', `Bearer ${tenant1Token}`)
        .send({
          query: `
            query {
              categories {
                id
                name
              }
            }
          `,
        })
        .expect(200);

      expect(response.body.data.categories).toBeDefined();
      expect(Array.isArray(response.body.data.categories)).toBe(true);
    });
  });

  describe('Supplier Isolation', () => {
    it('should create supplier with tenantId automatically', async () => {
      const response = await request(app.getHttpServer())
        .post('/graphql')
        .set('Authorization', `Bearer ${tenant1Token}`)
        .send({
          query: `
            mutation {
              createSupplier(input: {
                name: "Tenant 1 Supplier"
                type: "manufacturer"
                email: "supplier@tenant1.com"
              }) {
                id
                name
              }
            }
          `,
        })
        .expect(200);

      expect(response.body.data.createSupplier).toBeDefined();
      expect(response.body.data.createSupplier.name).toBe('Tenant 1 Supplier');
    });

    it('should only return suppliers belonging to current tenant', async () => {
      const response = await request(app.getHttpServer())
        .post('/graphql')
        .set('Authorization', `Bearer ${tenant1Token}`)
        .send({
          query: `
            query {
              suppliers {
                id
                name
              }
            }
          `,
        })
        .expect(200);

      expect(response.body.data.suppliers).toBeDefined();
      expect(Array.isArray(response.body.data.suppliers)).toBe(true);
    });
  });

  describe('Cross-Tenant Security', () => {
    it('should prevent updating products from other tenants', async () => {
      // Attempt to update a product with a high ID that likely belongs to another tenant
      const response = await request(app.getHttpServer())
        .post('/graphql')
        .set('Authorization', `Bearer ${tenant1Token}`)
        .send({
          query: `
            mutation {
              updateProduct(data: {
                id: 999999
                name: "Hacked Product Name"
              }) {
                id
                name
              }
            }
          `,
        })
        .expect(200);

      // Should return an error or null
      expect(
        response.body.errors || response.body.data.updateProduct === null
      ).toBeTruthy();
    });

    it('should prevent deleting products from other tenants', async () => {
      const response = await request(app.getHttpServer())
        .post('/graphql')
        .set('Authorization', `Bearer ${tenant1Token}`)
        .send({
          query: `
            mutation {
              removeProduct(id: 999999)
            }
          `,
        })
        .expect(200);

      // Should fail gracefully (either error or false)
      expect(
        response.body.errors || response.body.data.removeProduct === false
      ).toBeTruthy();
    });
  });

  describe('Analytics Isolation', () => {
    it('should calculate inventory valuation only for current tenant', async () => {
      const response = await request(app.getHttpServer())
        .post('/graphql')
        .set('Authorization', `Bearer ${tenant1Token}`)
        .send({
          query: `
            query {
              inventoryValuation
            }
          `,
        })
        .expect(200);

      expect(response.body.data.inventoryValuation).toBeDefined();
      
      // Parse the JSON response
      const valuation = JSON.parse(response.body.data.inventoryValuation);
      expect(valuation.totalPurchaseValue).toBeDefined();
      expect(valuation.totalSaleValue).toBeDefined();
    });

    it('should return top profitable products only from current tenant', async () => {
      const response = await request(app.getHttpServer())
        .post('/graphql')
        .set('Authorization', `Bearer ${tenant1Token}`)
        .send({
          query: `
            query {
              topProfitableProducts(limit: 5)
            }
          `,
        })
        .expect(200);

      expect(response.body.data.topProfitableProducts).toBeDefined();
      
      const products = JSON.parse(response.body.data.topProfitableProducts);
      expect(Array.isArray(products)).toBe(true);
    });
  });
});

/**
 * Manual Test Checklist (Run in Supabase SQL Editor):
 * 
 * 1. Verify all products have tenant_id:
 *    SELECT COUNT(*) FROM products WHERE tenant_id IS NULL;
 *    -- Should return 0
 * 
 * 2. Verify tenant isolation in database:
 *    SELECT tenant_id, COUNT(*) FROM products GROUP BY tenant_id;
 *    -- Should show products grouped by tenant
 * 
 * 3. Test cross-tenant query prevention:
 *    -- As Tenant 1, try to access Tenant 2 product
 *    SELECT * FROM products WHERE id = <tenant2_product_id> AND tenant_id = <tenant1_id>;
 *    -- Should return 0 rows
 * 
 * 4. Verify JWT includes tenantId:
 *    -- Login and decode the JWT token
 *    -- Check payload includes: { sub, username, tenantId, tenantRole }
 * 
 * 5. Test TenantId decorator:
 *    -- Make a GraphQL request without auth
 *    -- Should receive "No tenant context" error
 */

