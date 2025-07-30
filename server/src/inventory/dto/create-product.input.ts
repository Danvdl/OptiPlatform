import { Field, InputType, Int } from '@nestjs/graphql';
import { IsString, IsInt, IsOptional } from 'class-validator';

@InputType()
export class CreateProductInput {
  @Field()
  @IsString()
  name: string;

  @Field({ nullable: true })
  @IsString()
  @IsOptional()
  description?: string;

  @Field({ nullable: true })
  @IsString()
  @IsOptional()
  unit?: string;

  @Field({ nullable: true })
  @IsString()
  @IsOptional()
  sku?: string;

  @Field(() => Int, { nullable: true })
  @IsInt()
  @IsOptional()
  categoryId?: number;

  @Field(() => Int, { nullable: true, defaultValue: 5 })
  @IsInt()
  @IsOptional()
  restockThreshold?: number;
}
