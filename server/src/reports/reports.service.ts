import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Product } from '../inventory/entities/product.entity';
import { InventoryTransaction } from '../inventory/entities/inventory-transaction.entity';
import { Category } from '../inventory/entities/category.entity';
import { PriceHistory } from '../inventory/entities/price-history.entity';

export interface DateRange {
  startDate: Date;
  endDate: Date;
}

export interface InventoryTurnoverReport {
  productId: number;
  productName: string;
  category: string;
  totalSold: number;
  averageStock: number;
  turnoverRatio: number;
  daysToSell: number;
  revenue: number;
  costOfGoodsSold: number;
  grossProfit: number;
  profitMargin: number;
}

export interface StockMovementAnalytics {
  productId: number;
  productName: string;
  category: string;
  totalIn: number;
  totalOut: number;
  netMovement: number;
  movementTrend: 'increasing' | 'decreasing' | 'stable';
  velocityPerDay: number;
  averageTransactionSize: number;
}

export interface LowStockTrendAnalysis {
  productId: number;
  productName: string;
  currentStock: number;
  restockThreshold: number;
  daysUntilStockout: number;
  averageDailyUsage: number;
  stockoutRisk: 'high' | 'medium' | 'low';
  suggestedReorderQuantity: number;
  lastRestockDate: Date;
}

export interface CategoryPerformanceReport {
  categoryId: number;
  categoryName: string;
  totalProducts: number;
  totalRevenue: number;
  totalCost: number;
  grossProfit: number;
  profitMargin: number;
  averageTurnover: number;
  topPerformingProduct: string;
  slowMovingProducts: number;
  stockValue: number;
}

export interface CostAnalysisReport {
  period: string;
  totalPurchaseCost: number;
  totalSaleCost: number;
  averageCostPerUnit: number;
  costTrends: Array<{
    date: Date;
    purchaseCost: number;
    saleCost: number;
    margin: number;
  }>;
  topCostProducts: Array<{
    productName: string;
    totalCost: number;
    quantity: number;
    averageUnitCost: number;
  }>;
  costEfficiencyMetrics: {
    costPerTransaction: number;
    costPerUnit: number;
    wastePercentage: number;
  };
}

@Injectable()
export class ReportsService {
  constructor(
    @InjectRepository(Product)
    private products: Repository<Product>,
    @InjectRepository(InventoryTransaction)
    private transactions: Repository<InventoryTransaction>,
    @InjectRepository(Category)
    private categories: Repository<Category>,
    @InjectRepository(PriceHistory)
    private priceHistory: Repository<PriceHistory>,
  ) {}

  async getInventoryTurnoverReport(dateRange: DateRange): Promise<InventoryTurnoverReport[]> {
    const products = await this.products.find({ relations: ['category'] });
    const reports: InventoryTurnoverReport[] = [];

    for (const product of products) {
      const transactions = await this.transactions.find({
        where: {
          productId: product.id,
          occurredAt: dateRange ? {
            $gte: dateRange.startDate,
            $lte: dateRange.endDate
          } as any : undefined
        },
        order: { occurredAt: 'ASC' }
      });

      const sales = transactions.filter(t => t.quantity < 0);
      const totalSold = Math.abs(sales.reduce((sum, t) => sum + t.quantity, 0));
      
      const averageStock = await this.calculateAverageStock(product.id, dateRange);
      const turnoverRatio = averageStock > 0 ? totalSold / averageStock : 0;
      const daysToSell = turnoverRatio > 0 ? 365 / turnoverRatio : 0;
      
      const revenue = sales.reduce((sum, t) => sum + (Math.abs(t.quantity) * (product.salePrice || 0)), 0);
      const costOfGoodsSold = sales.reduce((sum, t) => sum + (t.totalCost || Math.abs(t.quantity) * (product.purchasePrice || 0)), 0);
      const grossProfit = revenue - costOfGoodsSold;
      const profitMargin = revenue > 0 ? (grossProfit / revenue) * 100 : 0;

      reports.push({
        productId: product.id,
        productName: product.name,
        category: product.category?.name || 'Uncategorized',
        totalSold,
        averageStock,
        turnoverRatio: Math.round(turnoverRatio * 100) / 100,
        daysToSell: Math.round(daysToSell),
        revenue: Math.round(revenue * 100) / 100,
        costOfGoodsSold: Math.round(costOfGoodsSold * 100) / 100,
        grossProfit: Math.round(grossProfit * 100) / 100,
        profitMargin: Math.round(profitMargin * 100) / 100,
      });
    }

    return reports.sort((a, b) => b.turnoverRatio - a.turnoverRatio);
  }

