import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn, Index } from 'typeorm';
import { Field, ObjectType, Int, registerEnumType } from '@nestjs/graphql';
import { User } from './user.entity';

export enum ActivityType {
  LOGIN = 'login',
  LOGOUT = 'logout',
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  VIEW = 'view',
  EXPORT = 'export',
  IMPORT = 'import',
  APPROVE = 'approve',
  REJECT = 'reject',
  TRANSFER = 'transfer',
  ADJUSTMENT = 'adjustment',
  PURCHASE = 'purchase',
  SALE = 'sale'
}

registerEnumType(ActivityType, {
  name: 'ActivityType',
  description: 'Types of activities that can be logged'
});

@ObjectType()
@Entity({ name: 'activity_logs' })
@Index(['userId', 'createdAt'])
@Index(['entityType', 'entityId'])
@Index(['activityType', 'createdAt'])
export class ActivityLog {
  @Field(() => Int)
  @PrimaryGeneratedColumn()
  id: number;

  @Field(() => Int)
  @Column({ name: 'user_id' })
  userId: number;

  @Field(() => ActivityType)
  @Column({
    name: 'activity_type',
    type: 'varchar'
  })
  activityType: ActivityType;

  @Field()
  @Column()
  description: string;

  @Field({ nullable: true })
  @Column({ name: 'entity_type', nullable: true })
  entityType?: string; // e.g., 'Product', 'PurchaseOrder', 'User'

  @Field(() => Int, { nullable: true })
  @Column({ name: 'entity_id', nullable: true })
  entityId?: number;

  @Field({ nullable: true })
  @Column({ type: 'text', nullable: true })
  details?: string; // JSON string with additional details

  @Field({ nullable: true })
  @Column({ name: 'ip_address', nullable: true })
  ipAddress?: string;

  @Field({ nullable: true })
  @Column({ name: 'user_agent', nullable: true })
  userAgent?: string;

  @Field(() => Date)
  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  // Relations
  @ManyToOne(() => User, user => user.activityLogs, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  // Helper methods for parsing details
  get parsedDetails(): any {
    if (!this.details) return null;
    try {
      return JSON.parse(this.details);
    } catch {
      return null;
    }
  }
}
