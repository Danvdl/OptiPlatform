import { Field, ObjectType, Int } from '@nestjs/graphql';
import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { Product } from './product.entity';

@ObjectType()
@Entity({ name: 'categories' })
export class Category {
  @Field(() => Int)
  @PrimaryGeneratedColumn()
  id: number;

  @Field()
  @Column({ unique: true })
  name: string;

  @Field({ nullable: true })
  @Column({ nullable: true })
  description?: string;

  @Field({ nullable: true })
  @Column({ type: 'uuid', name: 'tenant_id', nullable: true })
  tenantId?: string;

  @Field()
  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP', name: 'created_at' })
  createdAt: Date;

  @Field({ nullable: true })
  @Column({ type: 'timestamp', nullable: true, name: 'updated_at' })
  updatedAt?: Date;

  @Field(() => [Product], { nullable: true })
  @OneToMany(() => Product, product => product.category)
  products?: Product[];
}
