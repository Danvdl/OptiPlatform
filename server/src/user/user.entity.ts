import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany } from 'typeorm';
import { Field, ObjectType, Int, registerEnumType } from '@nestjs/graphql';
import { UserPermission } from './user-permission.entity';
import { ActivityLog } from './activity-log.entity';
import { UserPreferences } from './user-preferences.entity';

export enum UserRole {
  ADMIN = 'admin',
  MANAGER = 'manager',
  STAFF = 'staff'
}

export enum UserStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  SUSPENDED = 'suspended'
}

registerEnumType(UserRole, {
  name: 'UserRole',
  description: 'The role of the user in the system'
});

registerEnumType(UserStatus, {
  name: 'UserStatus',
  description: 'The status of the user account'
});

@ObjectType()
@Entity({ name: 'users' })
export class User {
  @Field(() => Int)
  @PrimaryGeneratedColumn()
  id: number;

  @Field()
  @Column({ unique: true })
  username: string;

  @Column() // Don't expose password in GraphQL
  password: string;

  @Field({ nullable: true })
  @Column({ unique: true, nullable: true })
  email?: string;

  @Field({ nullable: true })
  @Column({ name: 'first_name', nullable: true })
  firstName?: string;

  @Field({ nullable: true })
  @Column({ name: 'last_name', nullable: true })
  lastName?: string;

  @Field(() => UserRole)
  @Column({ 
    type: 'varchar', 
    default: 'staff',
    enum: UserRole 
  })
  role: UserRole;

  @Field(() => UserStatus)
  @Column({ 
    type: 'varchar', 
    default: 'active',
    enum: UserStatus 
  })
  status: UserStatus;

  @Field({ nullable: true })
  @Column({ name: 'phone_number', nullable: true })
  phoneNumber?: string;

  @Field({ nullable: true })
  @Column({ nullable: true })
  department?: string;

  @Field({ nullable: true })
  @Column({ nullable: true })
  position?: string;

  @Field({ nullable: true })
  @Column({ nullable: true })
  avatar?: string;

  @Field({ nullable: true })
  @Column({ name: 'last_login_at', type: 'timestamp', nullable: true })
  lastLoginAt?: Date;

  @Field({ nullable: true })
  @Column({ type: 'uuid', name: 'tenant_id', nullable: true })
  tenantId?: string;

  @Field({ nullable: true })
  @Column({ name: 'tenant_role', nullable: true })
  tenantRole?: string; // owner, admin, member

  @Field(() => Date)
  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @Field(() => Date)
  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;  // Relations
  @OneToMany(() => UserPermission, permission => permission.user)
  permissions: UserPermission[];

  @OneToMany(() => ActivityLog, log => log.user)
  activityLogs: ActivityLog[];

  @Field(() => UserPreferences, { nullable: true })
  @OneToMany(() => UserPreferences, preferences => preferences.user)
  preferences: UserPreferences[];

  // Computed fields
  @Field()
  get fullName(): string {
    if (this.firstName && this.lastName) {
      return `${this.firstName} ${this.lastName}`;
    }
    return this.firstName || this.lastName || this.username;
  }
}
