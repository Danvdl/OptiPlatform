import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { InventoryTransaction } from '../inventory/entities/inventory-transaction.entity';
import { SyncDocumentInput } from './sync.input';

@Injectable()
export class SyncService {
  constructor(
    @InjectRepository(InventoryTransaction)
    private transactionRepo: Repository<InventoryTransaction>,
  ) {}

  async handleSync(docs: SyncDocumentInput[]) {
    for (const doc of docs) {
      if (doc.type === 'transaction') {
        await this.transactionRepo.save({
          id: doc.id,
          ...JSON.parse(doc.data || '{}'),
          lastUpdated: new Date(doc.lastUpdated),
        });
      }
    }
    return { success: true, count: docs.length };
  }
}
// This service handles the synchronization of documents, specifically inventory transactions.