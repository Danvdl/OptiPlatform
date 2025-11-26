import { Field, ObjectType, Int, registerEnumType } from '@nestjs/graphql';
import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Product } from './product.entity';
import { User } from '../../user/user.entity';

export enum TransactionType {
  ADD = 'add',
  REMOVE = 'remove',
  ADJUSTMENT = 'adjustment',
  TRANSFER_OUT = 'transfer_out',
  TRANSFER_IN = 'transfer_in',
  RETURN_TO_SUPPLIER = 'return_to_supplier',
  RETURN_FROM_CUSTOMER = 'return_from_customer',
  WASTE = 'waste',
  DAMAGED = 'damaged',
  RESERVE = 'reserve',
  UNRESERVE = 'unreserve',
  SALE = 'sale',
  PURCHASE = 'purchase'
}

registerEnumType(TransactionType, {
  name: 'TransactionType',
  description: 'The type of inventory transaction',
});

export enum TransactionStatus {
  PENDING = 'pending',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
  REVERSED = 'reversed'
}

registerEnumType(TransactionStatus, {
  name: 'TransactionStatus',
  description: 'The status of the transaction',
});

@ObjectType()
@Entity({ name: 'inventory_transactions' })
export class InventoryTransaction {
  @Field(() => Int)
  @PrimaryGeneratedColumn()
  id: number;

  @Field(() => Int)
  @Column({ name: 'product_id' })
  productId: number;

  @Field(() => Int)
  @Column({ name: 'user_id' })
  userId: number;

  @Field(() => Int)
  @Column()
  quantity: number;

  @Field(() => TransactionType)
  @Column({ 
    type: 'enum', 
    enum: TransactionType,
    name: 'transaction_type' 
  })
  transactionType: TransactionType;

  @Field(() => TransactionStatus)
  @Column({ 
    type: 'enum', 
    enum: TransactionStatus,
    default: TransactionStatus.COMPLETED,
    name: 'status' 
  })
  status: TransactionStatus;

  @Field({ nullable: true })
  @Column({ type: 'text', nullable: true })
  notes?: string;

  @Field({ nullable: true })
  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true, name: 'unit_cost' })
  unitCost?: number;

  @Field({ nullable: true })
  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true, name: 'total_cost' })
  totalCost?: number;

  // Transfer-specific fields
  @Field(() => Int, { nullable: true })
  @Column({ name: 'from_location_id', nullable: true })
  fromLocationId?: number;

  @Field(() => Int, { nullable: true })
  @Column({ name: 'to_location_id', nullable: true })
  toLocationId?: number;

  // Reference to another transaction (for reversals, related transactions)
  @Field(() => Int, { nullable: true })
  @Column({ name: 'reference_transaction_id', nullable: true })
  referenceTransactionId?: number;

  // Supplier information for returns
  @Field({ nullable: true })
  @Column({ name: 'supplier_name', nullable: true })
  supplierName?: string;

  @Field({ nullable: true })
  @Column({ name: 'supplier_reference', nullable: true })
  supplierReference?: string;

  // Reason codes for waste/damage
  @Field({ nullable: true })
  @Column({ name: 'reason_code', nullable: true })
  reasonCode?: string;

  // Expiry date for waste tracking
  @Field({ nullable: true })
  @Column({ type: 'date', name: 'expiry_date', nullable: true })
  expiryDate?: Date;

  // Reservation details
  @Field({ nullable: true })
  @Column({ name: 'reservation_reference', nullable: true })
  reservationReference?: string;

  @Field({ nullable: true })
  @Column({ type: 'timestamp', name: 'reservation_expires_at', nullable: true })
  reservationExpiresAt?: Date;

  @Field({ nullable: true })
  @Column({ type: 'uuid', name: 'tenant_id', nullable: true })
  tenantId?: string;

  @Field()
  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP', name: 'occurred_at' })
  occurredAt: Date;

  @Field()
  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP', name: 'created_at' })
  createdAt: Date;

  @Field({ nullable: true })
  @Column({ type: 'timestamp', nullable: true, name: 'updated_at' })
  updatedAt?: Date;

  // Product relation exposed to GraphQL
  @Field(() => Product)
  @ManyToOne(() => Product)
  @JoinColumn({ name: 'product_id' })
  product: Product;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user: User;
}
