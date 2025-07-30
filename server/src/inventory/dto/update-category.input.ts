import { Field, InputType, Int, PartialType } from '@nestjs/graphql';
import { CreateCategoryInput } from './create-category.input';
import { IsInt } from 'class-validator';

@InputType()
export class UpdateCategoryInput extends PartialType(CreateCategoryInput) {
  @Field(() => Int)
  @IsInt()
  id: number;
}
