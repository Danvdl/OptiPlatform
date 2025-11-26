import { Field, ObjectType, Int, registerEnumType } from '@nestjs/graphql';
import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { PurchaseOrder } from './purchase-order.entity';
import { Product } from '../../inventory/entities/product.entity';

export enum PurchaseOrderItemStatus {
  PENDING = 'pending',
  ORDERED = 'ordered',
  PARTIALLY_RECEIVED = 'partially_received',
  RECEIVED = 'received',
  CANCELLED = 'cancelled',
  BACKORDERED = 'backordered'
}

registerEnumType(PurchaseOrderItemStatus, {
  name: 'PurchaseOrderItemStatus',
  description: 'The status of the purchase order item',
});

@ObjectType()
@Entity({ name: 'purchase_order_items' })
export class PurchaseOrderItem {
  @Field(() => Int)
  @PrimaryGeneratedColumn()
  id: number;

  @Field(() => Int)
  @Column({ name: 'purchase_order_id' })
  purchaseOrderId: number;

  @Field(() => Int)
  @Column({ name: 'product_id' })
  productId: number;

  @Field(() => PurchaseOrderItemStatus)
  @Column({ 
    type: 'enum', 
    enum: PurchaseOrderItemStatus,
    default: PurchaseOrderItemStatus.PENDING 
  })
  status: PurchaseOrderItemStatus;

  // Product Information
  @Field({ nullable: true })
  @Column({ name: 'supplier_sku', nullable: true })
  supplierSku?: string;

  @Field({ nullable: true })
  @Column({ name: 'product_name', nullable: true })
  productName?: string;

  @Field({ nullable: true })
  @Column({ type: 'text', nullable: true })
  description?: string;

  // Quantity Information
  @Field(() => Int)
  @Column({ name: 'quantity_ordered' })
  quantityOrdered: number;

  @Field(() => Int)
  @Column({ name: 'quantity_received', default: 0 })
  quantityReceived: number;

  @Field(() => Int)
  @Column({ name: 'quantity_cancelled', default: 0 })
  quantityCancelled: number;

  @Field(() => Int)
  @Column({ name: 'quantity_backordered', default: 0 })
  quantityBackordered: number;

  // Pricing Information
  @Field()
  @Column({ type: 'decimal', precision: 10, scale: 2, name: 'unit_price' })
  unitPrice: number;

  @Field()
  @Column({ type: 'decimal', precision: 12, scale: 2, name: 'line_total' })
  lineTotal: number;

  @Field({ nullable: true })
  @Column({ type: 'decimal', precision: 5, scale: 2, name: 'discount_percentage', nullable: true })
  discountPercentage?: number;

  @Field({ nullable: true })
  @Column({ type: 'decimal', precision: 10, scale: 2, name: 'discount_amount', nullable: true })
  discountAmount?: number;

  @Field({ nullable: true })
  @Column({ type: 'decimal', precision: 5, scale: 2, name: 'tax_percentage', nullable: true })
  taxPercentage?: number;

  @Field({ nullable: true })
  @Column({ type: 'decimal', precision: 10, scale: 2, name: 'tax_amount', nullable: true })
  taxAmount?: number;

  // Additional Information
  @Field({ nullable: true })
  @Column({ name: 'unit_of_measure', nullable: true })
  unitOfMeasure?: string;

  @Field(() => Int, { nullable: true })
  @Column({ name: 'lead_time_days', nullable: true })
  leadTimeDays?: number;

  @Field({ nullable: true })
  @Column({ type: 'date', nullable: true, name: 'expected_delivery_date' })
  expectedDeliveryDate?: Date;

  @Field({ nullable: true })
  @Column({ type: 'date', nullable: true, name: 'actual_delivery_date' })
  actualDeliveryDate?: Date;

  @Field({ nullable: true })
  @Column({ type: 'text', nullable: true })
  notes?: string;

  // Quality Control
  @Field({ nullable: true })
  @Column({ type: 'text', nullable: true, name: 'quality_notes' })
  qualityNotes?: string;

  @Field({ nullable: true })
  @Column({ name: 'quality_rating', nullable: true })
  qualityRating?: number; // 1-5 stars

  @Field()
  @Column({ default: false, name: 'quality_approved' })
  qualityApproved: boolean;

  @Field({ nullable: true })
  @Column({ type: 'uuid', name: 'tenant_id', nullable: true })
  tenantId?: string;

  // Timestamps
  @Field()
  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP', name: 'created_at' })
  createdAt: Date;

  @Field({ nullable: true })
  @Column({ type: 'timestamp', nullable: true, name: 'updated_at' })
  updatedAt?: Date;

  @Field({ nullable: true })
  @Column({ type: 'timestamp', nullable: true, name: 'received_at' })
  receivedAt?: Date;

  // Relations
  @Field(() => PurchaseOrder)
  @ManyToOne(() => PurchaseOrder, purchaseOrder => purchaseOrder.items)
  @JoinColumn({ name: 'purchase_order_id' })
  purchaseOrder: PurchaseOrder;

  @Field(() => Product)
  @ManyToOne(() => Product)
  @JoinColumn({ name: 'product_id' })
  product: Product;
}
