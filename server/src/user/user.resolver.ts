import { Resolver, Query, Mutation, Args, Int, Context } from '@nestjs/graphql';
import { UseGuards, ForbiddenException } from '@nestjs/common';
import { UserService } from './user.service';
import { User, UserRole } from './user.entity';
import { UserPermission, Permission } from './user-permission.entity';
import { ActivityLog } from './activity-log.entity';
import { UserPreferences } from './user-preferences.entity';
import { CreateUserInput, UpdateUserInput, UpdateUserProfileInput, ChangePasswordInput } from './dto/user-management.input';
import { GrantPermissionInput, RevokePermissionInput, GrantMultiplePermissionsInput, SetUserPermissionsInput } from './dto/permission-management.input';
import { SetUserPreferenceInput, ActivityLogFilterInput } from './dto/preferences-activity.input';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { LoggingService } from '../errors/logging.service';

@Resolver(() => User)
export class UserResolver {
  constructor(
    private readonly userService: UserService,
    private readonly loggingService: LoggingService
  ) {}

  // User Management Queries
  @Query(() => [User])
  @UseGuards(JwtAuthGuard)
  async users(@Context() context: any): Promise<User[]> {
    const currentUser = context.req.user;
    
    // Check if user has permission to read users
    const hasPermission = await this.userService.hasPermission(currentUser.id, Permission.USER_READ);
    if (!hasPermission) {
      throw new ForbiddenException('Insufficient permissions to view users');
    }

    return this.userService.findAll();
  }

  @Query(() => User)
  @UseGuards(JwtAuthGuard)
  async user(@Args('id', { type: () => Int }) id: number, @Context() context: any): Promise<User> {
    const currentUser = context.req.user;
    
    // Users can view their own profile, or need USER_READ permission for others
    if (currentUser.id !== id) {
      const hasPermission = await this.userService.hasPermission(currentUser.id, Permission.USER_READ);
      if (!hasPermission) {
        throw new ForbiddenException('Insufficient permissions to view this user');
      }
    }

    return this.userService.findById(id);
  }

  @Query(() => User)
  @UseGuards(JwtAuthGuard)
  async currentUser(@Context() context: any): Promise<User> {
    this.loggingService.logInfo('CurrentUser resolver called', {
      module: 'UserResolver',
      operation: 'currentUser',
      metadata: {
        hasContext: !!context,
        hasReq: !!context?.req,
        hasUser: !!context?.req?.user,
        user: context?.req?.user,
        contextKeys: Object.keys(context || {}),
        reqKeys: Object.keys(context?.req || {})
      }
    });
    
    const currentUser = context.req.user;
    const user = await this.userService.findById(currentUser.id);
    
    this.loggingService.logInfo('CurrentUser resolver result', {
      module: 'UserResolver',
      operation: 'currentUser',
      metadata: { foundUser: !!user, userId: user?.id, username: user?.username }
    });
    
    return user;
  }

  @Query(() => [Permission])
  @UseGuards(JwtAuthGuard)
  async userPermissions(
    @Context() context: any,
    @Args('userId', { type: () => Int, nullable: true }) userId?: number
  ): Promise<Permission[]> {
    const currentUser = context.req.user;
    const targetUserId = userId || currentUser.id;
    
    // Users can view their own permissions, or need USER_READ permission for others
    if (currentUser.id !== targetUserId) {
      const hasPermission = await this.userService.hasPermission(currentUser.id, Permission.USER_READ);
      if (!hasPermission) {
        throw new ForbiddenException('Insufficient permissions to view user permissions');
      }
    }

    return this.userService.getUserPermissions(targetUserId);
  }

  @Query(() => [ActivityLog])
  @UseGuards(JwtAuthGuard)
  async activityLogs(
    @Args('filter') filter: ActivityLogFilterInput,
    @Context() context: any
  ): Promise<ActivityLog[]> {
    const currentUser = context.req.user;
    
    // If viewing other users' logs, check permission
    if (filter.userId && filter.userId !== currentUser.id) {
      const hasPermission = await this.userService.hasPermission(currentUser.id, Permission.SYSTEM_LOGS);
      if (!hasPermission) {
        throw new ForbiddenException('Insufficient permissions to view activity logs');
      }
    } else if (!filter.userId && currentUser.role !== UserRole.ADMIN) {
      // Non-admin users can only view their own logs unless specified
      filter.userId = currentUser.id;
    }

    return this.userService.getActivityLogs(filter);
  }

  @Query(() => [UserPreferences])
  @UseGuards(JwtAuthGuard)
  async userPreferences(
    @Context() context: any,
    @Args('userId', { type: () => Int, nullable: true }) userId?: number
  ): Promise<UserPreferences[]> {
    const currentUser = context.req.user;
    const targetUserId = userId || currentUser.id;
    
    // Users can only view their own preferences unless they're admin
    if (currentUser.id !== targetUserId && currentUser.role !== UserRole.ADMIN) {
      throw new ForbiddenException('Can only view your own preferences');
    }

    return this.userService.getUserPreferences(targetUserId);
  }

  // User Management Mutations
  @Mutation(() => User)
  @UseGuards(JwtAuthGuard)
  async createUser(
    @Args('input') input: CreateUserInput,
    @Context() context: any
  ): Promise<User> {
    const currentUser = context.req.user;
    
    const hasPermission = await this.userService.hasPermission(currentUser.id, Permission.USER_CREATE);
    if (!hasPermission) {
      throw new ForbiddenException('Insufficient permissions to create users');
    }

    // Only admins can create admin users
    if (input.role === UserRole.ADMIN && currentUser.role !== UserRole.ADMIN) {
      throw new ForbiddenException('Only administrators can create admin users');
    }

    return this.userService.createUser(input, currentUser.id);
  }

