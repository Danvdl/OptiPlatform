import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { InventoryTransaction } from '../inventory/entities/inventory-transaction.entity';
import { Product } from '../inventory/entities/product.entity';

interface AnomalyAlert {
  productId: number;
  productName: string;
  date: Date;
  expectedValue: number;
  actualValue: number;
  deviation: number;
  zScore: number;
  severity: 'low' | 'moderate' | 'high' | 'critical';
  type: 'spike' | 'drop' | 'unusual_pattern';
  recommendation: string;
}

@Injectable()
export class AnomalyDetectionService {
  constructor(
    @InjectRepository(InventoryTransaction)
    private transactionRepo: Repository<InventoryTransaction>,
    @InjectRepository(Product)
    private productRepo: Repository<Product>,
  ) {}

  /**
   * Detect anomalies in inventory transactions
   */
  async detectInventoryAnomalies(
    startDate: Date,
    endDate: Date,
    threshold: number = 2.5,
  ): Promise<AnomalyAlert[]> {
    const products = await this.productRepo.find();
    const anomalies: AnomalyAlert[] = [];

    for (const product of products) {
      const productAnomalies = await this.detectProductAnomalies(
        product.id,
        startDate,
        endDate,
        threshold,
      );
      anomalies.push(...productAnomalies);
    }

    return anomalies.sort((a, b) => Math.abs(b.zScore) - Math.abs(a.zScore));
  }

  /**
   * Detect anomalies for a specific product
   */
  async detectProductAnomalies(
    productId: number,
    startDate: Date,
    endDate: Date,
    threshold: number = 2.5,
  ): Promise<AnomalyAlert[]> {
    const product = await this.productRepo.findOne({ where: { id: productId } });
    if (!product) return [];

    // Get transaction history
    const transactions = await this.transactionRepo
      .createQueryBuilder('txn')
      .where('txn.productId = :productId', { productId })
      .andWhere('txn.occurredAt >= :startDate', { startDate })
      .andWhere('txn.occurredAt <= :endDate', { endDate })
      .orderBy('txn.occurredAt', 'ASC')
      .getMany();

    if (transactions.length < 7) return []; // Need at least a week of data

    // Group by day and calculate daily totals
    const dailyData = this.groupByDay(transactions);
    const values = dailyData.map(d => d.value);

    // Calculate statistics
    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
    const stdDev = Math.sqrt(variance);

    if (stdDev === 0) return []; // No variation

    // Detect anomalies using Z-score
    const anomalies: AnomalyAlert[] = [];

    dailyData.forEach((day, index) => {
      const zScore = (day.value - mean) / stdDev;

      if (Math.abs(zScore) > threshold) {
        const severity = this.getSeverity(Math.abs(zScore));
        const type = this.getAnomalyType(zScore, values, index);
        const recommendation = this.getRecommendation(type, zScore, product);

        anomalies.push({
          productId: product.id,
          productName: product.name,
          date: day.date,
          expectedValue: mean,
          actualValue: day.value,
          deviation: ((day.value - mean) / mean) * 100,
          zScore,
          severity,
          type,
          recommendation,
        });
      }
    });

    return anomalies;
  }

  /**
   * Detect sudden changes in product velocity
   */
  async detectVelocityChanges(productId: number): Promise<{
    currentVelocity: number;
    historicalVelocity: number;
    changePercent: number;
    isSignificant: boolean;
    trend: 'accelerating' | 'decelerating' | 'stable';
  }> {
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const sixtyDaysAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);

    // Recent velocity (last 30 days)
    const recentTxns = await this.transactionRepo
      .createQueryBuilder('txn')
      .where('txn.productId = :productId', { productId })
      .andWhere('txn.occurredAt >= :startDate', { startDate: thirtyDaysAgo })
      .andWhere("txn.transactionType = 'sale'")
      .getMany();

    // Historical velocity (30-60 days ago)
    const historicalTxns = await this.transactionRepo
      .createQueryBuilder('txn')
      .where('txn.productId = :productId', { productId })
      .andWhere('txn.occurredAt >= :startDate', { startDate: sixtyDaysAgo })
      .andWhere('txn.occurredAt < :endDate', { endDate: thirtyDaysAgo })
      .andWhere("txn.transactionType = 'sale'")
      .getMany();

    const currentVelocity = recentTxns.reduce((sum, txn) => sum + txn.quantity, 0) / 30;
    const historicalVelocity = historicalTxns.reduce((sum, txn) => sum + txn.quantity, 0) / 30;

    if (historicalVelocity === 0) {
      return {
        currentVelocity,
        historicalVelocity: 0,
        changePercent: 0,
        isSignificant: false,
        trend: 'stable',
      };
    }

    const changePercent = ((currentVelocity - historicalVelocity) / historicalVelocity) * 100;
    const isSignificant = Math.abs(changePercent) > 25; // 25% change is significant

    let trend: 'accelerating' | 'decelerating' | 'stable';
    if (changePercent > 15) trend = 'accelerating';
    else if (changePercent < -15) trend = 'decelerating';
    else trend = 'stable';

    return {
      currentVelocity,
      historicalVelocity,
      changePercent,
      isSignificant,
      trend,
    };
  }

  /**
   * Detect products with unusual patterns (not selling at expected times)
   */
  async detectSeasonalAnomalies(): Promise<Array<{
    productId: number;
    productName: string;
    expectedSeasonalIndex: number;
    actualSeasonalIndex: number;
    message: string;
  }>> {
    // This would analyze day-of-week, month, or seasonal patterns
    // Placeholder for more advanced implementation
    return [];
  }

  // Helper methods

  private groupByDay(transactions: InventoryTransaction[]): Array<{ date: Date; value: number }> {
    const dailyMap = new Map<string, number>();

    transactions.forEach(txn => {
      const dateKey = txn.occurredAt.toISOString().split('T')[0];
      const value = txn.transactionType === 'sale' ? txn.quantity : 0;
      dailyMap.set(dateKey, (dailyMap.get(dateKey) || 0) + value);
    });

    return Array.from(dailyMap.entries())
      .map(([dateStr, value]) => ({
        date: new Date(dateStr),
        value,
      }))
      .sort((a, b) => a.date.getTime() - b.date.getTime());
  }

  private getSeverity(zScore: number): 'low' | 'moderate' | 'high' | 'critical' {
    if (zScore > 4) return 'critical';
    if (zScore > 3) return 'high';
    if (zScore > 2) return 'moderate';
    return 'low';
  }

  private getAnomalyType(
    zScore: number,
    values: number[],
    index: number,
  ): 'spike' | 'drop' | 'unusual_pattern' {
    if (zScore > 0) return 'spike';
    if (zScore < 0) return 'drop';
    return 'unusual_pattern';
  }

  private getRecommendation(
    type: 'spike' | 'drop' | 'unusual_pattern',
    zScore: number,
    product: Product,
  ): string {
    if (type === 'spike') {
      if (zScore > 3) {
        return `Investigate unusual sales spike for ${product.name}. Consider increasing stock levels or checking for data entry errors.`;
      }
      return `Higher than normal demand for ${product.name}. Monitor stock levels closely.`;
    } else if (type === 'drop') {
      if (zScore < -3) {
        return `Significant drop in sales for ${product.name}. Review pricing, competition, or seasonal factors. Consider promotional activities.`;
      }
      return `Lower than expected sales for ${product.name}. Monitor trend and adjust inventory accordingly.`;
    }
    return `Unusual pattern detected for ${product.name}. Review recent transactions for accuracy.`;
  }
}
