import { InputType, Field } from '@nestjs/graphql';
import { IsEmail, IsNotEmpty, IsString, MinLength, IsOptional, IsEnum } from 'class-validator';

export enum TenantUserRole {
  OWNER = 'owner',
  ADMIN = 'admin',
  MANAGER = 'manager',
  MEMBER = 'member',
  READONLY = 'readonly'
}

@InputType()
export class InviteUserInput {
  @Field()
  @IsNotEmpty()
  @IsEmail()
  email: string;

  @Field()
  @IsNotEmpty()
  @IsString()
  firstName: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  lastName?: string;

  @Field(() => String)
  @IsNotEmpty()
  @IsEnum(TenantUserRole)
  role: TenantUserRole;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  department?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  position?: string;
}

@InputType()
export class CreateTeamMemberInput {
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

  @Field()
  @IsNotEmpty()
  @IsString()
  firstName: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  lastName?: string;

  @Field(() => String)
  @IsNotEmpty()
  @IsEnum(TenantUserRole)
  tenantRole: TenantUserRole;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  department?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  position?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  phoneNumber?: string;
}

@InputType()
export class UpdateTeamMemberInput {
  @Field()
  @IsNotEmpty()
  userId: number;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  firstName?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  lastName?: string;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsEnum(TenantUserRole)
  tenantRole?: TenantUserRole;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  department?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  position?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  phoneNumber?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  status?: string;
}
