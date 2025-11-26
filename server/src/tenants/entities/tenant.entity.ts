import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany } from 'typeorm';
import { Field, ObjectType, registerEnumType } from '@nestjs/graphql';
import { User } from '../../user/user.entity';

export enum TenantPlan {
  FREE = 'free',
  BASIC = 'basic',
  PROFESSIONAL = 'professional',
  ENTERPRISE = 'enterprise'
}

export enum TenantStatus {
  ACTIVE = 'active',
  SUSPENDED = 'suspended',
  TRIAL = 'trial',
  CANCELLED = 'cancelled'
}

export enum IndustryType {
  RETAIL = 'retail',
  WHOLESALE = 'wholesale',
  MANUFACTURING = 'manufacturing',
  ECOMMERCE = 'ecommerce',
  FOOD_BEVERAGE = 'food_beverage',
  HEALTHCARE = 'healthcare',
  AUTOMOTIVE = 'automotive',
  CONSTRUCTION = 'construction',
  TECHNOLOGY = 'technology',
  OTHER = 'other'
}

export enum CompanySize {
  SOLO = '1',
  SMALL = '2-10',
  MEDIUM = '11-50',
  LARGE = '51-200',
  ENTERPRISE = '200+'
}

registerEnumType(TenantPlan, {
  name: 'TenantPlan',
  description: 'Subscription plan for the tenant'
});

registerEnumType(TenantStatus, {
  name: 'TenantStatus',
  description: 'Current status of the tenant account'
});

registerEnumType(IndustryType, {
  name: 'IndustryType',
  description: 'Business industry type'
});

registerEnumType(CompanySize, {
  name: 'CompanySize',
  description: 'Size of the company'
});

@ObjectType()
@Entity({ name: 'tenants' })
export class Tenant {
  @Field()
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Field()
  @Column({ length: 255 })
  name: string;

  @Field()
  @Column({ length: 100, unique: true })
  slug: string;

  @Field()
  @Column({ name: 'owner_email', length: 255 })
  ownerEmail: string;

  @Field(() => TenantPlan)
  @Column({ 
    type: 'varchar',
    default: TenantPlan.FREE,
    enum: TenantPlan
  })
  plan: TenantPlan;

  @Field(() => TenantStatus)
  @Column({ 
    type: 'varchar',
    default: TenantStatus.TRIAL,
    enum: TenantStatus
  })
  status: TenantStatus;

  // Business Profile Information
  @Field({ nullable: true })
  @Column({ name: 'business_name', nullable: true })
  businessName?: string;

  @Field({ nullable: true })
  @Column({ name: 'legal_name', nullable: true })
  legalName?: string;

  @Field({ nullable: true })
  @Column({ name: 'tax_id', nullable: true })
  taxId?: string; // VAT, EIN, etc.

  @Field(() => IndustryType, { nullable: true })
  @Column({ 
    type: 'varchar',
    nullable: true,
    enum: IndustryType
  })
  industry?: IndustryType;

  @Field(() => CompanySize, { nullable: true })
  @Column({ 
    type: 'varchar',
    name: 'company_size',
    nullable: true,
    enum: CompanySize
  })
  companySize?: CompanySize;

  @Field({ nullable: true })
  @Column({ nullable: true })
  website?: string;

  @Field({ nullable: true })
  @Column({ nullable: true })
  logo?: string;

  // Contact Information
  @Field({ nullable: true })
  @Column({ name: 'phone_number', nullable: true })
  phoneNumber?: string;

  @Field({ nullable: true })
  @Column({ name: 'support_email', nullable: true })
  supportEmail?: string;

  // Address Information
  @Field({ nullable: true })
  @Column({ name: 'address_line1', nullable: true })
  addressLine1?: string;

  @Field({ nullable: true })
  @Column({ name: 'address_line2', nullable: true })
  addressLine2?: string;

  @Field({ nullable: true })
  @Column({ nullable: true })
  city?: string;

  @Field({ nullable: true })
  @Column({ nullable: true })
  state?: string;

  @Field({ nullable: true })
  @Column({ name: 'postal_code', nullable: true })
  postalCode?: string;

  @Field({ nullable: true })
  @Column({ nullable: true })
  country?: string;

  // Business Settings
  @Field({ nullable: true })
  @Column({ nullable: true })
  currency?: string; // USD, EUR, GBP, etc.

  @Field({ nullable: true })
  @Column({ nullable: true })
  timezone?: string;

  @Field({ nullable: true })
  @Column({ nullable: true })
  language?: string;

  // Subscription & Limits
  @Field({ nullable: true })
  @Column({ name: 'trial_ends_at', type: 'timestamp', nullable: true })
  trialEndsAt?: Date;

  @Field({ nullable: true })
  @Column({ name: 'subscription_starts_at', type: 'timestamp', nullable: true })
  subscriptionStartsAt?: Date;

  @Field({ nullable: true })
  @Column({ name: 'subscription_ends_at', type: 'timestamp', nullable: true })
  subscriptionEndsAt?: Date;

  @Field({ nullable: true })
  @Column({ name: 'max_users', type: 'int', nullable: true })
  maxUsers?: number;

  @Field({ nullable: true })
  @Column({ name: 'max_products', type: 'int', nullable: true })
  maxProducts?: number;

  // Additional Settings (JSON)
  @Field({ nullable: true })
  @Column({ type: 'jsonb', default: '{}' })
  settings?: string; // Store as JSON string

  @Field({ nullable: true })
  @Column({ type: 'jsonb', nullable: true })
  features?: string; // Store as JSON string for feature flags

  // Onboarding
  @Field({ nullable: true })
  @Column({ name: 'onboarding_completed', default: false })
  onboardingCompleted?: boolean;

  @Field({ nullable: true })
  @Column({ name: 'onboarding_step', type: 'int', nullable: true })
  onboardingStep?: number;

  @Field(() => Date)
  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @Field(() => Date)
  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  // Relations
  @OneToMany(() => User, user => user.tenantId)
  users: User[];
}
