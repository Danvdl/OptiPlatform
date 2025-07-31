import { Controller, Get, Query, Res, UseGuards } from '@nestjs/common';
import { Response } from 'express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ReportsService } from './reports.service';
import { ExportService, ExportOptions } from './export.service';

@Controller('reports')
@UseGuards(JwtAuthGuard)
export class ReportsController {
  constructor(
    private readonly reportsService: ReportsService,
    private readonly exportService: ExportService,
  ) {}

  @Get('export/inventory-turnover')
  async exportInventoryTurnover(
    @Query('format') format: 'pdf' | 'csv' | 'excel' = 'csv',
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Res() res?: Response,
  ) {
    const dateRange = startDate && endDate ? {
      startDate: new Date(startDate),
      endDate: new Date(endDate)
    } : null;

    const data = await this.reportsService.getInventoryTurnoverReport(dateRange);
    
    const options: ExportOptions = {
      format,
      filename: `inventory_turnover_${new Date().toISOString().split('T')[0]}`,
      title: 'Inventory Turnover Report'
    };

    await this.exportService.exportReport(data, options, res);
  }

  @Get('export/stock-movement')
  async exportStockMovement(
    @Query('format') format: 'pdf' | 'csv' | 'excel' = 'csv',
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Res() res?: Response,
  ) {
    const dateRange = startDate && endDate ? {
      startDate: new Date(startDate),
      endDate: new Date(endDate)
    } : null;

    const data = await this.reportsService.getStockMovementAnalytics(dateRange);
    
    const options: ExportOptions = {
      format,
      filename: `stock_movement_${new Date().toISOString().split('T')[0]}`,
      title: 'Stock Movement Analytics'
    };

    await this.exportService.exportReport(data, options, res);
  }

  @Get('export/low-stock-trends')
  async exportLowStockTrends(
    @Query('format') format: 'pdf' | 'csv' | 'excel' = 'csv',
    @Res() res?: Response,
  ) {
    const data = await this.reportsService.getLowStockTrendAnalysis();
    
    const options: ExportOptions = {
      format,
      filename: `low_stock_trends_${new Date().toISOString().split('T')[0]}`,
      title: 'Low Stock Trend Analysis'
    };

    await this.exportService.exportReport(data, options, res);
  }

  @Get('export/category-performance')
  async exportCategoryPerformance(
    @Query('format') format: 'pdf' | 'csv' | 'excel' = 'csv',
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Res() res?: Response,
  ) {
    const dateRange = startDate && endDate ? {
      startDate: new Date(startDate),
      endDate: new Date(endDate)
    } : null;

    const data = await this.reportsService.getCategoryPerformanceReport(dateRange);
    
    const options: ExportOptions = {
      format,
      filename: `category_performance_${new Date().toISOString().split('T')[0]}`,
      title: 'Category Performance Report'
    };

    await this.exportService.exportReport(data, options, res);
  }

  @Get('export/cost-analysis')
  async exportCostAnalysis(
    @Query('format') format: 'pdf' | 'csv' | 'excel' = 'csv',
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Res() res?: Response,
  ) {
    const dateRange = startDate && endDate ? {
      startDate: new Date(startDate),
      endDate: new Date(endDate)
    } : null;

    const data = await this.reportsService.getCostAnalysisReport(dateRange);
    
    // Flatten the cost analysis data for better export format
    const exportData = [
      {
        metric: 'Total Purchase Cost',
        value: data.totalPurchaseCost,
        period: data.period
      },
      {
        metric: 'Total Sale Cost',
        value: data.totalSaleCost,
        period: data.period
      },
      {
        metric: 'Average Cost Per Unit',
        value: data.averageCostPerUnit,
        period: data.period
      },
      {
        metric: 'Cost Per Transaction',
        value: data.costEfficiencyMetrics.costPerTransaction,
        period: data.period
      }
    ];

    const options: ExportOptions = {
      format,
      filename: `cost_analysis_${new Date().toISOString().split('T')[0]}`,
      title: 'Cost Analysis Report'
    };

    await this.exportService.exportReport(exportData, options, res);
  }

  @Get('export/dashboard')
  async exportDashboard(
    @Query('format') format: 'pdf' | 'csv' | 'excel' = 'pdf',
    @Query('period') period: number = 30,
    @Res() res?: Response,
  ) {
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

    const dashboardData = {
      summary: {
        totalRevenue: turnoverReport.reduce((sum, r) => sum + r.revenue, 0),
        totalCost: costAnalysis.totalPurchaseCost,
        grossProfit: turnoverReport.reduce((sum, r) => sum + r.grossProfit, 0),
        averageTurnover: turnoverReport.length > 0 ? 
          turnoverReport.reduce((sum, r) => sum + r.turnoverRatio, 0) / turnoverReport.length : 0,
        lowStockItems: lowStockAnalysis.length,
        highRiskStockouts: lowStockAnalysis.filter(item => item.stockoutRisk === 'high').length,
        topCategory: categoryReport.length > 0 ? categoryReport[0].categoryName : 'None',
        reportPeriod: `${period} days`
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
      }
    };

    const options: ExportOptions = {
      format,
      filename: `dashboard_report_${new Date().toISOString().split('T')[0]}`,
      title: `OptiPlatform Dashboard Report - Last ${period} Days`
    };

    await this.exportService.exportReport(dashboardData, options, res);
  }
}
