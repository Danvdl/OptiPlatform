import { Field, InputType, Int } from '@nestjs/graphql';
import { IsInt, IsString, IsOptional, IsNumber, IsEnum, IsDateString } from 'class-validator';
import { TransactionType, TransactionStatus } from '../entities/inventory-transaction.entity';

@InputType()
export class CreateInventoryTransactionInput {
  @Field(() => Int)
  @IsInt()
  productId: number;

  @Field(() => Int, { nullable: true })
  @IsInt()
  @IsOptional()
  userId?: number;

  @Field(() => Int)
  @IsInt()
  quantity: number;

  @Field(() => TransactionType)
  @IsEnum(TransactionType)
  transactionType: TransactionType;

  @Field(() => TransactionStatus, { nullable: true })
  @IsEnum(TransactionStatus)
  @IsOptional()
  status?: TransactionStatus;

  @Field({ nullable: true })
  @IsString()
  @IsOptional()
  notes?: string;

  @Field({ nullable: true })
  @IsNumber()
  @IsOptional()
  unitCost?: number;

  @Field({ nullable: true })
  @IsNumber()
  @IsOptional()
  totalCost?: number;

  // Transfer-specific fields
  @Field(() => Int, { nullable: true })
  @IsInt()
  @IsOptional()
  fromLocationId?: number;

  @Field(() => Int, { nullable: true })
  @IsInt()
  @IsOptional()
  toLocationId?: number;

  // Reference transaction for reversals
  @Field(() => Int, { nullable: true })
  @IsInt()
  @IsOptional()
  referenceTransactionId?: number;

  // Supplier information for returns
  @Field({ nullable: true })
  @IsString()
  @IsOptional()
  supplierName?: string;

  @Field({ nullable: true })
  @IsString()
  @IsOptional()
  supplierReference?: string;

  // Reason codes for waste/damage
  @Field({ nullable: true })
  @IsString()
  @IsOptional()
  reasonCode?: string;

  // Expiry date for waste tracking
  @Field({ nullable: true })
  @IsDateString()
  @IsOptional()
  expiryDate?: string;

  // Reservation details
  @Field({ nullable: true })
  @IsString()
  @IsOptional()
  reservationReference?: string;

  @Field({ nullable: true })
  @IsDateString()
  @IsOptional()
  reservationExpiresAt?: string;
}
