import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn, Unique } from 'typeorm';
import { Field, ObjectType, Int, registerEnumType } from '@nestjs/graphql';
import { User } from './user.entity';

export enum Permission {
  // Inventory permissions
  INVENTORY_READ = 'inventory:read',
  INVENTORY_WRITE = 'inventory:write',
  INVENTORY_DELETE = 'inventory:delete',
  PRODUCT_CREATE = 'product:create',
  PRODUCT_UPDATE = 'product:update',
  PRODUCT_DELETE = 'product:delete',
  
  // Transaction permissions
  TRANSACTION_READ = 'transaction:read',
  TRANSACTION_CREATE = 'transaction:create',
  TRANSACTION_UPDATE = 'transaction:update',
  TRANSACTION_DELETE = 'transaction:delete',
  
  // Supplier permissions
  SUPPLIER_READ = 'supplier:read',
  SUPPLIER_CREATE = 'supplier:create',
  SUPPLIER_UPDATE = 'supplier:update',
  SUPPLIER_DELETE = 'supplier:delete',
  
  // Purchase order permissions
  PURCHASE_ORDER_READ = 'purchase_order:read',
  PURCHASE_ORDER_CREATE = 'purchase_order:create',
  PURCHASE_ORDER_UPDATE = 'purchase_order:update',
  PURCHASE_ORDER_DELETE = 'purchase_order:delete',
  PURCHASE_ORDER_APPROVE = 'purchase_order:approve',
  
  // Reports permissions
  REPORTS_READ = 'reports:read',
  REPORTS_EXPORT = 'reports:export',
  REPORTS_ADVANCED = 'reports:advanced',
  
  // User management permissions
  USER_READ = 'user:read',
  USER_CREATE = 'user:create',
  USER_UPDATE = 'user:update',
  USER_DELETE = 'user:delete',
  USER_PERMISSIONS = 'user:permissions',
  
  // System permissions
  SYSTEM_SETTINGS = 'system:settings',
  SYSTEM_BACKUP = 'system:backup',
  SYSTEM_LOGS = 'system:logs',
  
  // Notification permissions
  NOTIFICATION_SEND = 'notification:send',
  NOTIFICATION_MANAGE = 'notification:manage',
  
  // Location permissions
  LOCATION_READ = 'location:read',
  LOCATION_CREATE = 'location:create',
  LOCATION_UPDATE = 'location:update',
  LOCATION_DELETE = 'location:delete'
}

registerEnumType(Permission, {
  name: 'Permission',
  description: 'Available permissions in the system'
});

@ObjectType()
@Entity({ name: 'user_permissions' })
@Unique(['userId', 'permission'])
export class UserPermission {
  @Field(() => Int)
  @PrimaryGeneratedColumn()
  id: number;

  @Field(() => Int)
  @Column({ name: 'user_id' })
  userId: number;

  @Field(() => Permission)
  @Column({
    type: 'varchar'
  })
  permission: Permission;

  @Field(() => Date)
  @CreateDateColumn({ name: 'granted_at' })
  grantedAt: Date;

  @Field(() => Int, { nullable: true })
  @Column({ name: 'granted_by', nullable: true })
  grantedBy?: number;

  // Relations
  @ManyToOne(() => User, user => user.permissions, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'granted_by' })
  grantor?: User;
}
