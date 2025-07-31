import { Field, ObjectType, Int } from '@nestjs/graphql';
import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Product } from './product.entity';
import { User } from '../../user/user.entity';

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

  @Field()
  @Column({ name: 'transaction_type' })
  transactionType: string;

  @Field({ nullable: true })
  @Column({ type: 'text', nullable: true })
  notes?: string;

  @Field()
  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP', name: 'occurred_at' })
  occurredAt: Date;

  @ManyToOne(() => Product)
  @JoinColumn({ name: 'product_id' })
  product: Product;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user: User;
}
