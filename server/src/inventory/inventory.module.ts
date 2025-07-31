import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { InventoryService } from './inventory.service';
import { Product } from './entities/product.entity';
import { Category } from './entities/category.entity';
import { ProductNote } from './entities/product-note.entity';
import { InventoryTransaction } from './entities/inventory-transaction.entity';
import { PriceHistory } from './entities/price-history.entity';
import { ProductResolver } from './product.resolver';
import { CategoryResolver } from './category.resolver';
import { ProductNoteResolver } from './product-note.resolver';
import { InventoryTransactionResolver } from './inventory-transaction.resolver';
import { PriceHistoryResolver } from './price-history.resolver';
import { PriceHistoryService } from './price-history.service';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Product, Category, ProductNote, InventoryTransaction, PriceHistory]),
    NotificationsModule,
  ],
  providers: [
    InventoryService, 
    PriceHistoryService,
    ProductResolver, 
    CategoryResolver,
    ProductNoteResolver,
    InventoryTransactionResolver,
    PriceHistoryResolver
  ],
  exports: [InventoryService, PriceHistoryService],
})
export class InventoryModule {}
