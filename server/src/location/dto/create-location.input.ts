import { Field, InputType } from '@nestjs/graphql';
import { IsString } from 'class-validator';

@InputType()
export class CreateLocationInput {
  @Field()
  @IsString()
  name: string;

  @Field({ nullable: true })
  @IsString()
  address?: string;
}