  async getStockMovementAnalytics(dateRange: DateRange): Promise<StockMovementAnalytics[]> {
    const products = await this.products.find({ relations: ['category'] });
    const analytics: StockMovementAnalytics[] = [];

    for (const product of products) {
      const transactions = await this.transactions.find({
        where: {
          productId: product.id,
          occurredAt: dateRange ? {
            $gte: dateRange.startDate,
            $lte: dateRange.endDate
          } as any : undefined
        },
        order: { occurredAt: 'ASC' }
      });

      const totalIn = transactions.filter(t => t.quantity > 0).reduce((sum, t) => sum + t.quantity, 0);
      const totalOut = Math.abs(transactions.filter(t => t.quantity < 0).reduce((sum, t) => sum + t.quantity, 0));
      const netMovement = totalIn - totalOut;

      const daysDiff = dateRange ? 
        Math.ceil((dateRange.endDate.getTime() - dateRange.startDate.getTime()) / (1000 * 60 * 60 * 24)) : 
        30;
      
      const velocityPerDay = totalOut / daysDiff;
      const averageTransactionSize = transactions.length > 0 ? 
        Math.abs(transactions.reduce((sum, t) => sum + Math.abs(t.quantity), 0)) / transactions.length : 0;

      // Determine trend based on recent vs older transactions
      const midpoint = Math.floor(transactions.length / 2);
      const recentMovement = transactions.slice(midpoint).reduce((sum, t) => sum + Math.abs(t.quantity), 0);
      const olderMovement = transactions.slice(0, midpoint).reduce((sum, t) => sum + Math.abs(t.quantity), 0);
      
      let movementTrend: 'increasing' | 'decreasing' | 'stable' = 'stable';
      if (recentMovement > olderMovement * 1.1) movementTrend = 'increasing';
      else if (recentMovement < olderMovement * 0.9) movementTrend = 'decreasing';

      analytics.push({
        productId: product.id,
        productName: product.name,
        category: product.category?.name || 'Uncategorized',
        totalIn,
        totalOut,
        netMovement,
        movementTrend,
        velocityPerDay: Math.round(velocityPerDay * 100) / 100,
        averageTransactionSize: Math.round(averageTransactionSize * 100) / 100,
      });
    }

    return analytics.sort((a, b) => b.velocityPerDay - a.velocityPerDay);
  }

  async getLowStockTrendAnalysis(): Promise<LowStockTrendAnalysis[]> {
    const products = await this.products.find();
    const analysis: LowStockTrendAnalysis[] = [];

    for (const product of products) {
      const currentStock = await this.getCurrentStock(product.id);
      const averageDailyUsage = await this.calculateAverageDailyUsage(product.id, 30);
      
      const daysUntilStockout = averageDailyUsage > 0 ? Math.floor(currentStock / averageDailyUsage) : 999;
      
      let stockoutRisk: 'high' | 'medium' | 'low' = 'low';
      if (daysUntilStockout <= 7) stockoutRisk = 'high';
      else if (daysUntilStockout <= 14) stockoutRisk = 'medium';

      const suggestedReorderQuantity = Math.max(
        product.restockThreshold * 2,
        averageDailyUsage * 30 // 30 days supply
      );

      const lastRestock = await this.getLastRestockDate(product.id);

      analysis.push({
        productId: product.id,
        productName: product.name,
        currentStock,
        restockThreshold: product.restockThreshold,
        daysUntilStockout,
        averageDailyUsage: Math.round(averageDailyUsage * 100) / 100,
        stockoutRisk,
        suggestedReorderQuantity: Math.round(suggestedReorderQuantity),
        lastRestockDate: lastRestock,
      });
    }

    return analysis.filter(a => a.stockoutRisk !== 'low' || a.currentStock <= a.restockThreshold)
                   .sort((a, b) => a.daysUntilStockout - b.daysUntilStockout);
  }

