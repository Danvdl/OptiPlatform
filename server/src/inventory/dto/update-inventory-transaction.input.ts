import { Field, InputType, Int, PartialType } from '@nestjs/graphql';
import { CreateInventoryTransactionInput } from './create-inventory-transaction.input';
import { IsInt } from 'class-validator';

@InputType()
export class UpdateInventoryTransactionInput extends PartialType(CreateInventoryTransactionInput) {
  @Field(() => Int)
  @IsInt()
  id: number;
}
