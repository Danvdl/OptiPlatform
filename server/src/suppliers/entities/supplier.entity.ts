import { Field, ObjectType, Int, registerEnumType } from '@nestjs/graphql';
import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { PurchaseOrder } from './purchase-order.entity';
import { SupplierProduct } from './supplier-product.entity';

export enum SupplierStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  SUSPENDED = 'suspended',
  PENDING_APPROVAL = 'pending_approval'
}

registerEnumType(SupplierStatus, {
  name: 'SupplierStatus',
  description: 'The status of the supplier',
});

export enum SupplierType {
  MANUFACTURER = 'manufacturer',
  DISTRIBUTOR = 'distributor',
  WHOLESALER = 'wholesaler',
  RETAILER = 'retailer',
  SERVICE_PROVIDER = 'service_provider'
}

registerEnumType(SupplierType, {
  name: 'SupplierType',
  description: 'The type of supplier',
});

@ObjectType()
@Entity({ name: 'suppliers' })
export class Supplier {
  @Field(() => Int)
  @PrimaryGeneratedColumn()
  id: number;

  @Field()
  @Column({ unique: true })
  name: string;

  @Field({ nullable: true })
  @Column({ name: 'supplier_code', type: 'varchar', length: 100, unique: true, nullable: true })
  supplierCode?: string;

  @Field({ nullable: true })
  @Column({ type: 'text', nullable: true })
  description?: string;

  @Field(() => SupplierType)
  @Column({ 
    name: 'supplier_type',
    type: 'enum', 
    enum: SupplierType,
    default: SupplierType.DISTRIBUTOR 
  })
  type: SupplierType;

  @Field(() => SupplierStatus)
  @Column({ 
    type: 'enum', 
    enum: SupplierStatus,
    default: SupplierStatus.ACTIVE 
  })
  status: SupplierStatus;

  // Contact Information
  @Field({ nullable: true })
  @Column({ name: 'contact_person', nullable: true })
  contactPerson?: string;

  @Field({ nullable: true })
  @Column({ nullable: true })
  email?: string;

  @Field({ nullable: true })
  @Column({ nullable: true })
  phone?: string;

  @Field({ nullable: true })
  @Column({ nullable: true })
  website?: string;

  // Address Information
  @Field({ nullable: true })
  @Column({ nullable: true })
  address?: string;

  @Field({ nullable: true })
  @Column({ nullable: true })
  city?: string;

  @Field({ nullable: true })
  @Column({ name: 'state_province', nullable: true })
  state?: string;

  @Field({ nullable: true })
  @Column({ name: 'postal_code', nullable: true })
  postalCode?: string;

  @Field({ nullable: true })
  @Column({ nullable: true })
  country?: string;

  // Business Information
  @Field({ nullable: true })
  @Column({ name: 'tax_id', nullable: true })
  taxId?: string;

  @Field({ nullable: true })
  @Column({ name: 'business_registration', nullable: true })
  registrationNumber?: string;

  // Payment & Terms
  @Field(() => Int, { nullable: true })
  @Column({ name: 'payment_terms_days', nullable: true })
  paymentTermsDays?: number;

  @Field({ nullable: true })
  @Column({ name: 'preferred_currency', default: 'USD' })
  preferredCurrency?: string;

  @Field({ nullable: true })
  @Column({ type: 'decimal', precision: 5, scale: 2, name: 'discount_percentage', nullable: true })
  discountPercentage?: number;

  // Shipping & Delivery
  @Field(() => Int, { nullable: true })
  @Column({ name: 'lead_time_days', nullable: true })
  leadTimeDays?: number;

  @Field({ nullable: true })
  @Column({ type: 'decimal', precision: 10, scale: 2, name: 'minimum_order_amount', nullable: true })
  minimumOrderAmount?: number;

  @Field({ nullable: true })
  @Column({ type: 'decimal', precision: 10, scale: 2, name: 'shipping_cost', nullable: true })
  shippingCost?: number;

  @Field({ nullable: true })
  @Column({ name: 'free_shipping_threshold', type: 'decimal', precision: 10, scale: 2, nullable: true })
  freeShippingThreshold?: number;

  // Performance Metrics
  @Field(() => Int, { nullable: true })
  @Column({ name: 'reliability_score', type: 'int', nullable: true })
  reliabilityScore?: number; // 1-100

  @Field(() => Int, { nullable: true })
  @Column({ name: 'quality_score', type: 'int', nullable: true })
  qualityScore?: number; // 1-100

  @Field({ nullable: true })
  @Column({ type: 'decimal', precision: 5, scale: 2, name: 'on_time_delivery_rate', nullable: true })
  onTimeDeliveryRate?: number; // Percentage

  // Notes and Additional Info
  @Field({ nullable: true })
  @Column({ type: 'text', nullable: true })
  notes?: string;

  @Field({ nullable: true })
  @Column({ type: 'text', nullable: true })
  tags?: string; // Comma-separated tags

  // Timestamps
  @Field()
  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP', name: 'created_at' })
  createdAt: Date;

  @Field({ nullable: true })
  @Column({ type: 'timestamp', nullable: true, name: 'updated_at' })
  updatedAt?: Date;

  @Field({ nullable: true })
  @Column({ type: 'timestamp', nullable: true, name: 'last_order_date' })
  lastOrderDate?: Date;

  // Relations
  @Field(() => [PurchaseOrder])
  @OneToMany(() => PurchaseOrder, purchaseOrder => purchaseOrder.supplier)
  purchaseOrders: PurchaseOrder[];

  @Field(() => [SupplierProduct])
  @OneToMany(() => SupplierProduct, supplierProduct => supplierProduct.supplier)
  supplierProducts: SupplierProduct[];
}
