import { Field, InputType } from '@nestjs/graphql';

@InputType()
export class CreateLocationInput {
  @Field()
  name: string;

  @Field({ nullable: true })
  address?: string;
}
