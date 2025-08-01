import { Field, ObjectType, Int, registerEnumType } from '@nestjs/graphql';
import { Column, Entity, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { Supplier } from './supplier.entity';
import { PurchaseOrderItem } from './purchase-order-item.entity';
import { User } from '../../user/user.entity';

export enum PurchaseOrderStatus {
  DRAFT = 'draft',
  PENDING_APPROVAL = 'pending_approval',
  APPROVED = 'approved',
  SENT = 'sent',
  ACKNOWLEDGED = 'acknowledged',
  PARTIALLY_RECEIVED = 'partially_received',
  RECEIVED = 'received',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
  REJECTED = 'rejected'
}

registerEnumType(PurchaseOrderStatus, {
  name: 'PurchaseOrderStatus',
  description: 'The status of the purchase order',
});

export enum PurchaseOrderPriority {
  LOW = 'low',
  NORMAL = 'normal',
  HIGH = 'high',
  URGENT = 'urgent'
}

registerEnumType(PurchaseOrderPriority, {
  name: 'PurchaseOrderPriority',
  description: 'The priority level of the purchase order',
});

@ObjectType()
@Entity({ name: 'purchase_orders' })
export class PurchaseOrder {
  @Field(() => Int)
  @PrimaryGeneratedColumn()
  id: number;

  @Field()
  @Column({ unique: true, name: 'po_number' })
  poNumber: string;

  @Field(() => Int)
  @Column({ name: 'supplier_id' })
  supplierId: number;

  @Field(() => Int)
  @Column({ name: 'created_by_user_id' })
  createdByUserId: number;

  @Field(() => Int, { nullable: true })
  @Column({ name: 'approved_by_user_id', nullable: true })
  approvedByUserId?: number;

  @Field(() => PurchaseOrderStatus)
  @Column({ 
    type: 'enum', 
    enum: PurchaseOrderStatus,
    default: PurchaseOrderStatus.DRAFT 
  })
  status: PurchaseOrderStatus;

  @Field(() => PurchaseOrderPriority)
  @Column({ 
    type: 'enum', 
    enum: PurchaseOrderPriority,
    default: PurchaseOrderPriority.NORMAL 
  })
  priority: PurchaseOrderPriority;

  @Field({ nullable: true })
  @Column({ type: 'text', nullable: true })
  description?: string;

  @Field({ nullable: true })
  @Column({ type: 'text', nullable: true })
  notes?: string;

  // Financial Information
  @Field()
  @Column({ type: 'decimal', precision: 12, scale: 2, name: 'subtotal_amount' })
  subtotalAmount: number;

  @Field()
  @Column({ type: 'decimal', precision: 12, scale: 2, name: 'tax_amount', default: 0 })
  taxAmount: number;

  @Field()
  @Column({ type: 'decimal', precision: 12, scale: 2, name: 'shipping_amount', default: 0 })
  shippingAmount: number;

  @Field()
  @Column({ type: 'decimal', precision: 12, scale: 2, name: 'discount_amount', default: 0 })
  discountAmount: number;

  @Field()
  @Column({ type: 'decimal', precision: 12, scale: 2, name: 'total_amount' })
  totalAmount: number;

  @Field({ nullable: true })
  @Column({ name: 'currency', default: 'USD' })
  currency?: string;

  // Dates
  @Field({ nullable: true })
  @Column({ type: 'date', nullable: true, name: 'order_date' })
  orderDate?: Date;

  @Field({ nullable: true })
  @Column({ type: 'date', nullable: true, name: 'expected_delivery_date' })
  expectedDeliveryDate?: Date;

  @Field({ nullable: true })
  @Column({ type: 'date', nullable: true, name: 'requested_delivery_date' })
  requestedDeliveryDate?: Date;

  @Field({ nullable: true })
  @Column({ type: 'timestamp', nullable: true, name: 'sent_at' })
  sentAt?: Date;

  @Field({ nullable: true })
  @Column({ type: 'timestamp', nullable: true, name: 'acknowledged_at' })
  acknowledgedAt?: Date;

  @Field({ nullable: true })
  @Column({ type: 'timestamp', nullable: true, name: 'approved_at' })
  approvedAt?: Date;

  @Field({ nullable: true })
  @Column({ type: 'timestamp', nullable: true, name: 'received_at' })
  receivedAt?: Date;

  @Field({ nullable: true })
  @Column({ type: 'timestamp', nullable: true, name: 'cancelled_at' })
  cancelledAt?: Date;

  @Field({ nullable: true })
  @Column({ type: 'timestamp', nullable: true, name: 'rejected_at' })
  rejectedAt?: Date;

  @Field({ nullable: true })
  @Column({ type: 'text', nullable: true, name: 'approval_notes' })
  approvalNotes?: string;

  @Field({ nullable: true })
  @Column({ type: 'text', nullable: true, name: 'rejection_reason' })
  rejectionReason?: string;

  @Field({ nullable: true })
  @Column({ type: 'text', nullable: true, name: 'cancellation_reason' })
  cancellationReason?: string;

  @Field(() => Int, { nullable: true })
  @Column({ name: 'rejected_by_user_id', nullable: true })
  rejectedByUserId?: number;

  // Delivery Information
  @Field({ nullable: true })
  @Column({ name: 'delivery_address', type: 'text', nullable: true })
  deliveryAddress?: string;

  @Field({ nullable: true })
  @Column({ name: 'delivery_contact', nullable: true })
  deliveryContact?: string;

  @Field({ nullable: true })
  @Column({ name: 'delivery_phone', nullable: true })
  deliveryPhone?: string;

  @Field({ nullable: true })
  @Column({ name: 'delivery_instructions', type: 'text', nullable: true })
  deliveryInstructions?: string;

  // Tracking Information
  @Field({ nullable: true })
  @Column({ name: 'tracking_number', nullable: true })
  trackingNumber?: string;

  @Field({ nullable: true })
  @Column({ name: 'carrier', nullable: true })
  carrier?: string;

  // Terms and Conditions
  @Field(() => Int, { nullable: true })
  @Column({ name: 'payment_terms_days', nullable: true })
  paymentTermsDays?: number;

  @Field({ nullable: true })
  @Column({ name: 'payment_method', nullable: true })
  paymentMethod?: string;

  @Field({ nullable: true })
  @Column({ type: 'text', nullable: true, name: 'terms_conditions' })
  termsConditions?: string;

  // References
  @Field({ nullable: true })
  @Column({ name: 'supplier_reference', nullable: true })
  supplierReference?: string;

  @Field({ nullable: true })
  @Column({ name: 'requisition_number', nullable: true })
  requisitionNumber?: string;

  @Field({ nullable: true })
  @Column({ name: 'project_code', nullable: true })
  projectCode?: string;

  // Flags
  @Field()
  @Column({ default: false, name: 'is_auto_generated' })
  isAutoGenerated: boolean;

  @Field()
  @Column({ default: false, name: 'requires_approval' })
  requiresApproval: boolean;

  @Field()
  @Column({ default: false, name: 'is_recurring' })
  isRecurring: boolean;

  // Timestamps
  @Field()
  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP', name: 'created_at' })
  createdAt: Date;

  @Field({ nullable: true })
  @Column({ type: 'timestamp', nullable: true, name: 'updated_at' })
  updatedAt?: Date;

  // Relations
  @Field(() => Supplier)
  @ManyToOne(() => Supplier, supplier => supplier.purchaseOrders)
  @JoinColumn({ name: 'supplier_id' })
  supplier: Supplier;

  @Field(() => User)
  @ManyToOne(() => User)
  @JoinColumn({ name: 'created_by_user_id' })
  createdBy: User;

  @Field(() => User, { nullable: true })
  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'approved_by_user_id' })
  approvedBy?: User;

  @Field(() => User, { nullable: true })
  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'rejected_by_user_id' })
  rejectedBy?: User;

  @Field(() => [PurchaseOrderItem])
  @OneToMany(() => PurchaseOrderItem, item => item.purchaseOrder, { cascade: true })
  items: PurchaseOrderItem[];
}
