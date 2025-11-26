import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { Tenant, TenantPlan, TenantStatus } from './entities/tenant.entity';
import { User, UserRole, UserStatus } from '../user/user.entity';
import { RegisterTenantInput, UpdateTenantInput } from './dto/register-tenant.input';
import { CreateTeamMemberInput, UpdateTeamMemberInput } from './dto/team-member.input';
import { AppError, ErrorCode } from '../errors/error-codes';
import { DatabaseErrorHandler, HandleDatabaseErrors } from '../errors/database-error-handler';

@Injectable()
export class TenantsService {
  constructor(
    @InjectRepository(Tenant)
    private tenants: Repository<Tenant>,
    @InjectRepository(User)
    private users: Repository<User>,
  ) {}

  /**
   * Register a new tenant with business profile and owner account
   */
  @HandleDatabaseErrors()
  async registerTenant(input: RegisterTenantInput): Promise<{ tenant: Tenant; user: User }> {
    // Validate email is unique
    const existingUser = await this.users.findOne({
      where: [{ email: input.email }, { username: input.username }]
    });

    if (existingUser) {
      if (existingUser.email === input.email) {
        throw new AppError(ErrorCode.VALIDATION, 'Email already registered');
      }
      if (existingUser.username === input.username) {
        throw new AppError(ErrorCode.VALIDATION, 'Username already taken');
      }
    }

    // Create unique slug from business name
    const baseSlug = this.createSlug(input.businessName);
    const slug = await this.getUniqueSlug(baseSlug);

    // Calculate trial end date (14 days)
    const trialEndsAt = new Date();
    trialEndsAt.setDate(trialEndsAt.getDate() + 14);

    // Create tenant
    const tenant = this.tenants.create({
      name: input.businessName,
      slug,
      ownerEmail: input.email,
      businessName: input.businessName,
      legalName: input.legalName,
      taxId: input.taxId,
      industry: input.industry,
      companySize: input.companySize,
      website: input.website,
      phoneNumber: input.phoneNumber,
      addressLine1: input.addressLine1,
      city: input.city,
      state: input.state,
      postalCode: input.postalCode,
      country: input.country || 'US',
      currency: input.currency || 'USD',
      timezone: input.timezone || 'UTC',
      language: 'en',
      plan: TenantPlan.FREE,
      status: TenantStatus.TRIAL,
      trialEndsAt,
      maxUsers: 5, // Free plan limit
      maxProducts: 100, // Free plan limit
      onboardingCompleted: false,
      onboardingStep: 1,
      features: {
        multiUser: true,
        advancedAnalytics: false,
        apiAccess: false,
        customReports: false,
        prioritySupport: false
      }
    });

    const savedTenant = await this.tenants.save(tenant);

    // Create owner user
    const hashedPassword = await bcrypt.hash(input.password, 10);
    
    const user = this.users.create({
      username: input.username,
      email: input.email,
      password: hashedPassword,
      firstName: input.firstName,
      lastName: input.lastName,
      role: UserRole.ADMIN,
      status: UserStatus.ACTIVE,
      tenantId: savedTenant.id,
      tenantRole: 'owner'
    });

    const savedUser = await this.users.save(user);

    return { tenant: savedTenant, user: savedUser };
  }

  /**
   * Get tenant by ID
   */
  async findTenant(tenantId: string): Promise<Tenant> {
    const tenant = await this.tenants.findOne({ where: { id: tenantId } });
    
    if (!tenant) {
      throw new AppError(ErrorCode.NOT_FOUND, 'Tenant not found');
    }

    return tenant;
  }

  /**
   * Update tenant business profile
   */
  @HandleDatabaseErrors()
  async updateTenant(tenantId: string, input: UpdateTenantInput): Promise<Tenant> {
    const tenant = await this.findTenant(tenantId);

    Object.assign(tenant, input);
    tenant.updatedAt = new Date();

    return await this.tenants.save(tenant);
  }

  /**
   * Complete onboarding step
   */
  async completeOnboardingStep(tenantId: string, step: number): Promise<Tenant> {
    const tenant = await this.findTenant(tenantId);

    tenant.onboardingStep = step;
    
    if (step >= 5) {
      tenant.onboardingCompleted = true;
    }

    return await this.tenants.save(tenant);
  }

