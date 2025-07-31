import { Field, InputType, Int } from '@nestjs/graphql';
import { IsInt, IsString, IsOptional, IsNumber } from 'class-validator';

@InputType()
export class CreatePriceHistoryInput {
  @Field(() => Int)
  @IsInt()
  productId: number;

  @Field(() => Int, { nullable: true })
  @IsInt()
  @IsOptional()
  userId?: number;

  @Field()
  @IsString()
  priceType: string; // 'purchase' or 'sale'

  @Field()
  @IsNumber()
  oldPrice: number;

  @Field()
  @IsNumber()
  newPrice: number;

  @Field({ nullable: true, defaultValue: 'USD' })
  @IsString()
  @IsOptional()
  currency?: string;

  @Field({ nullable: true })
  @IsString()
  @IsOptional()
  reason?: string;
}