  @Mutation(() => User)
  @UseGuards(JwtAuthGuard)
  async updateUser(
    @Args('input') input: UpdateUserInput,
    @Context() context: any
  ): Promise<User> {
    const currentUser = context.req.user;
    
    // Users can update their own profile (limited fields) or need USER_UPDATE permission
    if (currentUser.id !== input.id) {
      const hasPermission = await this.userService.hasPermission(currentUser.id, Permission.USER_UPDATE);
      if (!hasPermission) {
        throw new ForbiddenException('Insufficient permissions to update this user');
      }
    }

    // Only admins can change roles or promote to admin
    if (input.role !== undefined) {
      if (currentUser.role !== UserRole.ADMIN) {
        throw new ForbiddenException('Only administrators can change user roles');
      }
      if (input.role === UserRole.ADMIN && currentUser.role !== UserRole.ADMIN) {
        throw new ForbiddenException('Only administrators can promote users to admin');
      }
    }

    return this.userService.updateUser(input, currentUser.id);
  }

  @Mutation(() => User)
  @UseGuards(JwtAuthGuard)
  async updateProfile(
    @Args('input') input: UpdateUserProfileInput,
    @Context() context: any
  ): Promise<User> {
    const currentUser = context.req.user;
    return this.userService.updateProfile(currentUser.id, input);
  }

  @Mutation(() => Boolean)
  @UseGuards(JwtAuthGuard)
  async changePassword(
    @Args('input') input: ChangePasswordInput,
    @Context() context: any
  ): Promise<boolean> {
    const currentUser = context.req.user;
    return this.userService.changePassword(currentUser.id, input);
  }

  @Mutation(() => Boolean)
  @UseGuards(JwtAuthGuard)
  async deleteUser(
    @Args('id', { type: () => Int }) id: number,
    @Context() context: any
  ): Promise<boolean> {
    const currentUser = context.req.user;
    
    const hasPermission = await this.userService.hasPermission(currentUser.id, Permission.USER_DELETE);
    if (!hasPermission) {
      throw new ForbiddenException('Insufficient permissions to delete users');
    }

    // Prevent self-deletion
    if (currentUser.id === id) {
      throw new ForbiddenException('Cannot delete your own account');
    }

    return this.userService.deleteUser(id, currentUser.id);
  }

  // Permission Management Mutations
  @Mutation(() => Boolean)
  @UseGuards(JwtAuthGuard)
  async grantPermission(
    @Args('input') input: GrantPermissionInput,
    @Context() context: any
  ): Promise<boolean> {
    const currentUser = context.req.user;
    
    const hasPermission = await this.userService.hasPermission(currentUser.id, Permission.USER_PERMISSIONS);
    if (!hasPermission) {
      throw new ForbiddenException('Insufficient permissions to grant permissions');
    }

    return this.userService.grantPermission(input, currentUser.id);
  }

  @Mutation(() => Boolean)
  @UseGuards(JwtAuthGuard)
  async revokePermission(
    @Args('input') input: RevokePermissionInput,
    @Context() context: any
  ): Promise<boolean> {
    const currentUser = context.req.user;
    
    const hasPermission = await this.userService.hasPermission(currentUser.id, Permission.USER_PERMISSIONS);
    if (!hasPermission) {
      throw new ForbiddenException('Insufficient permissions to revoke permissions');
    }

    return this.userService.revokePermission(input, currentUser.id);
  }

  @Mutation(() => Boolean)
  @UseGuards(JwtAuthGuard)
  async grantMultiplePermissions(
    @Args('input') input: GrantMultiplePermissionsInput,
    @Context() context: any
  ): Promise<boolean> {
    const currentUser = context.req.user;
    
    const hasPermission = await this.userService.hasPermission(currentUser.id, Permission.USER_PERMISSIONS);
    if (!hasPermission) {
      throw new ForbiddenException('Insufficient permissions to grant permissions');
    }

    return this.userService.grantMultiplePermissions(input, currentUser.id);
  }

  @Mutation(() => Boolean)
  @UseGuards(JwtAuthGuard)
  async setUserPermissions(
    @Args('input') input: SetUserPermissionsInput,
    @Context() context: any
  ): Promise<boolean> {
    const currentUser = context.req.user;
    
    const hasPermission = await this.userService.hasPermission(currentUser.id, Permission.USER_PERMISSIONS);
    if (!hasPermission) {
      throw new ForbiddenException('Insufficient permissions to set user permissions');
    }

    return this.userService.setUserPermissions(input, currentUser.id);
  }

  // Preference Management Mutations
  @Mutation(() => UserPreferences)
  @UseGuards(JwtAuthGuard)
  async setUserPreference(
    @Args('input') input: SetUserPreferenceInput,
    @Context() context: any
  ): Promise<UserPreferences> {
    const currentUser = context.req.user;
    return this.userService.setUserPreference(currentUser.id, input);
  }

  // Utility Queries
  @Query(() => Boolean)
  @UseGuards(JwtAuthGuard)
  async hasPermission(
    @Args('permission', { type: () => Permission }) permission: Permission,
    @Context() context: any
  ): Promise<boolean> {
    const currentUser = context.req.user;
    return this.userService.hasPermission(currentUser.id, permission);
  }

  @Query(() => [Permission])
  availablePermissions(): Permission[] {
    return Object.values(Permission);
  }
}
