import { Field, ObjectType, Int } from '@nestjs/graphql';
import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Product } from './product.entity';
import { User } from '../../user/user.entity';

@ObjectType()
@Entity({ name: 'price_history' })
export class PriceHistory {
  @Field(() => Int)
  @PrimaryGeneratedColumn()
  id: number;

  @Field(() => Int)
  @Column({ name: 'product_id' })
  productId: number;

  @Field(() => Int)
  @Column({ name: 'user_id' })
  userId: number;

  @Field()
  @Column({ name: 'price_type' }) // 'purchase' or 'sale'
  priceType: string;

  @Field()
  @Column({ type: 'decimal', precision: 10, scale: 2, name: 'old_price' })
  oldPrice: number;

  @Field()
  @Column({ type: 'decimal', precision: 10, scale: 2, name: 'new_price' })
  newPrice: number;

  @Field({ nullable: true })
  @Column({ nullable: true })
  currency?: string;

  @Field({ nullable: true })
  @Column({ type: 'text', nullable: true })
  reason?: string;

  @Field({ nullable: true })
  @Column({ type: 'uuid', name: 'tenant_id', nullable: true })
  tenantId?: string;

  @Field()
  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP', name: 'changed_at' })
  changedAt: Date;

  @Field(() => Product)
  @ManyToOne(() => Product)
  @JoinColumn({ name: 'product_id' })
  product: Product;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user: User;
}