  /**
   * Get tenant settings and usage statistics
   */
  async getTenantSettings(tenantId: string): Promise<any> {
    const tenant = await this.findTenant(tenantId);

    const totalUsers = await this.users.count({ where: { tenantId } });
    
    // Calculate days until trial ends
    let daysUntilTrialEnds = null;
    if (tenant.trialEndsAt) {
      const now = new Date();
      const diff = tenant.trialEndsAt.getTime() - now.getTime();
      daysUntilTrialEnds = Math.ceil(diff / (1000 * 60 * 60 * 24));
    }

    return {
      tenant,
      totalUsers,
      totalProducts: 0, // Will be calculated from products table
      storageUsed: 0, // Will be calculated
      daysUntilTrialEnds
    };
  }

  /**
   * Create team member
   */
  @HandleDatabaseErrors()
  async createTeamMember(tenantId: string, input: CreateTeamMemberInput): Promise<User> {
    // Validate tenant exists
    const tenant = await this.findTenant(tenantId);

    // Check user limit
    const currentUsers = await this.users.count({ where: { tenantId } });
    if (tenant.maxUsers && currentUsers >= tenant.maxUsers) {
      throw new AppError(
        ErrorCode.VALIDATION,
        `User limit reached (${tenant.maxUsers} users). Please upgrade your plan.`
      );
    }

    // Check if email/username already exists
    const existingUser = await this.users.findOne({
      where: [{ email: input.email }, { username: input.username }]
    });

    if (existingUser) {
      if (existingUser.email === input.email) {
        throw new AppError(ErrorCode.VALIDATION, 'Email already registered');
      }
      if (existingUser.username === input.username) {
        throw new AppError(ErrorCode.VALIDATION, 'Username already taken');
      }
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(input.password, 10);

    // Create user
    const user = this.users.create({
      username: input.username,
      email: input.email,
      password: hashedPassword,
      firstName: input.firstName,
      lastName: input.lastName,
      role: this.mapTenantRoleToUserRole(input.tenantRole),
      status: UserStatus.ACTIVE,
      tenantId,
      tenantRole: input.tenantRole,
      department: input.department,
      position: input.position,
      phoneNumber: input.phoneNumber
    });

    return await this.users.save(user);
  }

  /**
   * Get all team members for a tenant
   */
  async getTeamMembers(tenantId: string): Promise<User[]> {
    return await this.users.find({
      where: { tenantId },
      select: [
        'id',
        'username',
        'email',
        'firstName',
        'lastName',
        'role',
        'status',
        'tenantRole',
        'department',
        'position',
        'phoneNumber',
        'avatar',
        'lastLoginAt',
        'createdAt'
      ],
      order: { createdAt: 'DESC' }
    });
  }

  /**
   * Update team member
   */
  @HandleDatabaseErrors()
  async updateTeamMember(
    tenantId: string,
    userId: number,
    input: UpdateTeamMemberInput
  ): Promise<User> {
    const user = await this.users.findOne({
      where: { id: userId, tenantId }
    });

    if (!user) {
      throw new AppError(ErrorCode.NOT_FOUND, 'Team member not found');
    }

    // Prevent changing owner role
    if (user.tenantRole === 'owner' && input.tenantRole && input.tenantRole !== 'owner') {
      throw new AppError(ErrorCode.VALIDATION, 'Cannot change owner role');
    }

    Object.assign(user, input);

    if (input.tenantRole) {
      user.role = this.mapTenantRoleToUserRole(input.tenantRole);
    }

    return await this.users.save(user);
  }

  /**
   * Remove team member
   */
  @HandleDatabaseErrors()
  async removeTeamMember(tenantId: string, userId: number): Promise<boolean> {
    const user = await this.users.findOne({
      where: { id: userId, tenantId }
    });

    if (!user) {
      throw new AppError(ErrorCode.NOT_FOUND, 'Team member not found');
    }

    // Prevent removing owner
    if (user.tenantRole === 'owner') {
      throw new AppError(ErrorCode.VALIDATION, 'Cannot remove tenant owner');
    }

    await this.users.delete(userId);
    return true;
  }

  /**
   * Helper: Create URL-friendly slug
   */
  private createSlug(name: string): string {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
  }

  /**
   * Helper: Get unique slug by appending number if needed
   */
  private async getUniqueSlug(baseSlug: string): Promise<string> {
    let slug = baseSlug;
    let counter = 1;

    while (await this.tenants.findOne({ where: { slug } })) {
      slug = `${baseSlug}-${counter}`;
      counter++;
    }

    return slug;
  }

  /**
   * Helper: Map tenant role to user role
   */
  private mapTenantRoleToUserRole(tenantRole: string): UserRole {
    switch (tenantRole) {
      case 'owner':
      case 'admin':
        return UserRole.ADMIN;
      case 'manager':
        return UserRole.MANAGER;
      default:
        return UserRole.STAFF;
    }
  }
}
