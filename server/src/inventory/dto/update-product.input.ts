import { Field, InputType, Int, PartialType } from '@nestjs/graphql';
import { CreateProductInput } from './create-product.input';
import { IsInt, IsNumber, IsOptional, IsString } from 'class-validator';

@InputType()
export class UpdateProductInput extends PartialType(CreateProductInput) {
  @Field(() => Int)
  @IsInt()
  id: number;

  @Field({ nullable: true })
  @IsNumber()
  @IsOptional()
  purchasePrice?: number;

  @Field({ nullable: true })
  @IsNumber()
  @IsOptional()
  salePrice?: number;

  @Field({ nullable: true, defaultValue: 'USD' })
  @IsString()
  @IsOptional()
  currency?: string;
}
