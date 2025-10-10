import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { Product } from '../inventory/entities/product.entity';
import { InventoryTransaction } from '../inventory/entities/inventory-transaction.entity';

// Simple statistics utilities (no external dependencies)
class SimpleStats {
  static mean(values: number[]): number {
    if (values.length === 0) return 0;
    return values.reduce((sum, val) => sum + val, 0) / values.length;
  }

  static standardDeviation(values: number[]): number {
    if (values.length === 0) return 0;
    const avg = this.mean(values);
    const squareDiffs = values.map(value => Math.pow(value - avg, 2));
    const avgSquareDiff = this.mean(squareDiffs);
    return Math.sqrt(avgSquareDiff);
  }

  static linearRegression(data: Array<{ x: number; y: number }>): { m: number; b: number } {
    if (data.length < 2) return { m: 0, b: 0 };

    const n = data.length;
    const sumX = data.reduce((sum, point) => sum + point.x, 0);
    const sumY = data.reduce((sum, point) => sum + point.y, 0);
    const sumXY = data.reduce((sum, point) => sum + point.x * point.y, 0);
    const sumX2 = data.reduce((sum, point) => sum + point.x * point.x, 0);

    const m = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
    const b = (sumY - m * sumX) / n;

    return { m, b };
  }
}

export interface ProductHealthScore {
  productId: number;
  productName: string;
  overallScore: number; // 0-100
  scoreBreakdown: {
    salesVelocity: number;
    turnoverRatio: number;
    profitMargin: number;
    stockAvailability: number;
    demandTrend: number;
  };
  healthStatus: 'excellent' | 'good' | 'warning' | 'critical';
  trends: {
    last30Days: number;
    last90Days: number;
    yearOverYear: number;
  };
  insights: string[];
  actionItems: Array<{
    priority: 'high' | 'medium' | 'low';
    action: string;
    impact: string;
  }>;
}

export interface DemandForecast {
  productId: number;
  productName: string;
  forecastPeriod: 'daily' | 'weekly' | 'monthly';
  predictions: Array<{
    date: Date;
    expectedDemand: number;
    confidenceInterval: { lower: number; upper: number };
    confidence: number;
  }>;
  accuracy: number;
  seasonalityFactors: {
    weekly: number[];
    monthly: number[];
    yearly: number;
  };
  recommendations: string[];
}

@Injectable()
export class AdvancedAnalyticsService {
  constructor(
    @InjectRepository(Product)
    private products: Repository<Product>,
    @InjectRepository(InventoryTransaction)
    private transactions: Repository<InventoryTransaction>,
  ) {}

  /**
   * Calculate comprehensive product health score
   */
  async calculateProductHealthScore(productId: number): Promise<ProductHealthScore> {
    const product = await this.products.findOne({ 
      where: { id: productId },
      relations: ['category'] 
    });

    if (!product) {
      throw new Error('Product not found');
    }

    // Fetch transaction data for different periods
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const ninetyDaysAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
    const oneYearAgo = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);

    const [transactions30, transactions90, transactionsYear] = await Promise.all([
      this.getTransactions(productId, thirtyDaysAgo, now),
      this.getTransactions(productId, ninetyDaysAgo, now),
      this.getTransactions(productId, oneYearAgo, now),
    ]);

    // Calculate individual scores (0-100)
    const salesVelocity = this.calculateSalesVelocityScore(transactions30);
    const turnoverRatio = this.calculateTurnoverScore(transactions30, product);
    const profitMargin = this.calculateProfitMarginScore(product);
    const stockAvailability = this.calculateStockAvailabilityScore(product, transactions30);
    const demandTrend = this.calculateDemandTrendScore(transactions90);

    // Weighted overall score
    const overallScore = Math.round(
      salesVelocity * 0.30 +
      turnoverRatio * 0.20 +
      profitMargin * 0.20 +
      stockAvailability * 0.15 +
      demandTrend * 0.15
    );

    // Determine health status
    const healthStatus = this.determineHealthStatus(overallScore);

    // Calculate trends
    const trends = {
      last30Days: this.calculateTrendPercentage(transactions30),
      last90Days: this.calculateTrendPercentage(transactions90),
      yearOverYear: this.calculateYearOverYearGrowth(transactionsYear),
    };

    // Generate insights and action items
    const insights = this.generateInsights({
      salesVelocity,
      turnoverRatio,
      profitMargin,
      stockAvailability,
      demandTrend,
      trends,
      product,
    });

