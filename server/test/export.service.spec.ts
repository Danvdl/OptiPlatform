import { Test, TestingModule } from '@nestjs/testing';
import { vi } from 'vitest';
import { ExportService } from '../src/reports/export.service';
import { Response } from 'express';
import { AppError, ErrorCode } from '../src/errors/error-codes';

describe('ExportService', () => {
  let service: ExportService;
  let mockResponse: Partial<Response>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ExportService],
    }).compile();

    service = module.get<ExportService>(ExportService);

    // Create a mock Express response object
    mockResponse = {
      setHeader: vi.fn(),
      send: vi.fn(),
    };
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('exportReport', () => {
    const sampleData = [
      { id: 1, name: 'Product A', price: 100 },
      { id: 2, name: 'Product B', price: 200 },
    ];

    it('should export to CSV when format is csv', async () => {
      await service.exportReport(
        sampleData,
        { format: 'csv', filename: 'test-report' },
        mockResponse as Response
      );

      expect(mockResponse.setHeader).toHaveBeenCalledWith('Content-Type', 'text/csv');
      expect(mockResponse.setHeader).toHaveBeenCalledWith(
        'Content-Disposition',
        'attachment; filename="test-report.csv"'
      );
      expect(mockResponse.send).toHaveBeenCalled();
    });

    it('should export to Excel when format is excel', async () => {
      await service.exportReport(
        sampleData,
        { format: 'excel', filename: 'test-report' },
        mockResponse as Response
      );

      expect(mockResponse.setHeader).toHaveBeenCalledWith(
        'Content-Type',
        'application/vnd.ms-excel'
      );
      expect(mockResponse.setHeader).toHaveBeenCalledWith(
        'Content-Disposition',
        'attachment; filename="test-report.xls"'
      );
      expect(mockResponse.send).toHaveBeenCalled();
    });

    it('should export to PDF when format is pdf', async () => {
      await service.exportReport(
        sampleData,
        { format: 'pdf', filename: 'test-report', title: 'Test Report' },
        mockResponse as Response
      );

      expect(mockResponse.setHeader).toHaveBeenCalledWith('Content-Type', 'text/html');
      expect(mockResponse.send).toHaveBeenCalled();
    });

    it('should use default filename when not provided', async () => {
      await service.exportReport(sampleData, { format: 'csv' }, mockResponse as Response);

      const setHeaderCalls = (mockResponse.setHeader as vi.Mock).mock.calls;
      const dispositionCall = setHeaderCalls.find(call => call[0] === 'Content-Disposition');
      expect(dispositionCall[1]).toMatch(/^attachment; filename="report_\d{4}-\d{2}-\d{2}\.csv"$/);
    });

    it('should throw error for unsupported format', async () => {
      await expect(
        service.exportReport(sampleData, { format: 'xml' as any }, mockResponse as Response)
      ).rejects.toThrow(AppError);

      try {
        await service.exportReport(sampleData, { format: 'xml' as any }, mockResponse as Response);
      } catch (error) {
        expect(error).toBeInstanceOf(AppError);
        expect((error as AppError).code).toBe(ErrorCode.VALIDATION);
      }
    });

    it('should wrap non-AppError exceptions', async () => {
      // Force an error by passing invalid data
      const invalidResponse = {
        setHeader: vi.fn(() => {
          throw new Error('Mock error');
        }),
        send: vi.fn(),
      };

      await expect(
        service.exportReport(sampleData, { format: 'csv' }, invalidResponse as any)
      ).rejects.toThrow(AppError);
    });
  });

  describe('CSV export', () => {
    it('should generate valid CSV content', async () => {
      const data = [
        { id: 1, name: 'Product A', price: 100 },
        { id: 2, name: 'Product B', price: 200 },
      ];

      await service.exportReport(data, { format: 'csv' }, mockResponse as Response);

      const csvContent = (mockResponse.send as vi.Mock).mock.calls[0][0];
      expect(csvContent).toContain('id,name,price');
      expect(csvContent).toContain('1,Product A,100');
      expect(csvContent).toContain('2,Product B,200');
    });

    it('should handle commas in values', async () => {
      const data = [{ name: 'Product, Inc.', description: 'Test item' }];

      await service.exportReport(data, { format: 'csv' }, mockResponse as Response);

      const csvContent = (mockResponse.send as vi.Mock).mock.calls[0][0];
      expect(csvContent).toContain('"Product, Inc."');
    });

    it('should handle quotes in values', async () => {
      const data = [{ name: 'Product "Special"', description: 'Test' }];

      await service.exportReport(data, { format: 'csv' }, mockResponse as Response);

      const csvContent = (mockResponse.send as vi.Mock).mock.calls[0][0];
      expect(csvContent).toContain('""');
    });

    it('should handle null and undefined values', async () => {
      const data = [{ id: 1, name: null, price: undefined }];

      await service.exportReport(data, { format: 'csv' }, mockResponse as Response);

      const csvContent = (mockResponse.send as vi.Mock).mock.calls[0][0];
      expect(csvContent).toContain('1,,');
    });

    it('should throw error for empty data', async () => {
      await expect(
        service.exportReport([], { format: 'csv' }, mockResponse as Response)
      ).rejects.toThrow(AppError);
    });

    it('should throw error for non-array data', async () => {
      await expect(
        service.exportReport({ test: 'data' } as any, { format: 'csv' }, mockResponse as Response)
      ).rejects.toThrow(AppError);
    });
  });

  describe('Excel export', () => {
    it('should generate tab-separated content', async () => {
      const data = [
        { id: 1, name: 'Product A', price: 100 },
        { id: 2, name: 'Product B', price: 200 },
      ];

      await service.exportReport(data, { format: 'excel' }, mockResponse as Response);

      const excelContent = (mockResponse.send as vi.Mock).mock.calls[0][0];
      expect(excelContent).toContain('id\tname\tprice');
      expect(excelContent).toContain('1\tProduct A\t100');
    });

    it('should throw error for empty data', async () => {
      await expect(
        service.exportReport([], { format: 'excel' }, mockResponse as Response)
      ).rejects.toThrow(AppError);
    });

    it('should handle null values', async () => {
      const data = [{ id: 1, name: null }];

      await service.exportReport(data, { format: 'excel' }, mockResponse as Response);

      const excelContent = (mockResponse.send as vi.Mock).mock.calls[0][0];
      expect(excelContent).toContain('1\t');
    });
  });

  describe('PDF export', () => {
    it('should generate HTML content for array data', async () => {
      const data = [
        { id: 1, name: 'Product A', price: 100 },
        { id: 2, name: 'Product B', price: 200 },
      ];

      await service.exportReport(
        data,
        { format: 'pdf', title: 'Product Report' },
        mockResponse as Response
      );

      const htmlContent = (mockResponse.send as vi.Mock).mock.calls[0][0];
      expect(htmlContent).toContain('<h1>Product Report</h1>');
      expect(htmlContent).toContain('<table>');
      expect(htmlContent).toContain('Product A');
      expect(htmlContent).toContain('Product B');
    });

    it('should generate HTML content for object data with summary', async () => {
      const data = {
        summary: { totalProducts: 10, totalRevenue: 5000 },
        topPerformers: { products: [{ name: 'Top Product', revenue: 1000 }] },
        alerts: { lowStock: [{ name: 'Low Stock Item', quantity: 5 }] },
      };

      await service.exportReport(
        data,
        { format: 'pdf', title: 'Dashboard Report' },
        mockResponse as Response
      );

      const htmlContent = (mockResponse.send as vi.Mock).mock.calls[0][0];
      expect(htmlContent).toContain('<h2>Summary</h2>');
      expect(htmlContent).toContain('<h2>Top Performers</h2>');
      expect(htmlContent).toContain('<h2>Alerts</h2>');
    });

    it('should format currency values', async () => {
      const data = [{ name: 'Product', price: 1234.56, revenue: 10000 }];

      await service.exportReport(data, { format: 'pdf' }, mockResponse as Response);

      const htmlContent = (mockResponse.send as vi.Mock).mock.calls[0][0];
      expect(htmlContent).toContain('$1,234.56');
      expect(htmlContent).toContain('$10,000.00');
    });

    it('should format percentage values', async () => {
      const data = [{ name: 'Product', margin: 25.5, percentage: 10.25 }];

      await service.exportReport(data, { format: 'pdf' }, mockResponse as Response);

      const htmlContent = (mockResponse.send as vi.Mock).mock.calls[0][0];
      expect(htmlContent).toContain('25.50%');
      expect(htmlContent).toContain('10.25%');
    });

    it('should apply CSS classes for positive and negative values', async () => {
      const data = [
        { name: 'Profitable', profit: 1000 },
        { name: 'Loss', profit: -500 },
      ];

      await service.exportReport(data, { format: 'pdf' }, mockResponse as Response);

      const htmlContent = (mockResponse.send as vi.Mock).mock.calls[0][0];
      expect(htmlContent).toContain('class="number positive"');
      expect(htmlContent).toContain('class="number negative"');
    });

    it('should detect report types', async () => {
      const turnoverData = [{ name: 'Product', turnoverRatio: 5.5 }];
      await service.exportReport(turnoverData, { format: 'pdf' }, mockResponse as Response);
      let htmlContent = (mockResponse.send as vi.Mock).mock.calls[0][0];
      expect(htmlContent).toContain('Inventory Turnover Report');

      vi.clearAllMocks();

      const velocityData = [{ name: 'Product', velocityPerDay: 10 }];
      await service.exportReport(velocityData, { format: 'pdf' }, mockResponse as Response);
      htmlContent = (mockResponse.send as vi.Mock).mock.calls[0][0];
      expect(htmlContent).toContain('Stock Movement Analytics');
    });

    it('should format headers properly', async () => {
      const data = [{ productName: 'Test', unitPrice: 100 }];

      await service.exportReport(data, { format: 'pdf' }, mockResponse as Response);

      const htmlContent = (mockResponse.send as vi.Mock).mock.calls[0][0];
      expect(htmlContent).toContain('Product Name');
      expect(htmlContent).toContain('Unit Price');
    });

    it('should include generated timestamp', async () => {
      const data = [{ name: 'Test' }];

      await service.exportReport(data, { format: 'pdf' }, mockResponse as Response);

      const htmlContent = (mockResponse.send as vi.Mock).mock.calls[0][0];
      expect(htmlContent).toContain('Generated:');
    });
  });
});
