import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { InventoryService } from './inventory.service';
import { Product } from './entities/product.entity';
import { InventoryTransaction } from './entities/inventory-transaction.entity';
import { ProductResolver } from './product.resolver';
import { InventoryTransactionResolver } from './inventory-transaction.resolver';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Product, InventoryTransaction]),
    NotificationsModule,
  ],
  providers: [InventoryService, ProductResolver, InventoryTransactionResolver],
})
export class InventoryModule {}
