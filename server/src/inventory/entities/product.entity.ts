import { Field, ObjectType, Int } from '@nestjs/graphql';
import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Category } from './category.entity';

@ObjectType()
@Entity({ name: 'products' })
export class Product {
  @Field(() => Int)
  @PrimaryGeneratedColumn()
  id: number;

  @Field()
  @Column()
  name: string;

  @Field({ nullable: true })
  @Column({ nullable: true })
  description?: string;

  @Field({ nullable: true })
  @Column({ nullable: true })
  unit?: string;

  @Field({ nullable: true })
  @Column({ unique: true, nullable: true })
  sku?: string;

  @Field(() => Int, { nullable: true })
  @Column({ nullable: true })
  categoryId?: number;

  @Field(() => Int)
  @Column({ default: 5 })
  restockThreshold: number;

  @Field()
  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;

  @Field(() => Category, { nullable: true })
  @ManyToOne(() => Category, category => category.products)
  @JoinColumn({ name: 'category_id' })
  category?: Category;
}
