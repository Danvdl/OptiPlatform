import { Test, TestingModule } from '@nestjs/testing';
import { vi } from 'vitest';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ReportsService } from '../src/reports/reports.service';
import { Product } from '../src/inventory/entities/product.entity';
import { InventoryTransaction } from '../src/inventory/entities/inventory-transaction.entity';
import { Category } from '../src/inventory/entities/category.entity';
import { PriceHistory } from '../src/inventory/entities/price-history.entity';

describe('ReportsService', () => {
  let service: ReportsService;
  let productRepo: Repository<Product>;
  let transactionRepo: Repository<InventoryTransaction>;
  let categoryRepo: Repository<Category>;
  let priceHistoryRepo: Repository<PriceHistory>;

  const createMockQueryBuilder = () => ({
    select: vi.fn().mockReturnThis(),
    addSelect: vi.fn().mockReturnThis(),
    leftJoin: vi.fn().mockReturnThis(),
    innerJoin: vi.fn().mockReturnThis(),
    where: vi.fn().mockReturnThis(),
    andWhere: vi.fn().mockReturnThis(),
    groupBy: vi.fn().mockReturnThis(),
    orderBy: vi.fn().mockReturnThis(),
    having: vi.fn().mockReturnThis(),
    getRawMany: vi.fn().mockResolvedValue([]),
    getMany: vi.fn().mockResolvedValue([]),
    getOne: vi.fn().mockResolvedValue(null),
    getRawOne: vi.fn().mockResolvedValue({ sum: 0 }),
  });

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ReportsService,
        {
          provide: getRepositoryToken(Product),
          useValue: {
            find: vi.fn(),
            findOne: vi.fn(),
            createQueryBuilder: vi.fn(() => createMockQueryBuilder()),
          },
        },
        {
          provide: getRepositoryToken(InventoryTransaction),
          useValue: {
            find: vi.fn(),
            findOne: vi.fn(),
            createQueryBuilder: vi.fn(() => createMockQueryBuilder()),
          },
        },
        {
          provide: getRepositoryToken(Category),
          useValue: {
            find: vi.fn(),
            findOne: vi.fn(),
            createQueryBuilder: vi.fn(() => createMockQueryBuilder()),
          },
        },
        {
          provide: getRepositoryToken(PriceHistory),
          useValue: {
            find: vi.fn(),
            findOne: vi.fn(),
            createQueryBuilder: vi.fn(() => createMockQueryBuilder()),
          },
        },
      ],
    }).compile();

    service = module.get<ReportsService>(ReportsService);
    productRepo = module.get<Repository<Product>>(getRepositoryToken(Product));
    transactionRepo = module.get<Repository<InventoryTransaction>>(getRepositoryToken(InventoryTransaction));
    categoryRepo = module.get<Repository<Category>>(getRepositoryToken(Category));
    priceHistoryRepo = module.get<Repository<PriceHistory>>(getRepositoryToken(PriceHistory));
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getInventoryTurnoverReport', () => {
    it('should generate inventory turnover report', async () => {
      const mockProducts = [
        { 
          id: 1,
          name: 'Product 1', 
          category: { name: 'Electronics' },
        },
      ];

      const mockTransactions = [
        { quantity: -10, totalCost: 100 },
      ];

      vi.spyOn(productRepo, 'find').mockResolvedValue(mockProducts as any);
      vi.spyOn(transactionRepo, 'find').mockResolvedValue(mockTransactions as any);

      const dateRange = {
        startDate: new Date('2025-01-01'),
        endDate: new Date('2025-12-31')
      };

      const result = await service.getInventoryTurnoverReport(dateRange);

      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
    });
  });

  describe('getStockMovementAnalytics', () => {
    it('should return stock movement analytics', async () => {
      const mockProducts = [
        { 
          id: 1,
          name: 'Product 1',
          category: { name: 'Electronics' },
        },
      ];

      const mockTransactions = [
        { quantity: 10, transactionType: 'purchase' },
        { quantity: -5, transactionType: 'sale' },
      ];

      vi.spyOn(productRepo, 'find').mockResolvedValue(mockProducts as any);
      vi.spyOn(transactionRepo, 'find').mockResolvedValue(mockTransactions as any);

      const dateRange = {
        startDate: new Date('2025-01-01'),
        endDate: new Date('2025-12-31')
      };

      const result = await service.getStockMovementAnalytics(dateRange);

      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
    });
  });

  describe('getLowStockTrendAnalysis', () => {
    it('should analyze low stock trends', async () => {
      const mockProducts = [
        { 
          id: 1, 
          name: 'Product 1', 
          quantity: 5, 
          reorderPoint: 10,
          category: { name: 'Electronics' }
        },
      ];

      const mockTransactions = [
        { quantity: -1, transactionDate: new Date() },
      ];

      vi.spyOn(productRepo, 'find').mockResolvedValue(mockProducts as any);
      vi.spyOn(transactionRepo, 'find').mockResolvedValue(mockTransactions as any);
      vi.spyOn(productRepo, 'findOne').mockResolvedValue(mockProducts[0] as any);

      const result = await service.getLowStockTrendAnalysis();

      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
    });
  });

  describe('getCategoryPerformanceReport', () => {
    it('should generate category performance report', async () => {
      const mockCategories = [
        { 
          id: 1,
          name: 'Electronics',
          products: [],
        },
      ];

      const mockProducts = [
        { id: 1, name: 'Product 1', categoryId: 1 },
      ];

      const mockTransactions = [
        { quantity: -10, totalCost: 100 },
      ];

      vi.spyOn(categoryRepo, 'find').mockResolvedValue(mockCategories as any);
      vi.spyOn(productRepo, 'find').mockResolvedValue(mockProducts as any);
      vi.spyOn(transactionRepo, 'find').mockResolvedValue(mockTransactions as any);

      const dateRange = {
        startDate: new Date('2025-01-01'),
        endDate: new Date('2025-12-31')
      };

      const result = await service.getCategoryPerformanceReport(dateRange);

      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
    });
  });

  describe('getCostAnalysisReport', () => {
    it('should generate cost analysis report', async () => {
      const mockTransactions = [
        { 
          quantity: 10,
          totalCost: 1000,
          transactionType: 'purchase',
          occurredAt: new Date('2025-01-15'),
          product: { name: 'Product 1' }
        },
        {
          quantity: -5,
          totalCost: 500,
          transactionType: 'sale',
          occurredAt: new Date('2025-01-20'),
          product: { name: 'Product 1' }
        }
      ];

      vi.spyOn(transactionRepo, 'find').mockResolvedValue(mockTransactions as any);

      const dateRange = {
        startDate: new Date('2025-01-01'),
        endDate: new Date('2025-12-31')
      };

      const result = await service.getCostAnalysisReport(dateRange);

      expect(result).toBeDefined();
      expect(transactionRepo.find).toHaveBeenCalled();
    });
  });
});
