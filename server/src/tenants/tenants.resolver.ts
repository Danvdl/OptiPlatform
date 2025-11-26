import { Resolver, Query, Mutation, Args } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { TenantId, CurrentUser } from '../common/tenant.decorator';
import { TenantsService } from './tenants.service';
import { AuthService } from '../auth/auth.service';
import { Tenant } from './entities/tenant.entity';
import { User } from '../user/user.entity';
import { RegisterTenantInput, UpdateTenantInput } from './dto/register-tenant.input';
import { CreateTeamMemberInput, UpdateTeamMemberInput } from './dto/team-member.input';
import { RegisterTenantResponse, TenantSettingsResponse, TeamMemberResponse } from './dto/tenant-response.dto';

@Resolver(() => Tenant)
export class TenantsResolver {
  constructor(
    private readonly tenantsService: TenantsService,
    private readonly authService: AuthService,
  ) {}

  /**
   * Register new business (tenant) and owner account
   * This is the main signup endpoint
   */
  @Mutation(() => RegisterTenantResponse)
  async registerBusiness(
    @Args('input') input: RegisterTenantInput
  ): Promise<RegisterTenantResponse> {
    // Create tenant and owner user
    const { tenant, user } = await this.tenantsService.registerTenant(input);

    // Generate JWT token with tenant context
    const accessToken = await this.authService.login(user);

    return {
      accessToken,
      tenant,
      user,
      message: `Welcome to OptiPlatform! Your ${tenant.plan} plan trial is active for 14 days.`
    };
  }

  /**
   * Get current tenant profile
   */
  @Query(() => Tenant)
  @UseGuards(JwtAuthGuard)
  async myBusiness(@TenantId() tenantId: string): Promise<Tenant> {
    return this.tenantsService.findTenant(tenantId);
  }

  /**
   * Get tenant settings and usage statistics
   */
  @Query(() => TenantSettingsResponse)
  @UseGuards(JwtAuthGuard)
  async businessSettings(@TenantId() tenantId: string): Promise<TenantSettingsResponse> {
    return this.tenantsService.getTenantSettings(tenantId);
  }

  /**
   * Update business profile
   */
  @Mutation(() => Tenant)
  @UseGuards(JwtAuthGuard)
  async updateBusiness(
    @Args('input') input: UpdateTenantInput,
    @TenantId() tenantId: string
  ): Promise<Tenant> {
    return this.tenantsService.updateTenant(tenantId, input);
  }

  /**
   * Complete onboarding step
   */
  @Mutation(() => Tenant)
  @UseGuards(JwtAuthGuard)
  async completeOnboardingStep(
    @Args('step') step: number,
    @TenantId() tenantId: string
  ): Promise<Tenant> {
    return this.tenantsService.completeOnboardingStep(tenantId, step);
  }

  // ========================================
  // Team Management
  // ========================================

  /**
   * Get all team members
   */
  @Query(() => [User])
  @UseGuards(JwtAuthGuard)
  async teamMembers(@TenantId() tenantId: string): Promise<User[]> {
    return this.tenantsService.getTeamMembers(tenantId);
  }

  /**
   * Create new team member (requires owner or admin role)
   */
  @Mutation(() => TeamMemberResponse)
  @UseGuards(JwtAuthGuard)
  async createTeamMember(
    @Args('input') input: CreateTeamMemberInput,
    @TenantId() tenantId: string,
    @CurrentUser() currentUser: any
  ): Promise<TeamMemberResponse> {
    // Only owner and admin can create team members
    if (currentUser.tenantRole !== 'owner' && currentUser.tenantRole !== 'admin') {
      throw new Error('Only owners and admins can create team members');
    }

    const user = await this.tenantsService.createTeamMember(tenantId, input);

    return {
      user,
      invitationSent: false // Email invitation feature can be added later
    };
  }

  /**
   * Update team member
   */
  @Mutation(() => User)
  @UseGuards(JwtAuthGuard)
  async updateTeamMember(
    @Args('input') input: UpdateTeamMemberInput,
    @TenantId() tenantId: string,
    @CurrentUser() currentUser: any
  ): Promise<User> {
    // Only owner and admin can update team members
    if (currentUser.tenantRole !== 'owner' && currentUser.tenantRole !== 'admin') {
      throw new Error('Only owners and admins can update team members');
    }

    return this.tenantsService.updateTeamMember(tenantId, input.userId, input);
  }

  /**
   * Remove team member
   */
  @Mutation(() => Boolean)
  @UseGuards(JwtAuthGuard)
  async removeTeamMember(
    @Args('userId') userId: number,
    @TenantId() tenantId: string,
    @CurrentUser() currentUser: any
  ): Promise<boolean> {
    // Only owner and admin can remove team members
    if (currentUser.tenantRole !== 'owner' && currentUser.tenantRole !== 'admin') {
      throw new Error('Only owners and admins can remove team members');
    }

    return this.tenantsService.removeTeamMember(tenantId, userId);
  }
}
