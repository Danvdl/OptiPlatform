import { InputType, Field, Int } from '@nestjs/graphql';
import { IsEnum, IsArray } from 'class-validator';
import { Permission } from '../user-permission.entity';

@InputType()
export class GrantPermissionInput {
  @Field(() => Int)
  userId: number;

  @Field(() => Permission)
  @IsEnum(Permission)
  permission: Permission;
}

@InputType()
export class RevokePermissionInput {
  @Field(() => Int)
  userId: number;

  @Field(() => Permission)
  @IsEnum(Permission)
  permission: Permission;
}

@InputType()
export class GrantMultiplePermissionsInput {
  @Field(() => Int)
  userId: number;

  @Field(() => [Permission])
  @IsArray()
  @IsEnum(Permission, { each: true })
  permissions: Permission[];
}

@InputType()
export class SetUserPermissionsInput {
  @Field(() => Int)
  userId: number;

  @Field(() => [Permission])
  @IsArray()
  @IsEnum(Permission, { each: true })
  permissions: Permission[];
}
