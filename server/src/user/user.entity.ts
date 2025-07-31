import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';
import { Field, ObjectType, Int } from '@nestjs/graphql';

@ObjectType()
@Entity({ name: 'users' })
export class User {
  @Field(() => Int)
  @PrimaryGeneratedColumn()
  id: number;

  @Field()
  @Column()
  username: string;

  @Column() // Don't expose password in GraphQL
  password: string;
}