  async getCategoryPerformanceReport(dateRange: DateRange): Promise<CategoryPerformanceReport[]> {
    const categories = await this.categories.find({ relations: ['products'] });
    const reports: CategoryPerformanceReport[] = [];

    for (const category of categories) {
      let totalRevenue = 0;
      let totalCost = 0;
      let totalTurnover = 0;
      let stockValue = 0;
      let topPerformingProduct = '';
      let topPerformance = 0;
      let slowMovingProducts = 0;

      for (const product of category.products) {
        const transactions = await this.transactions.find({
          where: {
            productId: product.id,
            quantity: { $lt: 0 } as any, // Sales only
            occurredAt: dateRange ? {
              $gte: dateRange.startDate,
              $lte: dateRange.endDate
            } as any : undefined
          }
        });

        const productRevenue = transactions.reduce((sum, t) => 
          sum + (Math.abs(t.quantity) * (product.salePrice || 0)), 0);
        const productCost = transactions.reduce((sum, t) => 
          sum + (t.totalCost || Math.abs(t.quantity) * (product.purchasePrice || 0)), 0);
        
        totalRevenue += productRevenue;
        totalCost += productCost;

        // Calculate turnover for this product
        const averageStock = await this.calculateAverageStock(product.id, dateRange);
        const totalSold = Math.abs(transactions.reduce((sum, t) => sum + t.quantity, 0));
        const turnover = averageStock > 0 ? totalSold / averageStock : 0;
        totalTurnover += turnover;

        // Track top performing product
        if (productRevenue > topPerformance) {
          topPerformance = productRevenue;
          topPerformingProduct = product.name;
        }

        // Count slow moving products (turnover < 1)
        if (turnover < 1) slowMovingProducts++;

        // Calculate stock value
        const currentStock = await this.getCurrentStock(product.id);
        stockValue += currentStock * (product.purchasePrice || 0);
      }

      const grossProfit = totalRevenue - totalCost;
      const profitMargin = totalRevenue > 0 ? (grossProfit / totalRevenue) * 100 : 0;
      const averageTurnover = category.products.length > 0 ? totalTurnover / category.products.length : 0;

      reports.push({
        categoryId: category.id,
        categoryName: category.name,
        totalProducts: category.products.length,
        totalRevenue: Math.round(totalRevenue * 100) / 100,
        totalCost: Math.round(totalCost * 100) / 100,
        grossProfit: Math.round(grossProfit * 100) / 100,
        profitMargin: Math.round(profitMargin * 100) / 100,
        averageTurnover: Math.round(averageTurnover * 100) / 100,
        topPerformingProduct,
        slowMovingProducts,
        stockValue: Math.round(stockValue * 100) / 100,
      });
    }

    return reports.sort((a, b) => b.totalRevenue - a.totalRevenue);
  }

