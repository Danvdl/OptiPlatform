import { Field, InputType, Int } from '@nestjs/graphql';
import { IsString, IsOptional, IsNumber, IsBoolean, Min, Max } from 'class-validator';

@InputType()
export class CreateSupplierProductInput {
  @Field(() => Int)
  @IsNumber()
  supplierId: number;

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
  supplierProductName?: string;

  @Field()
  @IsNumber()
  @Min(0)
  unitPrice: number;

  @Field({ nullable: true })
  @IsString()
  @IsOptional()
  currency?: string;

  @Field(() => Int, { nullable: true })
  @IsNumber()
  @Min(1)
  @IsOptional()
  minimumOrderQuantity?: number;

  @Field(() => Int, { nullable: true })
  @IsNumber()
  @Min(0)
  @IsOptional()
  leadTimeDays?: number;

  @Field({ nullable: true })
  @IsNumber()
  @Min(0)
  @Max(100)
  @IsOptional()
  discountPercentage?: number;

  @Field({ nullable: true })
  @IsString()
  @IsOptional()
  packageSize?: string;

  @Field({ nullable: true })
  @IsString()
  @IsOptional()
  packageUnit?: string;

  @Field({ nullable: true })
  @IsString()
  @IsOptional()
  notes?: string;

  @Field({ nullable: true })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @Field({ nullable: true })
  @IsBoolean()
  @IsOptional()
  isPreferred?: boolean;
}

@InputType()
export class UpdateSupplierProductInput {
  @Field(() => Int)
  @IsNumber()
  id: number;

  @Field({ nullable: true })
  @IsString()
  @IsOptional()
  supplierSku?: string;

  @Field({ nullable: true })
  @IsString()
  @IsOptional()
  supplierProductName?: string;

  @Field({ nullable: true })
  @IsNumber()
  @Min(0)
  @IsOptional()
  unitPrice?: number;

  @Field({ nullable: true })
  @IsString()
  @IsOptional()
  currency?: string;

  @Field(() => Int, { nullable: true })
  @IsNumber()
  @Min(1)
  @IsOptional()
  minimumOrderQuantity?: number;

  @Field(() => Int, { nullable: true })
  @IsNumber()
  @Min(0)
  @IsOptional()
  leadTimeDays?: number;

  @Field({ nullable: true })
  @IsNumber()
  @Min(0)
  @Max(100)
  @IsOptional()
  discountPercentage?: number;

  @Field({ nullable: true })
  @IsString()
  @IsOptional()
  packageSize?: string;

  @Field({ nullable: true })
  @IsString()
  @IsOptional()
  packageUnit?: string;

  @Field({ nullable: true })
  @IsString()
  @IsOptional()
  notes?: string;

  @Field({ nullable: true })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @Field({ nullable: true })
  @IsBoolean()
  @IsOptional()
  isPreferred?: boolean;
}

@InputType()
export class SupplierPriceComparisonInput {
  @Field(() => Int)
  @IsNumber()
  productId: number;

  @Field(() => Int, { nullable: true })
  @IsNumber()
  @Min(1)
  @IsOptional()
  quantity?: number;

  @Field({ nullable: true })
  @IsBoolean()
  @IsOptional()
  includeInactive?: boolean;
}
