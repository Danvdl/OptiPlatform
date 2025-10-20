import { Resolver, Query, Args } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AnomalyDetectionService } from './anomaly-detection.service';

@Resolver()
@UseGuards(JwtAuthGuard)
export class AnomalyDetectionResolver {
  constructor(
    private readonly anomalyService: AnomalyDetectionService,
  ) {}

  @Query(() => String, { description: 'Detect inventory anomalies across all products' })
  async detectInventoryAnomalies(
    @Args('startDate', { nullable: true }) startDate?: string,
    @Args('endDate', { nullable: true }) endDate?: string,
    @Args('threshold', { nullable: true }) threshold?: number,
  ) {
    const start = startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const end = endDate ? new Date(endDate) : new Date();
    const zThreshold = threshold || 2.5;

    const anomalies = await this.anomalyService.detectInventoryAnomalies(start, end, zThreshold);
    return JSON.stringify(anomalies);
  }

  @Query(() => String, { description: 'Detect anomalies for a specific product' })
  async detectProductAnomalies(
    @Args('productId') productId: number,
    @Args('startDate', { nullable: true }) startDate?: string,
    @Args('endDate', { nullable: true }) endDate?: string,
    @Args('threshold', { nullable: true }) threshold?: number,
  ) {
    const start = startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const end = endDate ? new Date(endDate) : new Date();
    const zThreshold = threshold || 2.5;

    const anomalies = await this.anomalyService.detectProductAnomalies(productId, start, end, zThreshold);
    return JSON.stringify(anomalies);
  }

  @Query(() => String, { description: 'Detect velocity changes for a product' })
  async detectVelocityChanges(
    @Args('productId') productId: number,
  ) {
    const result = await this.anomalyService.detectVelocityChanges(productId);
    return JSON.stringify(result);
  }
}
