import { Field, ObjectType, Int } from '@nestjs/graphql';
import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Supplier } from './supplier.entity';
import { Product } from '../../inventory/entities/product.entity';

@ObjectType()
@Entity({ name: 'supplier_products' })
export class SupplierProduct {
  @Field(() => Int)
  @PrimaryGeneratedColumn()
  id: number;

  @Field(() => Int)
  @Column({ name: 'supplier_id' })
  supplierId: number;

  @Field(() => Int)
  @Column({ name: 'product_id' })
  productId: number;

  @Field({ nullable: true })
  @Column({ name: 'supplier_sku', nullable: true })
  supplierSku?: string;

  @Field({ nullable: true })
  @Column({ name: 'supplier_product_name', nullable: true })
  supplierProductName?: string;

  @Field()
  @Column({ type: 'decimal', precision: 10, scale: 2, name: 'unit_price' })
  unitPrice: number;

  @Field({ nullable: true })
  @Column({ name: 'currency', default: 'USD' })
  currency?: string;

  @Field(() => Int, { nullable: true })
  @Column({ name: 'minimum_order_quantity', nullable: true })
  minimumOrderQuantity?: number;

  @Field(() => Int, { nullable: true })
  @Column({ name: 'lead_time_days', nullable: true })
  leadTimeDays?: number;

  @Field({ nullable: true })
  @Column({ type: 'decimal', precision: 5, scale: 2, name: 'discount_percentage', nullable: true })
  discountPercentage?: number;

  @Field({ nullable: true })
  @Column({ name: 'package_size', nullable: true })
  packageSize?: string;

  @Field({ nullable: true })
  @Column({ name: 'package_unit', nullable: true })
  packageUnit?: string;

  @Field({ nullable: true })
  @Column({ type: 'text', nullable: true })
  notes?: string;

  @Field()
  @Column({ default: true, name: 'is_active' })
  isActive: boolean;

  @Field()
  @Column({ default: false, name: 'is_preferred' })
  isPreferred: boolean;

  @Field({ nullable: true })
  @Column({ type: 'date', nullable: true, name: 'last_price_update' })
  lastPriceUpdate?: Date;

  @Field()
  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP', name: 'created_at' })
  createdAt: Date;

  @Field({ nullable: true })
  @Column({ type: 'timestamp', nullable: true, name: 'updated_at' })
  updatedAt?: Date;

  // Relations
  @Field(() => Supplier)
  @ManyToOne(() => Supplier, supplier => supplier.supplierProducts)
  @JoinColumn({ name: 'supplier_id' })
  supplier: Supplier;

  @Field(() => Product)
  @ManyToOne(() => Product)
  @JoinColumn({ name: 'product_id' })
  product: Product;
}
