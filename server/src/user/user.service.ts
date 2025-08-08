import { Injectable, NotFoundException, ForbiddenException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like, Between } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User, UserRole, UserStatus } from './user.entity';
import { UserPermission, Permission } from './user-permission.entity';
import { ActivityLog, ActivityType } from './activity-log.entity';
import { UserPreferences, PreferenceType } from './user-preferences.entity';
import { CreateUserInput, UpdateUserInput, UpdateUserProfileInput, ChangePasswordInput } from './dto/user-management.input';
import { GrantPermissionInput, RevokePermissionInput, GrantMultiplePermissionsInput, SetUserPermissionsInput } from './dto/permission-management.input';
import { SetUserPreferenceInput, ActivityLogFilterInput } from './dto/preferences-activity.input';
import { AppError, ErrorCode } from '../errors/error-codes';
import { HandleDatabaseErrors } from '../errors/database-error-handler';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(UserPermission)
    private readonly permissionRepository: Repository<UserPermission>,
    @InjectRepository(ActivityLog)
    private readonly activityLogRepository: Repository<ActivityLog>,
    @InjectRepository(UserPreferences)
    private readonly preferencesRepository: Repository<UserPreferences>,
  ) {}

  // User Management Methods
  @HandleDatabaseErrors()
  async findAll(): Promise<User[]> {
    return this.userRepository.find({
      relations: ['permissions'],
      order: { createdAt: 'DESC' }
    });
  }

  @HandleDatabaseErrors()
  async findById(id: number): Promise<User> {
    const user = await this.userRepository.findOne({
      where: { id },
      relations: ['permissions', 'preferences']
    });
    
    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }
    
    return user;
  }

  @HandleDatabaseErrors()
  async findByUsername(username: string): Promise<User | null> {
    return this.userRepository.findOne({
      where: { username },
      relations: ['permissions']
    });
  }

  @HandleDatabaseErrors()
  async findByEmail(email: string): Promise<User | null> {
    return this.userRepository.findOne({
      where: { email },
      relations: ['permissions']
    });
  }

  @HandleDatabaseErrors()
  async createUser(input: CreateUserInput, createdBy?: number): Promise<User> {
    // Check if username or email already exists
    const existingUser = await this.userRepository.findOne({
      where: [
        { username: input.username },
        { email: input.email }
      ]
    });

    if (existingUser) {
      if (existingUser.username === input.username) {
        throw new ConflictException('Username already exists');
      }
      if (existingUser.email === input.email) {
        throw new ConflictException('Email already exists');
      }
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(input.password, 10);

    // Create user
    const user = this.userRepository.create({
      ...input,
      password: hashedPassword
    });

    const savedUser = await this.userRepository.save(user);

    // Grant default permissions based on role
    await this.grantDefaultPermissions(savedUser.id, savedUser.role);

    // Log activity
    if (createdBy) {
      await this.logActivity({
        userId: createdBy,
        activityType: ActivityType.CREATE,
        description: `Created user: ${savedUser.username}`,
        entityType: 'User',
        entityId: savedUser.id
      });
    }

    return this.findById(savedUser.id);
  }

  @HandleDatabaseErrors()
  async updateUser(input: UpdateUserInput, updatedBy?: number): Promise<User> {
    const user = await this.findById(input.id);

    // Check for conflicts if username or email is being updated
    if (input.username && input.username !== user.username) {
      const existingUser = await this.userRepository.findOne({
        where: { username: input.username }
      });
      if (existingUser) {
        throw new ConflictException('Username already exists');
      }
    }

    if (input.email && input.email !== user.email) {
      const existingUser = await this.userRepository.findOne({
        where: { email: input.email }
      });
      if (existingUser) {
        throw new ConflictException('Email already exists');
      }
    }

    // Update user
    Object.assign(user, input);
    const updatedUser = await this.userRepository.save(user);

    // Log activity
    if (updatedBy) {
      await this.logActivity({
        userId: updatedBy,
        activityType: ActivityType.UPDATE,
        description: `Updated user: ${user.username}`,
        entityType: 'User',
        entityId: user.id,
        details: JSON.stringify(input)
      });
    }

    return this.findById(updatedUser.id);
  }

  @HandleDatabaseErrors()
  async updateProfile(userId: number, input: UpdateUserProfileInput): Promise<User> {
    const user = await this.findById(userId);
    
    Object.assign(user, input);
    await this.userRepository.save(user);

    // Log activity
    await this.logActivity({
      userId,
      activityType: ActivityType.UPDATE,
      description: 'Updated profile',
      entityType: 'User',
      entityId: userId
    });

    return this.findById(userId);
  }

  @HandleDatabaseErrors()
  async changePassword(userId: number, input: ChangePasswordInput): Promise<boolean> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Verify current password
    const isCurrentPasswordValid = await bcrypt.compare(input.currentPassword, user.password);
    if (!isCurrentPasswordValid) {
      throw new ForbiddenException('Current password is incorrect');
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(input.newPassword, 10);
    user.password = hashedPassword;
    await this.userRepository.save(user);

    // Log activity
    await this.logActivity({
      userId,
      activityType: ActivityType.UPDATE,
      description: 'Changed password',
      entityType: 'User',
      entityId: userId
    });

    return true;
  }

  @HandleDatabaseErrors()
  async deleteUser(id: number, deletedBy?: number): Promise<boolean> {
    const user = await this.findById(id);
    
    // Prevent deletion of admin users by non-admin users
    if (user.role === UserRole.ADMIN && deletedBy) {
      const deleter = await this.findById(deletedBy);
      if (deleter.role !== UserRole.ADMIN) {
        throw new ForbiddenException('Only administrators can delete admin users');
      }
    }

    await this.userRepository.remove(user);

    // Log activity
    if (deletedBy) {
      await this.logActivity({
        userId: deletedBy,
        activityType: ActivityType.DELETE,
        description: `Deleted user: ${user.username}`,
        entityType: 'User',
        entityId: id
      });
    }

    return true;
  }

  // Permission Management Methods
  @HandleDatabaseErrors()
  async getUserPermissions(userId: number): Promise<Permission[]> {
    // Admins implicitly have all permissions
    const user = await this.findById(userId);
    if (user?.role === UserRole.ADMIN) {
      return Object.values(Permission);
    }

    const permissions = await this.permissionRepository.find({
      where: { userId },
      select: ['permission']
    });
    
    return permissions.map(p => p.permission);
  }

  @HandleDatabaseErrors()
  async hasPermission(userId: number, permission: Permission): Promise<boolean> {
    // Admins implicitly have all permissions
    const user = await this.findById(userId);
    if (user?.role === UserRole.ADMIN) {
      return true;
    }

    const userPermission = await this.permissionRepository.findOne({
      where: { userId, permission }
    });
    
    return !!userPermission;
  }

  @HandleDatabaseErrors()
  async grantPermission(input: GrantPermissionInput, grantedBy?: number): Promise<boolean> {
    // Check if permission already exists
    const existing = await this.permissionRepository.findOne({
      where: { userId: input.userId, permission: input.permission }
    });

    if (existing) {
      return true; // Already has permission
    }

    const userPermission = this.permissionRepository.create({
      userId: input.userId,
      permission: input.permission,
      grantedBy
    });

    await this.permissionRepository.save(userPermission);

    // Log activity
    if (grantedBy) {
      const user = await this.findById(input.userId);
      await this.logActivity({
        userId: grantedBy,
        activityType: ActivityType.UPDATE,
        description: `Granted permission ${input.permission} to ${user.username}`,
        entityType: 'UserPermission',
        entityId: input.userId
      });
    }

    return true;
  }

  @HandleDatabaseErrors()
  async revokePermission(input: RevokePermissionInput, revokedBy?: number): Promise<boolean> {
    const userPermission = await this.permissionRepository.findOne({
      where: { userId: input.userId, permission: input.permission }
    });

    if (!userPermission) {
      return true; // Permission doesn't exist, nothing to revoke
    }

    await this.permissionRepository.remove(userPermission);

    // Log activity
    if (revokedBy) {
      const user = await this.findById(input.userId);
      await this.logActivity({
        userId: revokedBy,
        activityType: ActivityType.UPDATE,
        description: `Revoked permission ${input.permission} from ${user.username}`,
        entityType: 'UserPermission',
        entityId: input.userId
      });
    }

    return true;
  }

  @HandleDatabaseErrors()
  async grantMultiplePermissions(input: GrantMultiplePermissionsInput, grantedBy?: number): Promise<boolean> {
    const existingPermissions = await this.permissionRepository.find({
      where: { userId: input.userId },
      select: ['permission']
    });

    const existingPermissionSet = new Set(existingPermissions.map(p => p.permission));
    const newPermissions = input.permissions.filter(p => !existingPermissionSet.has(p));

    if (newPermissions.length > 0) {
      const userPermissions = newPermissions.map(permission => 
        this.permissionRepository.create({
          userId: input.userId,
          permission,
          grantedBy
        })
      );

      await this.permissionRepository.save(userPermissions);

      // Log activity
      if (grantedBy) {
        const user = await this.findById(input.userId);
        await this.logActivity({
          userId: grantedBy,
          activityType: ActivityType.UPDATE,
          description: `Granted ${newPermissions.length} permissions to ${user.username}`,
          entityType: 'UserPermission',
          entityId: input.userId,
          details: JSON.stringify(newPermissions)
        });
      }
    }

    return true;
  }

  @HandleDatabaseErrors()
  async setUserPermissions(input: SetUserPermissionsInput, setBy?: number): Promise<boolean> {
    // Remove all existing permissions
    await this.permissionRepository.delete({ userId: input.userId });

    // Add new permissions
    if (input.permissions.length > 0) {
      const userPermissions = input.permissions.map(permission => 
        this.permissionRepository.create({
          userId: input.userId,
          permission,
          grantedBy: setBy
        })
      );

      await this.permissionRepository.save(userPermissions);
    }

    // Log activity
    if (setBy) {
      const user = await this.findById(input.userId);
      await this.logActivity({
        userId: setBy,
        activityType: ActivityType.UPDATE,
        description: `Set permissions for ${user.username}`,
        entityType: 'UserPermission',
        entityId: input.userId,
        details: JSON.stringify(input.permissions)
      });
    }

    return true;
  }

  // Activity Logging Methods
  @HandleDatabaseErrors()
  async logActivity(params: {
    userId: number;
    activityType: ActivityType;
    description: string;
    entityType?: string;
    entityId?: number;
    details?: string;
    ipAddress?: string;
    userAgent?: string;
  }): Promise<ActivityLog> {
    const activityLog = this.activityLogRepository.create(params);
    return this.activityLogRepository.save(activityLog);
  }

  @HandleDatabaseErrors()
  async getActivityLogs(filter: ActivityLogFilterInput): Promise<ActivityLog[]> {
    const queryBuilder = this.activityLogRepository.createQueryBuilder('log')
      .leftJoinAndSelect('log.user', 'user')
      .orderBy('log.createdAt', 'DESC')
      .limit(filter.limit)
      .offset(filter.offset);

    if (filter.userId) {
      queryBuilder.andWhere('log.userId = :userId', { userId: filter.userId });
    }

    if (filter.entityType) {
      queryBuilder.andWhere('log.entityType = :entityType', { entityType: filter.entityType });
    }

    if (filter.entityId) {
      queryBuilder.andWhere('log.entityId = :entityId', { entityId: filter.entityId });
    }

    if (filter.dateFrom || filter.dateTo) {
      if (filter.dateFrom && filter.dateTo) {
        queryBuilder.andWhere('log.createdAt BETWEEN :dateFrom AND :dateTo', {
          dateFrom: filter.dateFrom,
          dateTo: filter.dateTo
        });
      } else if (filter.dateFrom) {
        queryBuilder.andWhere('log.createdAt >= :dateFrom', { dateFrom: filter.dateFrom });
      } else if (filter.dateTo) {
        queryBuilder.andWhere('log.createdAt <= :dateTo', { dateTo: filter.dateTo });
      }
    }

    return queryBuilder.getMany();
  }

  // User Preferences Methods
  @HandleDatabaseErrors()
  async setUserPreference(userId: number, input: SetUserPreferenceInput): Promise<UserPreferences> {
    let preference = await this.preferencesRepository.findOne({
      where: { userId, preferenceType: input.preferenceType }
    });

    if (preference) {
      preference.value = input.value;
    } else {
      preference = this.preferencesRepository.create({
        userId,
        preferenceType: input.preferenceType,
        value: input.value
      });
    }

    const savedPreference = await this.preferencesRepository.save(preference);

    // Log activity
    await this.logActivity({
      userId,
      activityType: ActivityType.UPDATE,
      description: `Updated preference: ${input.preferenceType}`,
      entityType: 'UserPreferences',
      entityId: userId
    });

    return savedPreference;
  }

  @HandleDatabaseErrors()
  async getUserPreferences(userId: number): Promise<UserPreferences[]> {
    return this.preferencesRepository.find({
      where: { userId },
      order: { preferenceType: 'ASC' }
    });
  }

  @HandleDatabaseErrors()
  async getUserPreference(userId: number, preferenceType: PreferenceType): Promise<UserPreferences | null> {
    return this.preferencesRepository.findOne({
      where: { userId, preferenceType }
    });
  }

  // Helper Methods
  private async grantDefaultPermissions(userId: number, role: UserRole): Promise<void> {
    let defaultPermissions: Permission[] = [];

    switch (role) {
      case UserRole.ADMIN:
        defaultPermissions = Object.values(Permission);
        break;
      case UserRole.MANAGER:
        defaultPermissions = [
          Permission.INVENTORY_READ,
          Permission.INVENTORY_WRITE,
          Permission.PRODUCT_CREATE,
          Permission.PRODUCT_UPDATE,
          Permission.TRANSACTION_READ,
          Permission.TRANSACTION_CREATE,
          Permission.TRANSACTION_UPDATE,
          Permission.SUPPLIER_READ,
          Permission.SUPPLIER_CREATE,
          Permission.SUPPLIER_UPDATE,
          Permission.PURCHASE_ORDER_READ,
          Permission.PURCHASE_ORDER_CREATE,
          Permission.PURCHASE_ORDER_UPDATE,
          Permission.PURCHASE_ORDER_APPROVE,
          Permission.REPORTS_READ,
          Permission.REPORTS_EXPORT,
          Permission.USER_READ,
          Permission.LOCATION_READ,
          Permission.LOCATION_CREATE,
          Permission.LOCATION_UPDATE
        ];
        break;
      case UserRole.STAFF:
        defaultPermissions = [
          Permission.INVENTORY_READ,
          Permission.PRODUCT_CREATE,
          Permission.PRODUCT_UPDATE,
          Permission.TRANSACTION_READ,
          Permission.TRANSACTION_CREATE,
          Permission.SUPPLIER_READ,
          Permission.PURCHASE_ORDER_READ,
          Permission.REPORTS_READ,
          Permission.LOCATION_READ
        ];
        break;
    }

    if (defaultPermissions.length > 0) {
      await this.grantMultiplePermissions({
        userId,
        permissions: defaultPermissions
      });
    }
  }

  @HandleDatabaseErrors()
  async updateLastLogin(userId: number): Promise<void> {
    await this.userRepository.update(userId, {
      lastLoginAt: new Date()
    });

    await this.logActivity({
      userId,
      activityType: ActivityType.LOGIN,
      description: 'User logged in'
    });
  }
}
