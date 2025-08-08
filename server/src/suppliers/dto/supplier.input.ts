import { Field, InputType, Int } from '@nestjs/graphql';
import { IsString, IsOptional, IsEnum, IsEmail, IsNumber, IsUrl, Min, Max } from 'class-validator';
import { SupplierType, SupplierStatus } from '../entities/supplier.entity';

@InputType()
export class CreateSupplierInput {
  @Field()
  @IsString()
  name: string;

  @Field({ nullable: true })
  @IsString()
  @IsOptional()
  supplierCode?: string;

  @Field({ nullable: true })
  @IsString()
  @IsOptional()
  description?: string;

  @Field(() => SupplierType, { nullable: true })
  @IsEnum(SupplierType)
  @IsOptional()
  type?: SupplierType;

  @Field(() => SupplierStatus, { nullable: true })
  @IsEnum(SupplierStatus)
  @IsOptional()
  status?: SupplierStatus;

  // Contact Information
  @Field({ nullable: true })
  @IsString()
  @IsOptional()
  contactPerson?: string;

  @Field({ nullable: true })
  @IsEmail()
  @IsOptional()
  email?: string;

  @Field({ nullable: true })
  @IsString()
  @IsOptional()
  phone?: string;

  @Field({ nullable: true })
  @IsUrl()
  @IsOptional()
  website?: string;

  // Address Information
  @Field({ nullable: true })
  @IsString()
  @IsOptional()
  address?: string;

  @Field({ nullable: true })
  @IsString()
  @IsOptional()
  city?: string;

  @Field({ nullable: true })
  @IsString()
  @IsOptional()
  state?: string;

  @Field({ nullable: true })
  @IsString()
  @IsOptional()
  postalCode?: string;

  @Field({ nullable: true })
  @IsString()
  @IsOptional()
  country?: string;

  // Business Information
  @Field({ nullable: true })
  @IsString()
  @IsOptional()
  taxId?: string;

  @Field({ nullable: true })
  @IsString()
  @IsOptional()
  registrationNumber?: string;

  // Payment & Terms
  @Field(() => Int, { nullable: true })
  @IsNumber()
  @Min(0)
  @IsOptional()
  paymentTermsDays?: number;

  @Field({ nullable: true })
  @IsString()
  @IsOptional()
  preferredCurrency?: string;

  @Field({ nullable: true })
  @IsNumber()
  @Min(0)
  @Max(100)
  @IsOptional()
  discountPercentage?: number;

  // Shipping & Delivery
  @Field(() => Int, { nullable: true })
  @IsNumber()
  @Min(0)
  @IsOptional()
  leadTimeDays?: number;

  @Field({ nullable: true })
  @IsNumber()
  @Min(0)
  @IsOptional()
  minimumOrderAmount?: number;

  @Field({ nullable: true })
  @IsNumber()
  @Min(0)
  @IsOptional()
  shippingCost?: number;

  @Field({ nullable: true })
  @IsNumber()
  @Min(0)
  @IsOptional()
  freeShippingThreshold?: number;

  // Performance Metrics
  @Field(() => Int, { nullable: true })
  @IsNumber()
  @Min(1)
  @Max(100)
  @IsOptional()
  reliabilityScore?: number;

  @Field(() => Int, { nullable: true })
  @IsNumber()
  @Min(1)
  @Max(100)
  @IsOptional()
  qualityScore?: number;

  @Field({ nullable: true })
  @IsNumber()
  @Min(0)
  @Max(100)
  @IsOptional()
  onTimeDeliveryRate?: number;

  // Notes
  @Field({ nullable: true })
  @IsString()
  @IsOptional()
  notes?: string;

  @Field({ nullable: true })
  @IsString()
  @IsOptional()
  tags?: string;

  @Field({ nullable: true })
  @IsOptional()
  lastOrderDate?: Date;
}

@InputType()
export class UpdateSupplierInput {
  @Field(() => Int)
  @IsNumber()
  id: number;

  @Field({ nullable: true })
  @IsString()
  @IsOptional()
  name?: string;

  @Field({ nullable: true })
  @IsString()
  @IsOptional()
  supplierCode?: string;

  @Field({ nullable: true })
  @IsString()
  @IsOptional()
  description?: string;

  @Field(() => SupplierType, { nullable: true })
  @IsEnum(SupplierType)
  @IsOptional()
  type?: SupplierType;

  @Field(() => SupplierStatus, { nullable: true })
  @IsEnum(SupplierStatus)
  @IsOptional()
  status?: SupplierStatus;

  // Contact Information
  @Field({ nullable: true })
  @IsString()
  @IsOptional()
  contactPerson?: string;

  @Field({ nullable: true })
  @IsEmail()
  @IsOptional()
  email?: string;

  @Field({ nullable: true })
  @IsString()
  @IsOptional()
  phone?: string;

  @Field({ nullable: true })
  @IsUrl()
  @IsOptional()
  website?: string;

  // Address Information
  @Field({ nullable: true })
  @IsString()
  @IsOptional()
  address?: string;

  @Field({ nullable: true })
  @IsString()
  @IsOptional()
  city?: string;

  @Field({ nullable: true })
  @IsString()
  @IsOptional()
  state?: string;

  @Field({ nullable: true })
  @IsString()
  @IsOptional()
  postalCode?: string;

  @Field({ nullable: true })
  @IsString()
  @IsOptional()
  country?: string;

  // Business Information
  @Field({ nullable: true })
  @IsString()
  @IsOptional()
  taxId?: string;

  @Field({ nullable: true })
  @IsString()
  @IsOptional()
  registrationNumber?: string;

  // Payment & Terms
  @Field(() => Int, { nullable: true })
  @IsNumber()
  @Min(0)
  @IsOptional()
  paymentTermsDays?: number;

  @Field({ nullable: true })
  @IsString()
  @IsOptional()
  preferredCurrency?: string;

  @Field({ nullable: true })
  @IsNumber()
  @Min(0)
  @Max(100)
  @IsOptional()
  discountPercentage?: number;

  // Shipping & Delivery
  @Field(() => Int, { nullable: true })
  @IsNumber()
  @Min(0)
  @IsOptional()
  leadTimeDays?: number;

  @Field({ nullable: true })
  @IsNumber()
  @Min(0)
  @IsOptional()
  minimumOrderAmount?: number;

  @Field({ nullable: true })
  @IsNumber()
  @Min(0)
  @IsOptional()
  shippingCost?: number;

  @Field({ nullable: true })
  @IsNumber()
  @Min(0)
  @IsOptional()
  freeShippingThreshold?: number;

  // Performance Metrics
  @Field(() => Int, { nullable: true })
  @IsNumber()
  @Min(1)
  @Max(100)
  @IsOptional()
  reliabilityScore?: number;

  @Field(() => Int, { nullable: true })
  @IsNumber()
  @Min(1)
  @Max(100)
  @IsOptional()
  qualityScore?: number;

  @Field({ nullable: true })
  @IsNumber()
  @Min(0)
  @Max(100)
  @IsOptional()
  onTimeDeliveryRate?: number;

  // Notes
  @Field({ nullable: true })
  @IsString()
  @IsOptional()
  notes?: string;

  @Field({ nullable: true })
  @IsString()
  @IsOptional()
  tags?: string;

  @Field({ nullable: true })
  @IsOptional()
  lastOrderDate?: Date;
}
