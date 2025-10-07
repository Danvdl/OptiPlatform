import { Resolver, Mutation, Args } from '@nestjs/graphql';
import { SyncService } from './sync.service';
import { SyncDocumentInput } from './sync.input';

@Resolver()
export class SyncResolver {
  constructor(private readonly syncService: SyncService) {}

  @Mutation(() => Boolean)
  async syncDocuments(
    @Args({ name: 'docs', type: () => [SyncDocumentInput] }) docs: SyncDocumentInput[],
  ) {
    const result = await this.syncService.handleSync(docs);
    return !!result.success;
  }
}
// This resolver handles the sync operation for documents.