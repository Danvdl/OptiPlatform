import { InputType, Field } from '@nestjs/graphql';
import { IsEmail, IsNotEmpty, IsString, MinLength, IsOptional, IsEnum, IsUrl } from 'class-validator';
import { IndustryType, CompanySize } from '../entities/tenant.entity';

@InputType()
export class RegisterTenantInput {
  // Owner Information
  @Field()
  @IsNotEmpty()
  @IsString()
  @MinLength(3)
  username: string;

  @Field()
  @IsNotEmpty()
  @IsEmail()
  email: string;

  @Field()
  @IsNotEmpty()
  @IsString()
  @MinLength(8)
  password: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  firstName?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  lastName?: string;

  // Business Information
  @Field()
  @IsNotEmpty()
  @IsString()
  @MinLength(2)
  businessName: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  legalName?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  taxId?: string;

  @Field(() => IndustryType, { nullable: true })
  @IsOptional()
  @IsEnum(IndustryType)
  industry?: IndustryType;

  @Field(() => CompanySize, { nullable: true })
  @IsOptional()
  @IsEnum(CompanySize)
  companySize?: CompanySize;

  @Field({ nullable: true })
  @IsOptional()
  @IsUrl()
  website?: string;

  // Contact Information
  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  phoneNumber?: string;

  // Address Information (optional during registration)
  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  addressLine1?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  city?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  state?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  postalCode?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  country?: string;

  // Business Settings
  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  currency?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  timezone?: string;
}

@InputType()
export class UpdateTenantInput {
  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  businessName?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  legalName?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  taxId?: string;

  @Field(() => IndustryType, { nullable: true })
  @IsOptional()
  @IsEnum(IndustryType)
  industry?: IndustryType;

  @Field(() => CompanySize, { nullable: true })
  @IsOptional()
  @IsEnum(CompanySize)
  companySize?: CompanySize;

  @Field({ nullable: true })
  @IsOptional()
  @IsUrl()
  website?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  logo?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  phoneNumber?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsEmail()
  supportEmail?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  addressLine1?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  addressLine2?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  city?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  state?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  postalCode?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  country?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  currency?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  timezone?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  language?: string;
}
