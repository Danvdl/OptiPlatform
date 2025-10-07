import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SyncService } from './sync.service';
import { SyncResolver } from './sync.resolver';
import { InventoryTransaction } from '../inventory/entities/inventory-transaction.entity';

@Module({
  imports: [TypeOrmModule.forFeature([InventoryTransaction])],
  providers: [SyncService, SyncResolver],
})
export class SyncModule {}
// This module imports the InventoryTransaction entity and provides the SyncService and SyncResolver.