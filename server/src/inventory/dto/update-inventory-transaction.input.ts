import { Field, InputType, Int, PartialType } from '@nestjs/graphql';
import { CreateInventoryTransactionInput } from './create-inventory-transaction.input';
import { IsInt, IsNumber, IsOptional } from 'class-validator';

@InputType()
export class UpdateInventoryTransactionInput extends PartialType(CreateInventoryTransactionInput) {
  @Field(() => Int)
  @IsInt()
  id: number;

  @Field({ nullable: true })
  @IsNumber()
  @IsOptional()
  unitCost?: number;

  @Field({ nullable: true })
  @IsNumber()
  @IsOptional()
  totalCost?: number;
}