  async getCostAnalysisReport(dateRange: DateRange): Promise<CostAnalysisReport> {
    const transactions = await this.transactions.find({
      where: dateRange ? {
        occurredAt: {
          $gte: dateRange.startDate,
          $lte: dateRange.endDate
        } as any
      } : {},
      relations: ['product'],
      order: { occurredAt: 'ASC' }
    });

    const totalPurchaseCost = transactions
      .filter(t => t.quantity > 0)
      .reduce((sum, t) => sum + (t.totalCost || 0), 0);
    
    const totalSaleCost = transactions
      .filter(t => t.quantity < 0)
      .reduce((sum, t) => sum + (t.totalCost || 0), 0);

    const totalUnits = transactions.reduce((sum, t) => sum + Math.abs(t.quantity), 0);
    const averageCostPerUnit = totalUnits > 0 ? (totalPurchaseCost + Math.abs(totalSaleCost)) / totalUnits : 0;

    // Generate cost trends (daily aggregation)
    const costTrends = this.generateCostTrends(transactions, dateRange);

    // Top cost products
    const productCosts = new Map<string, { totalCost: number; quantity: number }>();
    transactions.forEach(t => {
      if (t.quantity > 0 && t.totalCost) { // Purchase transactions
        const existing = productCosts.get(t.product.name) || { totalCost: 0, quantity: 0 };
        productCosts.set(t.product.name, {
          totalCost: existing.totalCost + t.totalCost,
          quantity: existing.quantity + t.quantity
        });
      }
    });

    const topCostProducts = Array.from(productCosts.entries())
      .map(([name, data]) => ({
        productName: name,
        totalCost: Math.round(data.totalCost * 100) / 100,
        quantity: data.quantity,
        averageUnitCost: Math.round((data.totalCost / data.quantity) * 100) / 100
      }))
      .sort((a, b) => b.totalCost - a.totalCost)
      .slice(0, 10);

    return {
      period: this.formatDateRange(dateRange),
      totalPurchaseCost: Math.round(totalPurchaseCost * 100) / 100,
      totalSaleCost: Math.round(Math.abs(totalSaleCost) * 100) / 100,
      averageCostPerUnit: Math.round(averageCostPerUnit * 100) / 100,
      costTrends,
      topCostProducts,
      costEfficiencyMetrics: {
        costPerTransaction: transactions.length > 0 ? Math.round((totalPurchaseCost / transactions.length) * 100) / 100 : 0,
        costPerUnit: Math.round(averageCostPerUnit * 100) / 100,
        wastePercentage: 0 // Could be calculated based on expired/damaged inventory
      }
    };
  }

  // Helper methods
  private async getCurrentStock(productId: number): Promise<number> {
    const result = await this.transactions
      .createQueryBuilder('t')
      .select('SUM(t.quantity)', 'sum')
      .where('t.productId = :productId', { productId })
      .getRawOne();
    
    return parseInt(result.sum) || 0;
  }

  private async calculateAverageStock(productId: number, dateRange?: DateRange): Promise<number> {
    // Simplified: could be improved with more sophisticated averaging
    const currentStock = await this.getCurrentStock(productId);
    return Math.max(currentStock, 1); // Avoid division by zero
  }

  private async calculateAverageDailyUsage(productId: number, days: number): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    const result = await this.transactions
      .createQueryBuilder('t')
      .select('SUM(ABS(t.quantity))', 'totalUsed')
      .where('t.productId = :productId', { productId })
      .andWhere('t.quantity < 0') // Only outgoing transactions
      .andWhere('t.occurredAt >= :cutoffDate', { cutoffDate })
      .getRawOne();

    const totalUsed = parseInt(result.totalUsed) || 0;
    return totalUsed / days;
  }

  private async getLastRestockDate(productId: number): Promise<Date> {
    const lastRestock = await this.transactions.findOne({
      where: {
        productId,
        quantity: { $gt: 0 } as any // Incoming stock
      },
      order: { occurredAt: 'DESC' }
    });

    return lastRestock?.occurredAt || new Date('1970-01-01');
  }

  private generateCostTrends(transactions: InventoryTransaction[], dateRange: DateRange): Array<{
    date: Date;
    purchaseCost: number;
    saleCost: number;
    margin: number;
  }> {
    const trends: Map<string, { purchaseCost: number; saleCost: number }> = new Map();

    transactions.forEach(t => {
      const dateKey = t.occurredAt.toISOString().split('T')[0];
      const existing = trends.get(dateKey) || { purchaseCost: 0, saleCost: 0 };
      
      if (t.quantity > 0) {
        existing.purchaseCost += t.totalCost || 0;
      } else {
        existing.saleCost += Math.abs(t.totalCost || 0);
      }
      
      trends.set(dateKey, existing);
    });

    return Array.from(trends.entries()).map(([dateKey, data]) => ({
      date: new Date(dateKey),
      purchaseCost: Math.round(data.purchaseCost * 100) / 100,
      saleCost: Math.round(data.saleCost * 100) / 100,
      margin: data.saleCost > 0 ? Math.round(((data.saleCost - data.purchaseCost) / data.saleCost) * 100) : 0
    }));
  }

  private formatDateRange(dateRange: DateRange): string {
    if (!dateRange) return 'All Time';
    return `${dateRange.startDate.toISOString().split('T')[0]} to ${dateRange.endDate.toISOString().split('T')[0]}`;
  }
}
