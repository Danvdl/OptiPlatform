import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ReportsService } from './reports.service';
import { ReportsResolver } from './reports.resolver';
import { ReportsController } from './reports.controller';
import { ExportService } from './export.service';
import { Product } from '../inventory/entities/product.entity';
import { Category } from '../inventory/entities/category.entity';
import { InventoryTransaction } from '../inventory/entities/inventory-transaction.entity';
import { PriceHistory } from '../inventory/entities/price-history.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Product, Category, InventoryTransaction, PriceHistory]),
  ],
  providers: [
    ReportsService,
    ReportsResolver,
    ExportService
  ],
  controllers: [ReportsController],
  exports: [ReportsService, ExportService],
})
export class ReportsModule {}
