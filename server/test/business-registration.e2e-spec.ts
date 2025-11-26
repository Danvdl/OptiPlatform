import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Tenant } from '../src/tenants/entities/tenant.entity';
import { User } from '../src/user/user.entity';

describe('Business Registration Flow (E2E)', () => {
  let app: INestApplication;
  let tenantRepository: any;
  let userRepository: any;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    tenantRepository = moduleFixture.get(getRepositoryToken(Tenant));
    userRepository = moduleFixture.get(getRepositoryToken(User));
  });

  afterAll(async () => {
    await app.close();
  });

  describe('POST /graphql - registerBusiness', () => {
    const registerMutation = `
      mutation RegisterBusiness($input: RegisterTenantInput!) {
        registerBusiness(input: $input) {
          accessToken
          tenant {
            id
            slug
            businessName
            plan
            status
            maxUsers
            maxProducts
          }
          user {
            id
            username
            email
            tenantRole
          }
          message
        }
      }
    `;

    it('should successfully register a new business', () => {
      const uniqueId = Date.now();
      return request(app.getHttpServer())
        .post('/graphql')
        .send({
          query: registerMutation,
          variables: {
            input: {
              username: `testowner${uniqueId}`,
              email: `test${uniqueId}@example.com`,
              password: 'password123',
              firstName: 'John',
              lastName: 'Doe',
              businessName: `Test Corp ${uniqueId}`,
              industry: 'RETAIL',
              companySize: 'SMALL',
              currency: 'USD',
              timezone: 'America/New_York',
              country: 'US',
            },
          },
        })
        .expect(200)
        .expect((res) => {
          expect(res.body.data.registerBusiness.accessToken).toBeDefined();
          expect(res.body.data.registerBusiness.tenant.slug).toMatch(/test-corp/);
          expect(res.body.data.registerBusiness.tenant.plan).toBe('FREE');
          expect(res.body.data.registerBusiness.tenant.maxUsers).toBe(5);
          expect(res.body.data.registerBusiness.user.tenantRole).toBe('owner');
        });
    });

    it('should reject duplicate username', async () => {
      const uniqueId = Date.now();
      const input = {
        username: `duplicate${uniqueId}`,
        email: `email1${uniqueId}@example.com`,
        password: 'password123',
        firstName: 'John',
        businessName: `Business ${uniqueId}`,
        industry: 'RETAIL',
        companySize: 'SMALL',
        currency: 'USD',
        timezone: 'UTC',
        country: 'US',
      };

      // First registration
      await request(app.getHttpServer())
        .post('/graphql')
        .send({ query: registerMutation, variables: { input } })
        .expect(200);

      // Second registration with same username
      return request(app.getHttpServer())
        .post('/graphql')
        .send({
          query: registerMutation,
          variables: {
            input: { ...input, email: `email2${uniqueId}@example.com` },
          },
        })
        .expect(200)
        .expect((res) => {
          expect(res.body.errors).toBeDefined();
          expect(res.body.errors[0].message).toContain('already exists');
        });
    });
  });

  describe('Complete Registration + Team Management Flow', () => {
    let authToken: string;
    let tenantId: string;

    it('should register business and get auth token', async () => {
      const uniqueId = Date.now();
      const response = await request(app.getHttpServer())
        .post('/graphql')
        .send({
          query: `
            mutation {
              registerBusiness(input: {
                username: "flowtest${uniqueId}"
                email: "flow${uniqueId}@example.com"
                password: "password123"
                firstName: "Flow"
                lastName: "Test"
                businessName: "Flow Test Corp ${uniqueId}"
                industry: RETAIL
                companySize: SMALL
                currency: "USD"
                timezone: "UTC"
                country: "US"
              }) {
                accessToken
                tenant { id }
              }
            }
          `,
        })
        .expect(200);

      authToken = response.body.data.registerBusiness.accessToken;
      tenantId = response.body.data.registerBusiness.tenant.id;
      expect(authToken).toBeDefined();
    });

    it('should fetch business profile with token', async () => {
      const response = await request(app.getHttpServer())
        .post('/graphql')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          query: `
            query {
              myBusiness {
                id
                businessName
                plan
                status
              }
            }
          `,
        })
        .expect(200);

      expect(response.body.data.myBusiness.id).toBe(tenantId);
    });

    it('should create a team member', async () => {
      const uniqueId = Date.now();
      const response = await request(app.getHttpServer())
        .post('/graphql')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          query: `
            mutation {
              createTeamMember(input: {
                username: "member${uniqueId}"
                email: "member${uniqueId}@example.com"
                password: "password123"
                firstName: "Team"
                lastName: "Member"
                tenantRole: "member"
              }) {
                user {
                  username
                  tenantRole
                }
              }
            }
          `,
        })
        .expect(200);

      expect(response.body.data.createTeamMember.user.tenantRole).toBe('member');
    });

    it('should list all team members', async () => {
      const response = await request(app.getHttpServer())
        .post('/graphql')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          query: `
            query {
              teamMembers {
                username
                tenantRole
              }
            }
          `,
        })
        .expect(200);

      expect(response.body.data.teamMembers.length).toBeGreaterThanOrEqual(2);
    });
  });
});
