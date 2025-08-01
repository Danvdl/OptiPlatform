import { ObjectType, Field, Int } from '@nestjs/graphql';

@ObjectType()
export class StatusCounts {
  @Field(() => Int, { nullable: true })
  draft?: number;

  @Field(() => Int, { nullable: true })
  pending_approval?: number;

  @Field(() => Int, { nullable: true })
  approved?: number;

  @Field(() => Int, { nullable: true })
  sent?: number;

  @Field(() => Int, { nullable: true })
  acknowledged?: number;

  @Field(() => Int, { nullable: true })
  partially_received?: number;

  @Field(() => Int, { nullable: true })
  received?: number;

  @Field(() => Int, { nullable: true })
  cancelled?: number;
}

@ObjectType()
export class SupplierPriceComparison {
  @Field(() => Int)
  supplierId: number;

  @Field()
  supplierName: string;

  @Field({ nullable: true })
  supplierSku?: string;

  @Field()
  unitPrice: number;

  @Field(() => Int)
  quantity: number;

  @Field()
  basePrice: number;

  @Field()
  discountPercentage: number;

  @Field()
  discountAmount: number;

  @Field()
  finalPrice: number;

  @Field(() => Int, { nullable: true })
  leadTimeDays?: number;

  @Field(() => Int, { nullable: true })
  minimumOrderQuantity?: number;

  @Field()
  isPreferred: boolean;

  @Field()
  reliabilityScore: number;

  @Field()
  qualityScore: number;

  @Field()
  onTimeDeliveryRate: number;
}

@ObjectType()
export class LowStockProduct {
  @Field(() => Int)
  id: number;

  @Field()
  name: string;

  @Field({ nullable: true })
  sku?: string;

  @Field(() => Int)
  restockThreshold: number;

  @Field(() => Int)
  currentStock: number;

  @Field({ nullable: true })
  unit?: string;
}

@ObjectType()
export class SupplierPerformanceMetrics {
  @Field(() => Int)
  totalOrders: number;

  @Field()
  totalValue: number;

  @Field()
  onTimeDeliveryRate: number;

  @Field()
  averageOrderValue: number;

  @Field(() => Int)
  activeProducts: number;
}

@ObjectType()
export class PurchaseOrderAnalytics {
  @Field(() => Int)
  totalOrders: number;

  @Field()
  totalValue: number;

  @Field()
  averageOrderValue: number;

  @Field()
  onTimeDeliveryRate: number;

  @Field(() => StatusCounts)
  statusCounts: StatusCounts;
}
