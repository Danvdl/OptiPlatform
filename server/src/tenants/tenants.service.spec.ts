import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { vi } from 'vitest';
import { TenantsService } from './tenants.service';
import { Tenant, TenantPlan, TenantStatus, IndustryType, CompanySize } from './entities/tenant.entity';
import { User, UserRole, UserStatus } from '../user/user.entity';
import { RegisterTenantInput } from './dto/register-tenant.input';
import { CreateTeamMemberInput, TenantUserRole } from './dto/team-member.input';
import * as bcrypt from 'bcrypt';

// Mock bcrypt
vi.mock('bcrypt');

describe('TenantsService', () => {
  let service: TenantsService;
  let tenantRepository: Repository<Tenant>;
  let userRepository: Repository<User>;

  const mockTenantRepository = {
    findOne: vi.fn(),
    create: vi.fn(),
    save: vi.fn(),
    count: vi.fn(),
    find: vi.fn(),
  };

  const mockUserRepository = {
    findOne: vi.fn(),
    create: vi.fn(),
    save: vi.fn(),
    count: vi.fn(),
    find: vi.fn(),
    remove: vi.fn(),
  };

  const mockTenant: Partial<Tenant> = {
    id: 'tenant-123',
    name: 'Test Business',
    slug: 'test-business',
    businessName: 'Test Business Inc',
    plan: TenantPlan.FREE,
    status: TenantStatus.TRIAL,
    maxUsers: 5,
    maxProducts: 100,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TenantsService,
        {
          provide: getRepositoryToken(Tenant),
          useValue: mockTenantRepository,
        },
        {
          provide: getRepositoryToken(User),
          useValue: mockUserRepository,
        },
      ],
    }).compile();

    service = module.get<TenantsService>(TenantsService);
    tenantRepository = module.get(getRepositoryToken(Tenant));
    userRepository = module.get(getRepositoryToken(User));

    // Reset mocks before each test
    vi.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('registerTenant', () => {
    const mockInput: RegisterTenantInput = {
      username: 'testowner',
      email: 'owner@test.com',
      password: 'password123',
      firstName: 'Test',
      lastName: 'Owner',
      businessName: 'Test Business',
      industry: IndustryType.RETAIL,
      companySize: CompanySize.SMALL,
      currency: 'USD',
      timezone: 'America/New_York',
      city: 'New York',
      state: 'NY',
      country: 'US',
    };

    it('should successfully register a new tenant and owner', async () => {
      const mockSavedTenant = { ...mockTenant, id: 'new-tenant-id' };
      const mockSavedUser = {
        id: 1,
        username: mockInput.username,
        email: mockInput.email,
        tenantId: mockSavedTenant.id,
        tenantRole: 'owner',
      };

      mockUserRepository.findOne.mockResolvedValue(null);
      mockTenantRepository.create.mockReturnValue(mockSavedTenant as Tenant);
      mockTenantRepository.save.mockResolvedValue(mockSavedTenant as Tenant);
      mockUserRepository.create.mockReturnValue(mockSavedUser as User);
      mockUserRepository.save.mockResolvedValue(mockSavedUser as User);
      (bcrypt.hash as any).mockResolvedValue('hashed-password');

      const result = await service.registerTenant(mockInput);

      expect(result).toHaveProperty('tenant');
      expect(result).toHaveProperty('user');
      expect(result.tenant.slug).toBe('test-business');
      expect(result.user.tenantRole).toBe('owner');
      expect(mockTenantRepository.save).toHaveBeenCalled();
      expect(mockUserRepository.save).toHaveBeenCalled();
    });

    it('should throw error if email already exists', async () => {
      mockUserRepository.findOne.mockResolvedValue({ email: mockInput.email } as User);

      await expect(service.registerTenant(mockInput)).rejects.toThrow('Email already registered');
    });

    it('should throw error if username already exists', async () => {
      mockUserRepository.findOne.mockResolvedValue({ username: mockInput.username } as User);

      await expect(service.registerTenant(mockInput)).rejects.toThrow('Username already taken');
    });
  });

  describe('createTeamMember', () => {
    const mockInput: CreateTeamMemberInput = {
      username: 'newmember',
      email: 'member@example.com',
      password: 'password123',
      firstName: 'New',
      lastName: 'Member',
      tenantRole: TenantUserRole.MEMBER,
    };

    beforeEach(() => {
      mockTenantRepository.findOne.mockResolvedValue(mockTenant as Tenant);
    });

    it('should create a new team member', async () => {
      const mockNewUser = {
        id: 2,
        username: 'newmember',
        email: 'member@example.com',
        tenantId: mockTenant.id,
        tenantRole: 'member',
      };

      mockUserRepository.findOne.mockResolvedValue(null);
      mockUserRepository.count.mockResolvedValue(2); // 2 existing users
      mockUserRepository.create.mockReturnValue(mockNewUser as User);
      mockUserRepository.save.mockResolvedValue(mockNewUser as User);
      (bcrypt.hash as any).mockResolvedValue('hashed-password');

      const result = await service.createTeamMember(mockTenant.id!, mockInput);

      expect(result).toEqual(mockNewUser);
      expect(mockUserRepository.save).toHaveBeenCalled();
      expect(bcrypt.hash).toHaveBeenCalledWith('password123', 10);
    });

    it('should throw error if username already exists', async () => {
      mockUserRepository.findOne.mockResolvedValue({ id: 2, username: 'newmember' } as User);

      await expect(service.createTeamMember(mockTenant.id!, mockInput)).rejects.toThrow(
        'Username already taken'
      );
    });

    it('should throw error if email already exists', async () => {
      mockUserRepository.findOne.mockResolvedValue({ id: 2, email: mockInput.email } as User);

      await expect(service.createTeamMember(mockTenant.id!, mockInput)).rejects.toThrow(
        'Email already registered'
      );
    });

    it('should throw error if user limit is reached', async () => {
      mockUserRepository.findOne.mockResolvedValue(null);
      mockUserRepository.count.mockResolvedValue(5); // Already at limit of 5

      await expect(service.createTeamMember(mockTenant.id!, mockInput)).rejects.toThrow(
        'User limit reached'
      );
    });
  });

  describe('getTeamMembers', () => {
    it('should return all team members for a tenant', async () => {
      const mockUsers = [
        { id: 1, username: 'owner', tenantRole: 'owner' },
        { id: 2, username: 'member1', tenantRole: 'member' },
      ];

      mockUserRepository.find.mockResolvedValue(mockUsers as User[]);

      const result = await service.getTeamMembers(mockTenant.id!);

      expect(result).toEqual(mockUsers);
      expect(mockUserRepository.find).toHaveBeenCalled();
    });
  });

  describe('updateTeamMember', () => {
    it('should update team member role', async () => {
      const mockUser = {
        id: 2,
        username: 'member1',
        tenantId: mockTenant.id,
        tenantRole: 'member',
      };

      const updatedUser = { ...mockUser, tenantRole: TenantUserRole.ADMIN };

      mockUserRepository.findOne.mockResolvedValue(mockUser as User);
      mockUserRepository.save.mockResolvedValue(updatedUser as User);

      const result = await service.updateTeamMember(mockTenant.id!, 2, {
        userId: 2,
        tenantRole: TenantUserRole.ADMIN,
      });

      expect(result.tenantRole).toBe(TenantUserRole.ADMIN);
      expect(mockUserRepository.save).toHaveBeenCalled();
    });

    it('should throw error when trying to modify owner role', async () => {
      const ownerUser = {
        id: 1,
        username: 'owner',
        tenantId: mockTenant.id,
        tenantRole: TenantUserRole.OWNER,
      };

      mockUserRepository.findOne.mockResolvedValue(ownerUser as User);

      await expect(
        service.updateTeamMember(mockTenant.id!, 1, {
          userId: 1,
          tenantRole: TenantUserRole.ADMIN,
        })
      ).rejects.toThrow('Cannot modify the owner role');
    });

    it('should throw error if user not found', async () => {
      mockUserRepository.findOne.mockResolvedValue(null);

      await expect(
        service.updateTeamMember(mockTenant.id!, 999, {
          userId: 999,
          tenantRole: TenantUserRole.ADMIN,
        })
      ).rejects.toThrow('User not found');
    });
  });

  describe('removeTeamMember', () => {
    it('should remove a team member', async () => {
      const mockUser = {
        id: 2,
        username: 'member1',
        tenantId: mockTenant.id,
        tenantRole: 'member',
      };

      mockUserRepository.findOne.mockResolvedValue(mockUser as User);
      mockUserRepository.remove.mockResolvedValue(mockUser as User);

      const result = await service.removeTeamMember(mockTenant.id!, 2);

      expect(result).toBe(true);
      expect(mockUserRepository.remove).toHaveBeenCalledWith(mockUser);
    });

    it('should throw error when trying to remove owner', async () => {
      const ownerUser = {
        id: 1,
        username: 'owner',
        tenantId: mockTenant.id,
        tenantRole: 'owner',
      };

      mockUserRepository.findOne.mockResolvedValue(ownerUser as User);

      await expect(service.removeTeamMember(mockTenant.id!, 1)).rejects.toThrow(
        'Cannot remove the owner'
      );
    });
  });

  describe('getBusinessSettings', () => {
    it('should return business settings with usage stats', async () => {
      mockTenantRepository.findOne.mockResolvedValue(mockTenant as Tenant);
      mockUserRepository.count.mockResolvedValue(3);

      const result = await service.getBusinessSettings(mockTenant.id!);

      expect(result).toHaveProperty('currentUsers', 3);
      expect(result).toHaveProperty('maxUsers', 5);
      expect(result).toHaveProperty('plan', TenantPlan.FREE);
      expect(result).toHaveProperty('status', TenantStatus.TRIAL);
    });
  });
});
