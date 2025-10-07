import { InputType, Field, ID } from '@nestjs/graphql';

@InputType()
export class SyncDocumentInput {
  @Field(() => ID)
  id: string;

  @Field()
  type: string;

  @Field({ nullable: true })
  data?: string;

  @Field({ nullable: true })
  lastUpdated?: string;
}
// This input type represents a document to be synced.