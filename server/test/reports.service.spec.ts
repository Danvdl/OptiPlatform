import { Test, TestingModule } from '@nestjs/testing';
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

  const mockQueryBuilder = {
    select: jest.fn().mockReturnThis(),
    addSelect: jest.fn().mockReturnThis(),
    leftJoin: jest.fn().mockReturnThis(),
    innerJoin: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    groupBy: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    having: jest.fn().mockReturnThis(),
    getRawMany: jest.fn().mockResolvedValue([]),
    getMany: jest.fn().mockResolvedValue([]),
    getOne: jest.fn().mockResolvedValue(null),
    getRawOne: jest.fn().mockResolvedValue({ sum: 0 }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ReportsService,
        {
          provide: getRepositoryToken(Product),
          useValue: {
            find: jest.fn(),
            findOne: jest.fn(),
            createQueryBuilder: jest.fn(() => mockQueryBuilder),
          },
        },
        {
          provide: getRepositoryToken(InventoryTransaction),
          useValue: {
            find: jest.fn(),
            findOne: jest.fn(),
            createQueryBuilder: jest.fn(() => mockQueryBuilder),
          },
        },
        {
          provide: getRepositoryToken(Category),
          useValue: {
            find: jest.fn(),
            findOne: jest.fn(),
            createQueryBuilder: jest.fn(() => mockQueryBuilder),
          },
        },
        {
          provide: getRepositoryToken(PriceHistory),
          useValue: {
            find: jest.fn(),
            findOne: jest.fn(),
            createQueryBuilder: jest.fn(() => mockQueryBuilder),
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
    jest.clearAllMocks();
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

      jest.spyOn(productRepo, 'find').mockResolvedValue(mockProducts as any);
      jest.spyOn(transactionRepo, 'find').mockResolvedValue(mockTransactions as any);
      mockQueryBuilder.getMany.mockResolvedValue(mockProducts);

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

      jest.spyOn(productRepo, 'find').mockResolvedValue(mockProducts as any);
      jest.spyOn(transactionRepo, 'find').mockResolvedValue(mockTransactions as any);
      mockQueryBuilder.getMany.mockResolvedValue(mockProducts);

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

      jest.spyOn(productRepo, 'find').mockResolvedValue(mockProducts as any);
      jest.spyOn(transactionRepo, 'find').mockResolvedValue(mockTransactions as any);
      jest.spyOn(productRepo, 'findOne').mockResolvedValue(mockProducts[0] as any);
      mockQueryBuilder.getMany.mockResolvedValue(mockProducts);

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

      jest.spyOn(categoryRepo, 'find').mockResolvedValue(mockCategories as any);
      jest.spyOn(productRepo, 'find').mockResolvedValue(mockProducts as any);
      jest.spyOn(transactionRepo, 'find').mockResolvedValue(mockTransactions as any);

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

      jest.spyOn(transactionRepo, 'find').mockResolvedValue(mockTransactions as any);

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