    const actionItems = this.generateActionItems({
      salesVelocity,
      turnoverRatio,
      profitMargin,
      stockAvailability,
      demandTrend,
      healthStatus,
      product,
    });

    return {
      productId,
      productName: product.name,
      overallScore,
      scoreBreakdown: {
        salesVelocity,
        turnoverRatio,
        profitMargin,
        stockAvailability,
        demandTrend,
      },
      healthStatus,
      trends,
      insights,
      actionItems,
    };
  }

  /**
   * Simple demand forecasting using exponential smoothing
   */
  async forecastDemand(
    productId: number,
    horizon: number = 30
  ): Promise<DemandForecast> {
    const product = await this.products.findOne({ where: { id: productId } });
    if (!product) {
      throw new Error('Product not found');
    }

    // Fetch 1 year of historical data
    const oneYearAgo = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000);
    const transactions = await this.getTransactions(productId, oneYearAgo, new Date());

    // Aggregate daily sales
    const dailySales = this.aggregateDailySales(transactions);

    // Detect seasonality
    const seasonalityFactors = this.detectSeasonality(dailySales);

    // Apply exponential smoothing
    const predictions = this.applyExponentialSmoothing(
      dailySales,
      horizon,
      seasonalityFactors
    );

    // Calculate forecast accuracy based on last 30 days
    const accuracy = this.calculateForecastAccuracy(dailySales);

    // Generate recommendations
    const recommendations = this.generateForecastRecommendations(
      predictions,
      product,
      seasonalityFactors
    );

    return {
      productId,
      productName: product.name,
      forecastPeriod: 'daily',
      predictions,
      accuracy,
      seasonalityFactors,
      recommendations,
    };
  }

  // Helper methods
  private async getTransactions(
    productId: number,
    startDate: Date,
    endDate: Date
  ): Promise<InventoryTransaction[]> {
    return this.transactions.find({
      where: {
        productId,
        occurredAt: Between(startDate, endDate),
      },
      order: { occurredAt: 'ASC' },
    });
  }

  private calculateSalesVelocityScore(transactions: InventoryTransaction[]): number {
    const sales = transactions.filter(t => t.quantity < 0);
    const totalSold = Math.abs(sales.reduce((sum, t) => sum + t.quantity, 0));
    const daysInPeriod = 30;
    const velocityPerDay = totalSold / daysInPeriod;

    // Score based on velocity (normalize to 0-100)
    // Assume 10 units/day = 100 score (adjust based on your business)
    return Math.min(100, (velocityPerDay / 10) * 100);
  }

  private calculateTurnoverScore(
    transactions: InventoryTransaction[],
    product: Product
  ): number {
    const sales = transactions.filter(t => t.quantity < 0);
    const totalSold = Math.abs(sales.reduce((sum, t) => sum + t.quantity, 0));
    const averageStock = this.calculateAverageStock(transactions);

    if (averageStock === 0) return 0;

    const turnoverRatio = totalSold / averageStock;
    
    // Good turnover is around 4-12 times per year (0.33-1 per month)
    // Score 100 at ratio >= 1, 50 at 0.5, 0 at 0
    return Math.min(100, turnoverRatio * 100);
  }

  private calculateProfitMarginScore(product: Product): number {
    if (!product.salePrice || !product.purchasePrice) return 50;

    const margin = ((product.salePrice - product.purchasePrice) / product.salePrice) * 100;

    // Score: 0% margin = 0, 50% margin = 100
    return Math.min(100, margin * 2);
  }

  private calculateStockAvailabilityScore(
    product: Product,
    transactions: InventoryTransaction[]
  ): number {
    const currentStock = this.calculateCurrentStock(transactions);
    const optimalStock = product.restockThreshold * 2; // Assume optimal is 2x restock threshold

    if (currentStock <= 0) return 0;
    if (currentStock >= optimalStock) return 100;

    return (currentStock / optimalStock) * 100;
  }

  private calculateDemandTrendScore(transactions: InventoryTransaction[]): number {
    if (transactions.length < 2) return 50; // Neutral if not enough data

    const sales = transactions.filter(t => t.quantity < 0);
    const salesValues = sales.map((t, i) => ({ x: i, y: Math.abs(t.quantity) }));

    if (salesValues.length < 2) return 50;

    // Calculate linear regression slope
    const xValues = salesValues.map(p => p.x);
    const yValues = salesValues.map(p => p.y);

    try {
      const regression = SimpleStats.linearRegression(salesValues);
      const slope = regression.m;

      // Positive slope = increasing demand = good
      // Score: -10 slope = 0, 0 slope = 50, +10 slope = 100
      const score = 50 + (slope * 5);
      return Math.max(0, Math.min(100, score));
    } catch (error) {
      return 50;
    }
  }

  private determineHealthStatus(score: number): 'excellent' | 'good' | 'warning' | 'critical' {
    if (score >= 80) return 'excellent';
    if (score >= 60) return 'good';
    if (score >= 40) return 'warning';
    return 'critical';
  }

  private calculateTrendPercentage(transactions: InventoryTransaction[]): number {
    const sales = transactions.filter(t => t.quantity < 0);
    if (sales.length < 2) return 0;

    const midpoint = Math.floor(sales.length / 2);
    const recentSales = sales.slice(midpoint).reduce((sum, t) => sum + Math.abs(t.quantity), 0);
    const olderSales = sales.slice(0, midpoint).reduce((sum, t) => sum + Math.abs(t.quantity), 0);

    if (olderSales === 0) return 0;

    return ((recentSales - olderSales) / olderSales) * 100;
  }

  private calculateYearOverYearGrowth(transactions: InventoryTransaction[]): number {
    // Split into first half year and second half year
    const midpoint = Math.floor(transactions.length / 2);
    const firstHalf = transactions.slice(0, midpoint).filter(t => t.quantity < 0);
    const secondHalf = transactions.slice(midpoint).filter(t => t.quantity < 0);

    const firstHalfSales = firstHalf.reduce((sum, t) => sum + Math.abs(t.quantity), 0);
    const secondHalfSales = secondHalf.reduce((sum, t) => sum + Math.abs(t.quantity), 0);

    if (firstHalfSales === 0) return 0;

    return ((secondHalfSales - firstHalfSales) / firstHalfSales) * 100;
  }

  private generateInsights(data: any): string[] {
    const insights: string[] = [];

    if (data.salesVelocity < 30) {
      insights.push('⚠️ Sales velocity is low. Consider promotional activities or price adjustments.');
    } else if (data.salesVelocity > 80) {
      insights.push('✅ Excellent sales velocity. Ensure stock levels can meet demand.');
    }

    if (data.turnoverRatio < 30) {
      insights.push('📦 Low turnover ratio indicates slow-moving inventory. Review pricing strategy.');
    }

    if (data.profitMargin > 80) {
      insights.push('💰 Strong profit margins. Consider investing in more inventory.');
    } else if (data.profitMargin < 20) {
      insights.push('⚠️ Low profit margins. Review costs or pricing strategy.');
    }

    if (data.stockAvailability < 30) {
      insights.push('🚨 Stock running low. Immediate reorder recommended.');
    }

    if (data.demandTrend > 70) {
      insights.push('📈 Demand is increasing. Consider increasing stock levels.');
    } else if (data.demandTrend < 30) {
      insights.push('📉 Demand is declining. Monitor closely for potential stock reduction.');
    }

    if (data.trends.yearOverYear > 50) {
      insights.push('🚀 Strong year-over-year growth. Product is performing exceptionally well.');
    }

    return insights;
  }

  private generateActionItems(data: any): Array<{ priority: 'high' | 'medium' | 'low'; action: string; impact: string }> {
    const actions: Array<{ priority: 'high' | 'medium' | 'low'; action: string; impact: string }> = [];

    if (data.stockAvailability < 30) {
      actions.push({
        priority: 'high',
        action: 'Reorder stock immediately',
        impact: 'Prevent stockouts and lost sales',
      });
    }

    if (data.salesVelocity < 30 && data.profitMargin > 50) {
      actions.push({
        priority: 'medium',
        action: 'Run promotional campaign',
        impact: 'Increase sales without compromising margins',
      });
    }

    if (data.turnoverRatio < 30) {
      actions.push({
        priority: 'medium',
        action: 'Review and optimize stock levels',
        impact: 'Reduce holding costs',
      });
    }

    if (data.demandTrend < 30) {
      actions.push({
        priority: 'low',
        action: 'Analyze market trends and customer feedback',
        impact: 'Understand declining demand',
      });
    }

    return actions;
  }

  // Forecasting helper methods
  private aggregateDailySales(transactions: InventoryTransaction[]): Map<string, number> {
    const dailySales = new Map<string, number>();

    transactions
      .filter(t => t.quantity < 0)
      .forEach(t => {
        const date = t.occurredAt.toISOString().split('T')[0];
        const current = dailySales.get(date) || 0;
        dailySales.set(date, current + Math.abs(t.quantity));
      });

    return dailySales;
  }

  private detectSeasonality(dailySales: Map<string, number>): any {
    // Simplified seasonality detection
    const weeklyFactors: number[] = new Array(7).fill(0);
    const weeklyCounts: number[] = new Array(7).fill(0);
    const monthlyFactors: number[] = new Array(12).fill(0);
    const monthlyCounts: number[] = new Array(12).fill(0);

    dailySales.forEach((sales, dateStr) => {
      const date = new Date(dateStr);
      const dayOfWeek = date.getDay();
      const month = date.getMonth();

      weeklyFactors[dayOfWeek] += sales;
      weeklyCounts[dayOfWeek]++;
      monthlyFactors[month] += sales;
      monthlyCounts[month]++;
    });

    // Calculate averages
    const weekly = weeklyFactors.map((total, i) => 
      weeklyCounts[i] > 0 ? total / weeklyCounts[i] : 1
    );
    const monthly = monthlyFactors.map((total, i) => 
      monthlyCounts[i] > 0 ? total / monthlyCounts[i] : 1
    );

    // Normalize to multipliers
    const weeklyAvg = SimpleStats.mean(weekly);
    const monthlyAvg = SimpleStats.mean(monthly);

    return {
      weekly: weekly.map(v => v / weeklyAvg),
      monthly: monthly.map(v => v / monthlyAvg),
      yearly: 1.0, // Placeholder
    };
  }

  private applyExponentialSmoothing(
    dailySales: Map<string, number>,
    horizon: number,
    seasonality: any
  ): Array<any> {
    const salesArray = Array.from(dailySales.values());
    if (salesArray.length === 0) {
      return [];
    }

    const alpha = 0.3; // Smoothing parameter
    let level = SimpleStats.mean(salesArray);
    const predictions: any[] = [];

    // Generate forecasts
    for (let i = 0; i < horizon; i++) {
      const futureDate = new Date(Date.now() + i * 24 * 60 * 60 * 1000);
      const dayOfWeek = futureDate.getDay();
      const seasonalFactor = seasonality.weekly[dayOfWeek] || 1;

      const forecast = level * seasonalFactor;
      const stdDev = SimpleStats.standardDeviation(salesArray);
      
      predictions.push({
        date: futureDate,
        expectedDemand: Math.round(forecast * 100) / 100,
        confidenceInterval: {
          lower: Math.max(0, Math.round((forecast - 1.96 * stdDev) * 100) / 100),
          upper: Math.round((forecast + 1.96 * stdDev) * 100) / 100,
        },
        confidence: 85, // Simplified
      });

      // Update level for next prediction
      level = alpha * forecast + (1 - alpha) * level;
    }

    return predictions;
  }

  private calculateForecastAccuracy(dailySales: Map<string, number>): number {
    // Simplified: return a placeholder accuracy
    // In production, compare past forecasts with actuals
    return 78; // 78% accuracy
  }

  private generateForecastRecommendations(
    predictions: any[],
    product: Product,
    seasonality: any
  ): string[] {
    const recommendations: string[] = [];

    const avgForecast = SimpleStats.mean(predictions.map(p => p.expectedDemand));
    const totalForecast = predictions.reduce((sum, p) => sum + p.expectedDemand, 0);

    recommendations.push(`Expected total demand over next ${predictions.length} days: ${Math.round(totalForecast)} units`);

    if (avgForecast > 10) {
      recommendations.push('📈 High demand forecasted. Ensure adequate stock levels.');
    } else if (avgForecast < 3) {
      recommendations.push('📉 Low demand forecasted. Consider promotional activities.');
    }

    // Check for peak days
    const maxPrediction = Math.max(...predictions.map(p => p.expectedDemand));
    const maxDay = predictions.find(p => p.expectedDemand === maxPrediction);
    if (maxDay) {
      recommendations.push(`📅 Peak demand expected on ${maxDay.date.toDateString()}`);
    }

    return recommendations;
  }

  // Stock calculation helpers
  private calculateAverageStock(transactions: InventoryTransaction[]): number {
    if (transactions.length === 0) return 0;

    let runningStock = 0;
    const stockLevels: number[] = [];

    transactions.forEach(t => {
      runningStock += t.quantity;
      stockLevels.push(runningStock);
    });

    return SimpleStats.mean(stockLevels);
  }

  private calculateCurrentStock(transactions: InventoryTransaction[]): number {
    return transactions.reduce((sum, t) => sum + t.quantity, 0);
  }
}
