import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { InventoryService } from './inventory.service';
import { Product } from './entities/product.entity';
import { Category } from './entities/category.entity';
import { ProductNote } from './entities/product-note.entity';
import { InventoryTransaction } from './entities/inventory-transaction.entity';
import { ProductResolver } from './product.resolver';
import { CategoryResolver } from './category.resolver';
import { ProductNoteResolver } from './product-note.resolver';
import { InventoryTransactionResolver } from './inventory-transaction.resolver';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Product, Category, ProductNote, InventoryTransaction]),
    NotificationsModule,
  ],
  providers: [
    InventoryService, 
    ProductResolver, 
    CategoryResolver,
    ProductNoteResolver,
    InventoryTransactionResolver
  ],
  exports: [InventoryService],
})
export class InventoryModule {}
