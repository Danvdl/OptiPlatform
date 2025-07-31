import { Resolver, Query, Args } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ReportsService } from './reports.service';

@Resolver()
export class ReportsResolver {
  constructor(private readonly reportsService: ReportsService) {}

  @Query(() => String)
  @UseGuards(JwtAuthGuard)
  async inventoryTurnoverReport(
    @Args('startDate', { nullable: true }) startDate?: string,
    @Args('endDate', { nullable: true }) endDate?: string,
  ): Promise<string> {
    const dateRange = startDate && endDate ? {
      startDate: new Date(startDate),
      endDate: new Date(endDate)
    } : null;

    const report = await this.reportsService.getInventoryTurnoverReport(dateRange);
    return JSON.stringify(report);
  }

  @Query(() => String)
  @UseGuards(JwtAuthGuard)
  async stockMovementAnalytics(
    @Args('startDate', { nullable: true }) startDate?: string,
    @Args('endDate', { nullable: true }) endDate?: string,
  ): Promise<string> {
    const dateRange = startDate && endDate ? {
      startDate: new Date(startDate),
      endDate: new Date(endDate)
    } : null;

    const analytics = await this.reportsService.getStockMovementAnalytics(dateRange);
    return JSON.stringify(analytics);
  }

  @Query(() => String)
  @UseGuards(JwtAuthGuard)
  async lowStockTrendAnalysis(): Promise<string> {
    const analysis = await this.reportsService.getLowStockTrendAnalysis();
    return JSON.stringify(analysis);
  }

  @Query(() => String)
  @UseGuards(JwtAuthGuard)
  async categoryPerformanceReport(
    @Args('startDate', { nullable: true }) startDate?: string,
    @Args('endDate', { nullable: true }) endDate?: string,
  ): Promise<string> {
    const dateRange = startDate && endDate ? {
      startDate: new Date(startDate),
      endDate: new Date(endDate)
    } : null;

    const report = await this.reportsService.getCategoryPerformanceReport(dateRange);
    return JSON.stringify(report);
  }

  @Query(() => String)
  @UseGuards(JwtAuthGuard)
  async costAnalysisReport(
    @Args('startDate', { nullable: true }) startDate?: string,
    @Args('endDate', { nullable: true }) endDate?: string,
  ): Promise<string> {
    const dateRange = startDate && endDate ? {
      startDate: new Date(startDate),
      endDate: new Date(endDate)
    } : null;

    const report = await this.reportsService.getCostAnalysisReport(dateRange);
    return JSON.stringify(report);
  }

  @Query(() => String)
  @UseGuards(JwtAuthGuard)
  async dashboardMetrics(
    @Args('period', { defaultValue: 30 }) period: number,
  ): Promise<string> {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - period);

    const dateRange = { startDate, endDate };

    const [
      turnoverReport,
      stockAnalytics,
      lowStockAnalysis,
      categoryReport,
      costAnalysis
    ] = await Promise.all([
      this.reportsService.getInventoryTurnoverReport(dateRange),
      this.reportsService.getStockMovementAnalytics(dateRange),
      this.reportsService.getLowStockTrendAnalysis(),
      this.reportsService.getCategoryPerformanceReport(dateRange),
      this.reportsService.getCostAnalysisReport(dateRange)
    ]);

    const metrics = {
      summary: {
        totalRevenue: turnoverReport.reduce((sum, r) => sum + r.revenue, 0),
        totalCost: costAnalysis.totalPurchaseCost,
        grossProfit: turnoverReport.reduce((sum, r) => sum + r.grossProfit, 0),
        averageTurnover: turnoverReport.length > 0 ? 
          turnoverReport.reduce((sum, r) => sum + r.turnoverRatio, 0) / turnoverReport.length : 0,
        lowStockItems: lowStockAnalysis.length,
        highRiskStockouts: lowStockAnalysis.filter(item => item.stockoutRisk === 'high').length,
        topCategory: categoryReport.length > 0 ? categoryReport[0].categoryName : 'None',
        totalTransactions: stockAnalytics.reduce((sum, s) => sum + s.totalIn + s.totalOut, 0)
      },
      topPerformers: {
        highestTurnover: turnoverReport.slice(0, 5),
        fastestMoving: stockAnalytics.slice(0, 5),
        mostProfitable: turnoverReport
          .sort((a, b) => b.profitMargin - a.profitMargin)
          .slice(0, 5)
      },
      alerts: {
        lowStock: lowStockAnalysis.filter(item => item.stockoutRisk !== 'low'),
        negativeMargin: turnoverReport.filter(item => item.profitMargin < 0),
        slowMoving: turnoverReport.filter(item => item.turnoverRatio < 1)
      },
      trends: {
        costTrends: costAnalysis.costTrends.slice(-30), // Last 30 days
        categoryPerformance: categoryReport
      }
    };

    return JSON.stringify(metrics);
  }
}
