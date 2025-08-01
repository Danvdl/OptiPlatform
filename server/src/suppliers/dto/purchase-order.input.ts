import { Field, InputType, Int } from '@nestjs/graphql';
import { IsString, IsOptional, IsNumber, IsEnum, IsDateString, IsArray, ValidateNested, IsBoolean, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';
import { PurchaseOrderStatus, PurchaseOrderPriority } from '../entities/purchase-order.entity';

@InputType()
export class CreatePurchaseOrderItemInput {
  @Field(() => Int)
  @IsNumber()
  productId: number;

  @Field({ nullable: true })
  @IsString()
  @IsOptional()
  supplierSku?: string;

  @Field({ nullable: true })
  @IsString()
  @IsOptional()
  productName?: string;

  @Field({ nullable: true })
  @IsString()
  @IsOptional()
  description?: string;

  @Field(() => Int)
  @IsNumber()
  @Min(1)
  quantityOrdered: number;

  @Field()
  @IsNumber()
  @Min(0)
  unitPrice: number;

  @Field({ nullable: true })
  @IsNumber()
  @Min(0)
  @Max(100)
  @IsOptional()
  discountPercentage?: number;

  @Field({ nullable: true })
  @IsNumber()
  @Min(0)
  @Max(100)
  @IsOptional()
  taxPercentage?: number;

  @Field({ nullable: true })
  @IsString()
  @IsOptional()
  unitOfMeasure?: string;

  @Field(() => Int, { nullable: true })
  @IsNumber()
  @Min(0)
  @IsOptional()
  leadTimeDays?: number;

  @Field({ nullable: true })
  @IsDateString()
  @IsOptional()
  expectedDeliveryDate?: string;

  @Field({ nullable: true })
  @IsString()
  @IsOptional()
  notes?: string;
}

@InputType()
export class CreatePurchaseOrderInput {
  @Field(() => Int)
  @IsNumber()
  supplierId: number;

  @Field(() => PurchaseOrderPriority, { nullable: true })
  @IsEnum(PurchaseOrderPriority)
  @IsOptional()
  priority?: PurchaseOrderPriority;

  @Field({ nullable: true })
  @IsString()
  @IsOptional()
  description?: string;

  @Field({ nullable: true })
  @IsString()
  @IsOptional()
  notes?: string;

  @Field({ nullable: true })
  @IsString()
  @IsOptional()
  currency?: string;

  @Field({ nullable: true })
  @IsDateString()
  @IsOptional()
  requestedDeliveryDate?: string;

  // Delivery Information
  @Field({ nullable: true })
  @IsString()
  @IsOptional()
  deliveryAddress?: string;

  @Field({ nullable: true })
  @IsString()
  @IsOptional()
  deliveryContact?: string;

  @Field({ nullable: true })
  @IsString()
  @IsOptional()
  deliveryPhone?: string;

  @Field({ nullable: true })
  @IsString()
  @IsOptional()
  deliveryInstructions?: string;

  // Terms
  @Field(() => Int, { nullable: true })
  @IsNumber()
  @Min(0)
  @IsOptional()
  paymentTermsDays?: number;

  @Field({ nullable: true })
  @IsString()
  @IsOptional()
  paymentMethod?: string;

  @Field({ nullable: true })
  @IsString()
  @IsOptional()
  termsConditions?: string;

  // References
  @Field({ nullable: true })
  @IsString()
  @IsOptional()
  requisitionNumber?: string;

  @Field({ nullable: true })
  @IsString()
  @IsOptional()
  projectCode?: string;

  // Flags
  @Field({ nullable: true })
  @IsBoolean()
  @IsOptional()
  requiresApproval?: boolean;

  @Field({ nullable: true })
  @IsBoolean()
  @IsOptional()
  isRecurring?: boolean;

  // Items
  @Field(() => [CreatePurchaseOrderItemInput])
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreatePurchaseOrderItemInput)
  items: CreatePurchaseOrderItemInput[];
}

@InputType()
export class UpdatePurchaseOrderInput {
  @Field(() => Int)
  @IsNumber()
  id: number;

  @Field(() => PurchaseOrderStatus, { nullable: true })
  @IsEnum(PurchaseOrderStatus)
  @IsOptional()
  status?: PurchaseOrderStatus;

  @Field(() => PurchaseOrderPriority, { nullable: true })
  @IsEnum(PurchaseOrderPriority)
  @IsOptional()
  priority?: PurchaseOrderPriority;

  @Field({ nullable: true })
  @IsString()
  @IsOptional()
  description?: string;

  @Field({ nullable: true })
  @IsString()
  @IsOptional()
  notes?: string;

  @Field({ nullable: true })
  @IsDateString()
  @IsOptional()
  expectedDeliveryDate?: string;

  @Field({ nullable: true })
  @IsDateString()
  @IsOptional()
  requestedDeliveryDate?: string;

  @Field({ nullable: true })
  @IsString()
  @IsOptional()
  trackingNumber?: string;

  @Field({ nullable: true })
  @IsString()
  @IsOptional()
  carrier?: string;

  @Field({ nullable: true })
  @IsString()
  @IsOptional()
  supplierReference?: string;

  @Field({ nullable: true })
  @IsString()
  @IsOptional()
  deliveryAddress?: string;

  @Field({ nullable: true })
  @IsString()
  @IsOptional()
  deliveryContact?: string;

  @Field({ nullable: true })
  @IsString()
  @IsOptional()
  deliveryPhone?: string;

  @Field({ nullable: true })
  @IsString()
  @IsOptional()
  deliveryInstructions?: string;
}

@InputType()
export class ReceivePurchaseOrderItemInput {
  @Field(() => Int)
  @IsNumber()
  itemId: number;

  @Field(() => Int)
  @IsNumber()
  @Min(0)
  quantityReceived: number;

  @Field({ nullable: true })
  @IsDateString()
  @IsOptional()
  actualDeliveryDate?: string;

  @Field({ nullable: true })
  @IsString()
  @IsOptional()
  qualityNotes?: string;

  @Field({ nullable: true })
  @IsNumber()
  @Min(1)
  @Max(5)
  @IsOptional()
  qualityRating?: number;

  @Field({ nullable: true })
  @IsBoolean()
  @IsOptional()
  qualityApproved?: boolean;

  @Field({ nullable: true })
  @IsString()
  @IsOptional()
  notes?: string;
}

@InputType()
export class AutoRestockSettingsInput {
  @Field(() => Int)
  @IsNumber()
  productId: number;

  @Field()
  @IsBoolean()
  enableAutoRestock: boolean;

  @Field(() => Int, { nullable: true })
  @IsNumber()
  @Min(0)
  @IsOptional()
  restockThreshold?: number;

  @Field(() => Int, { nullable: true })
  @IsNumber()
  @Min(1)
  @IsOptional()
  restockQuantity?: number;

  @Field(() => Int, { nullable: true })
  @IsNumber()
  @IsOptional()
  preferredSupplierId?: number;
}
