import { Field, InputType, Int } from '@nestjs/graphql';

@InputType()
export class CreateInventoryTransactionInput {
  @Field(() => Int)
  productId: number;

  @Field(() => Int)
  quantity: number;

  @Field()
  transactionType: string;
}
