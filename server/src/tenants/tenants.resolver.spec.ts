import { Test, TestingModule } from '@nestjs/testing';
import { vi } from 'vitest';
import { TenantsResolver } from './tenants.resolver';
import { TenantsService } from './tenants.service';
import { AuthService } from '../auth/auth.service';
import { RegisterTenantInput } from './dto/register-tenant.input';
import { TenantUserRole } from './dto/team-member.input';
import { IndustryType, CompanySize } from './entities/tenant.entity';
import { User } from '../user/user.entity';

describe('TenantsResolver', () => {
  let resolver: TenantsResolver;
  let service: TenantsService;

  const mockTenantsService = {
    registerTenant: vi.fn(),
    findTenant: vi.fn(),
    getTenantById: vi.fn(),
    updateTenant: vi.fn(),
    createTeamMember: vi.fn(),
    updateTeamMember: vi.fn(),
    removeTeamMember: vi.fn(),
    getTeamMembers: vi.fn(),
    getBusinessSettings: vi.fn(),
    getTenantSettings: vi.fn(),
    completeOnboardingStep: vi.fn(),
  };

  const mockAuthService = {
    login: vi.fn().mockResolvedValue('mock-token'),
    generateToken: vi.fn().mockResolvedValue('mock-token'),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TenantsResolver,
        {
          provide: TenantsService,
          useValue: mockTenantsService,
        },
        {
          provide: AuthService,
          useValue: mockAuthService,
        },
      ],
    }).compile();

    resolver = module.get<TenantsResolver>(TenantsResolver);
    service = module.get<TenantsService>(TenantsService);

    vi.clearAllMocks();
  });

  it('should be defined', () => {
    expect(resolver).toBeDefined();
  });

  describe('registerBusiness', () => {
    it('should register a new business', async () => {
      const input: RegisterTenantInput = {
        username: 'testowner',
        email: 'test@example.com',
        password: 'password123',
        firstName: 'John',
        lastName: 'Doe',
        businessName: 'Test Corp',
        industry: IndustryType.RETAIL,
        companySize: CompanySize.SMALL,
        currency: 'USD',
        timezone: 'UTC',
        country: 'US',
      };

      const mockResponse = {
        accessToken: 'mock-token',
        tenant: { id: '123', slug: 'test-corp' },
        user: { id: 1, username: 'testowner' },
        message: 'Success',
      };

      const mockServiceResponse = {
        tenant: { id: '123', slug: 'test-corp' },
        user: { id: 1, username: 'testowner' },
      };

      mockTenantsService.registerTenant.mockResolvedValue(mockServiceResponse);
      mockAuthService.login.mockResolvedValue('mock-token');

      const result = await resolver.registerBusiness(input);

      expect(result.accessToken).toBe('mock-token');
      expect(result.tenant).toEqual(mockServiceResponse.tenant);
      expect(result.user).toEqual(mockServiceResponse.user);
      expect(result.message).toContain('Welcome to OptiPlatform');
      expect(mockAuthService.login).toHaveBeenCalledWith(mockServiceResponse.user);
      expect(service.registerTenant).toHaveBeenCalledWith(input);
    });
  });

  describe('myBusiness', () => {
    it('should return current user business', async () => {
      const tenantId = '123';

      const mockTenant = {
        id: '123',
        businessName: 'Test Corp',
      };

      mockTenantsService.findTenant.mockResolvedValue(mockTenant);

      const result = await resolver.myBusiness(tenantId);

      expect(result).toEqual(mockTenant);
      expect(service.findTenant).toHaveBeenCalledWith('123');
    });
  });

  describe('teamMembers', () => {
    it('should return all team members', async () => {
      const tenantId = '123';

      const mockMembers = [
        { id: 1, username: 'owner' },
        { id: 2, username: 'member' },
      ];

      mockTenantsService.getTeamMembers.mockResolvedValue(mockMembers);

      const result = await resolver.teamMembers(tenantId);

      expect(result).toEqual(mockMembers);
      expect(service.getTeamMembers).toHaveBeenCalledWith('123');
    });
  });

  describe('createTeamMember', () => {
    it('should create a new team member', async () => {
      const tenantId = '123';
      const mockUser = {
        id: 1,
        tenantId: '123',
        tenantRole: 'owner',
      } as User;

      const input = {
        username: 'newmember',
        email: 'member@example.com',
        password: 'password123',
        firstName: 'Jane',
        tenantRole: TenantUserRole.MEMBER,
      };

      const mockResponse = {
        user: { id: 2, username: 'newmember' },
        invitationSent: false,
      };

      mockTenantsService.createTeamMember.mockResolvedValue({ id: 2, username: 'newmember' });

      const result = await resolver.createTeamMember(input, tenantId, mockUser);

      expect(result).toBeDefined();
      expect(service.createTeamMember).toHaveBeenCalledWith(tenantId, input);
    });
  });

  describe('updateTeamMember', () => {
    it('should update team member', async () => {
      const tenantId = '123';
      const mockUser = {
        id: 1,
        tenantId: '123',
        tenantRole: 'owner',
      } as User;

      const input = {
        userId: 2,
        tenantRole: TenantUserRole.ADMIN,
      };

      const mockUpdatedUser = {
        id: 2,
        tenantRole: 'admin',
      };

      mockTenantsService.updateTeamMember.mockResolvedValue(mockUpdatedUser);

      const result = await resolver.updateTeamMember(input, tenantId, mockUser);

      expect(result).toEqual(mockUpdatedUser);
      expect(service.updateTeamMember).toHaveBeenCalledWith(tenantId, input.userId, input);
    });
  });

  describe('removeTeamMember', () => {
    it('should remove team member', async () => {
      const tenantId = '123';
      const mockUser = {
        id: 1,
        tenantId: '123',
        tenantRole: 'owner',
      } as User;

      mockTenantsService.removeTeamMember.mockResolvedValue(true);

      const result = await resolver.removeTeamMember(2, tenantId, mockUser);

      expect(result).toBe(true);
      expect(service.removeTeamMember).toHaveBeenCalledWith(tenantId, 2);
    });
  });

  describe('businessSettings', () => {
    it('should return business settings', async () => {
      const tenantId = '123';

      const mockSettings = {
        currentUsers: 2,
        maxUsers: 5,
        currentProducts: 10,
        maxProducts: 100,
        plan: 'FREE',
        status: 'TRIAL',
        daysUntilTrialEnd: 12,
      };

      mockTenantsService.getTenantSettings.mockResolvedValue(mockSettings);

      const result = await resolver.businessSettings(tenantId);

      expect(result).toBeDefined();
      expect(service.getTenantSettings).toHaveBeenCalledWith('123');
    });
  });
});
