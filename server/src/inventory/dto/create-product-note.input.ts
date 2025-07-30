import { Field, InputType, Int } from '@nestjs/graphql';
import { IsInt, IsString, IsOptional } from 'class-validator';

@InputType()
export class CreateProductNoteInput {
  @Field(() => Int)
  @IsInt()
  productId: number;

  @Field(() => Int, { nullable: true })
  @IsInt()
  @IsOptional()
  userId?: number;

  @Field()
  @IsString()
  note: string;
}
