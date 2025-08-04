import { InputType, Field, Int } from '@nestjs/graphql';
import { IsEnum, IsString, IsOptional } from 'class-validator';
import { PreferenceType } from '../user-preferences.entity';

@InputType()
export class SetUserPreferenceInput {
  @Field(() => PreferenceType)
  @IsEnum(PreferenceType)
  preferenceType: PreferenceType;

  @Field()
  @IsString()
  value: string;
}

@InputType()
export class ActivityLogFilterInput {
  @Field(() => Int, { nullable: true })
  @IsOptional()
  userId?: number;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  entityType?: string;

  @Field(() => Int, { nullable: true })
  @IsOptional()
  entityId?: number;

  @Field({ nullable: true })
  @IsOptional()
  dateFrom?: Date;

  @Field({ nullable: true })
  @IsOptional()
  dateTo?: Date;

  @Field(() => Int, { defaultValue: 50 })
  limit: number = 50;

  @Field(() => Int, { defaultValue: 0 })
  offset: number = 0;
}
