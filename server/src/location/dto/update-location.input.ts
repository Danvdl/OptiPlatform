import { Field, InputType, Int, PartialType } from '@nestjs/graphql';
import { CreateLocationInput } from './create-location.input';
import { IsInt } from 'class-validator';

@InputType()
export class UpdateLocationInput extends PartialType(CreateLocationInput) {
  @Field(() => Int)
  @IsInt()
  id: number;
}
