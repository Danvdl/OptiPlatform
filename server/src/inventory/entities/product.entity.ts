import { Field, ObjectType, Int } from '@nestjs/graphql';
import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

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
}
