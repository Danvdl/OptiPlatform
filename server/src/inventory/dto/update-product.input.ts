import { Field, InputType, Int, PartialType } from '@nestjs/graphql';
import { CreateProductInput } from './create-product.input';
import { IsInt } from 'class-validator';

@InputType()
export class UpdateProductInput extends PartialType(CreateProductInput) {
  @Field(() => Int)
  @IsInt()
  id: number;
}
