import { Field, InputType, Int } from '@nestjs/graphql';
import { IsInt, IsString, IsOptional, IsNumber, IsDateString } from 'class-validator';

@InputType()
export class CreateAdjustmentInput {
  @Field(() => Int)
  @IsInt()
  productId: number;

  @Field(() => Int)
  @IsInt()
  userId: number;

  @Field(() => Int)
  @IsInt()
  adjustmentQuantity: number; // Can be positive or negative

  @Field()
  @IsString()
  reason: string; // 'count_correction', 'system_error', 'audit_finding'

  @Field({ nullable: true })
  @IsString()
  @IsOptional()
  notes?: string;

  @Field({ nullable: true })
  @IsNumber()
  @IsOptional()
  unitCost?: number;
}

@InputType()
export class CreateTransferInput {
  @Field(() => Int)
  @IsInt()
  productId: number;

  @Field(() => Int)
  @IsInt()
  userId: number;

  @Field(() => Int)
  @IsInt()
  quantity: number;

  @Field(() => Int)
  @IsInt()
  fromLocationId: number;

  @Field(() => Int)
  @IsInt()
  toLocationId: number;

  @Field({ nullable: true })
  @IsString()
  @IsOptional()
  notes?: string;

  @Field({ nullable: true })
  @IsString()
  @IsOptional()
  transferReference?: string;

  @Field({ nullable: true })
  @IsNumber()
  @IsOptional()
  unitCost?: number;
}

@InputType()
export class CreateReturnInput {
  @Field(() => Int)
  @IsInt()
  productId: number;

  @Field(() => Int)
  @IsInt()
  userId: number;

  @Field(() => Int)
  @IsInt()
  quantity: number;

  @Field()
  @IsString()
  returnType: string; // 'to_supplier', 'from_customer'

  @Field({ nullable: true })
  @IsString()
  @IsOptional()
  supplierName?: string;

  @Field({ nullable: true })
  @IsString()
  @IsOptional()
  supplierReference?: string;

  @Field()
  @IsString()
  reason: string; // 'defective', 'expired', 'customer_return', 'wrong_item'

  @Field({ nullable: true })
  @IsString()
  @IsOptional()
  notes?: string;

  @Field({ nullable: true })
  @IsNumber()
  @IsOptional()
  refundAmount?: number;

  @Field({ nullable: true })
  @IsNumber()
  @IsOptional()
  unitCost?: number;
}

@InputType()
export class CreateWasteInput {
  @Field(() => Int)
  @IsInt()
  productId: number;

  @Field(() => Int)
  @IsInt()
  userId: number;

  @Field(() => Int)
  @IsInt()
  quantity: number;

  @Field()
  @IsString()
  wasteType: string; // 'waste', 'damaged'

  @Field()
  @IsString()
  reasonCode: string; // 'expired', 'damaged_in_transit', 'customer_damage', 'spoiled'

  @Field({ nullable: true })
  @IsDateString()
  @IsOptional()
  expiryDate?: string;

  @Field({ nullable: true })
  @IsString()
  @IsOptional()
  notes?: string;

  @Field({ nullable: true })
  @IsNumber()
  @IsOptional()
  lossValue?: number;

  @Field({ nullable: true })
  @IsNumber()
  @IsOptional()
  unitCost?: number;
}

@InputType()
export class CreateReservationInput {
  @Field(() => Int)
  @IsInt()
  productId: number;

  @Field(() => Int)
  @IsInt()
  userId: number;

  @Field(() => Int)
  @IsInt()
  quantity: number;

  @Field()
  @IsString()
  reservationReference: string; // Order number, customer reference, etc.

  @Field({ nullable: true })
  @IsDateString()
  @IsOptional()
  expiresAt?: string;

  @Field({ nullable: true })
  @IsString()
  @IsOptional()
  customerInfo?: string;

  @Field({ nullable: true })
  @IsString()
  @IsOptional()
  notes?: string;
}

@InputType()
export class ReleaseReservationInput {
  @Field(() => Int)
  @IsInt()
  reservationTransactionId: number;

  @Field(() => Int)
  @IsInt()
  userId: number;

  @Field()
  @IsString()
  reason: string; // 'fulfilled', 'cancelled', 'expired'

  @Field({ nullable: true })
  @IsString()
  @IsOptional()
  notes?: string;
}
