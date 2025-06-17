import { Field, InputType, Int } from '@nestjs/graphql';
import { IsInt, IsString } from 'class-validator';

@InputType()
export class CreateInventoryTransactionInput {
  @Field(() => Int)
  @IsInt()
  productId: number;

  @Field(() => Int)
  @IsInt()
  locationId: number;

  @Field(() => Int, { nullable: true })
  @IsInt()
  userId?: number;

  @Field(() => Int)
  @IsInt()
  quantity: number;

  @Field()
  @IsString()
  transactionType: string;
}
