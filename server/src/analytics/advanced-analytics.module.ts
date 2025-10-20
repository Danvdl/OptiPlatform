import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Product } from '../inventory/entities/product.entity';
import { InventoryTransaction } from '../inventory/entities/inventory-transaction.entity';
import { AdvancedAnalyticsService } from './advanced-analytics.service';
import { AdvancedAnalyticsResolver } from './advanced-analytics.resolver';
import { AnomalyDetectionService } from './anomaly-detection.service';
import { AnomalyDetectionResolver } from './anomaly-detection.resolver';

@Module({
  imports: [
    TypeOrmModule.forFeature([Product, InventoryTransaction]),
  ],
  providers: [
    AdvancedAnalyticsService, 
    AdvancedAnalyticsResolver,
    AnomalyDetectionService,
    AnomalyDetectionResolver,
  ],
  exports: [AdvancedAnalyticsService, AnomalyDetectionService],
})
export class AdvancedAnalyticsModule {}
