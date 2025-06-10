import { Field, InputType, Int, PartialType } from '@nestjs/graphql';
import { CreateInventoryTransactionInput } from './create-inventory-transaction.input';

@InputType()
export class UpdateInventoryTransactionInput extends PartialType(CreateInventoryTransactionInput) {
  @Field(() => Int)
  id: number;
}
