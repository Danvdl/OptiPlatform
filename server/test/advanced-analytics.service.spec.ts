import { Test, TestingModule } from '@nestjs/testing';
import { vi } from 'vitest';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AdvancedAnalyticsService } from '../src/analytics/advanced-analytics.service';
import { Product } from '../src/inventory/entities/product.entity';
import { InventoryTransaction } from '../src/inventory/entities/inventory-transaction.entity';

describe('AdvancedAnalyticsService', () => {
  let service: AdvancedAnalyticsService;
  let productRepo: Repository<Product>;
  let transactionRepo: Repository<InventoryTransaction>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AdvancedAnalyticsService,
        {
          provide: getRepositoryToken(Product),
          useValue: {
            findOne: vi.fn(),
            find: vi.fn(),
          },
        },
        {
          provide: getRepositoryToken(InventoryTransaction),
          useValue: {
            find: vi.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<AdvancedAnalyticsService>(AdvancedAnalyticsService);
    productRepo = module.get<Repository<Product>>(getRepositoryToken(Product));
    transactionRepo = module.get<Repository<InventoryTransaction>>(getRepositoryToken(InventoryTransaction));
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('calculateProductHealthScore', () => {
    it('should calculate health score for a product', async () => {
      const mockProduct = {
        id: 1,
        name: 'Test Product',
        quantity: 100,
        price: 50,
        cost: 30,
        reorderPoint: 20,
      };

      const mockTransactions = [
        {
          id: 1,
          productId: 1,
          quantity: -10,
          totalCost: 300,
          transactionDate: new Date('2025-01-15'),
          occurredAt: new Date('2025-01-15'),
        },
        {
          id: 2,
          productId: 1,
          quantity: -15,
          totalCost: 450,
          transactionDate: new Date('2025-01-20'),
          occurredAt: new Date('2025-01-20'),
        },
      ];

      vi.spyOn(productRepo, 'findOne').mockResolvedValue(mockProduct as any);
      vi.spyOn(transactionRepo, 'find').mockResolvedValue(mockTransactions as any);

      const result = await service.calculateProductHealthScore(1);

      expect(result).toBeDefined();
      expect(result.productId).toBe(1);
      expect(typeof result.overallScore).toBe('number');
      expect(result.healthStatus).toBeDefined();
      expect(result.scoreBreakdown).toBeDefined();
    });

    it('should handle product not found', async () => {
      vi.spyOn(productRepo, 'findOne').mockResolvedValue(null);

      await expect(service.calculateProductHealthScore(999)).rejects.toThrow();
    });
  });

  describe('forecastDemand', () => {
    it('should forecast demand for a product', async () => {
      const mockProduct = {
        id: 1,
        name: 'Test Product',
        quantity: 100,
      };

      const mockTransactions = [
        {
          id: 1,
          productId: 1,
          quantity: -10,
          transactionDate: new Date('2025-01-01'),
          occurredAt: new Date('2025-01-01'),
        },
        {
          id: 2,
          productId: 1,
          quantity: -12,
          transactionDate: new Date('2025-01-08'),
          occurredAt: new Date('2025-01-08'),
        },
        {
          id: 3,
          productId: 1,
          quantity: -15,
          transactionDate: new Date('2025-01-15'),
          occurredAt: new Date('2025-01-15'),
        },
      ];

      vi.spyOn(productRepo, 'findOne').mockResolvedValue(mockProduct as any);
      vi.spyOn(transactionRepo, 'find').mockResolvedValue(mockTransactions as any);

      const result = await service.forecastDemand(1, 7);

      expect(result).toBeDefined();
      expect(result.productId).toBe(1);
      expect(Array.isArray(result.predictions)).toBe(true);
    });

    it('should handle different forecast periods', async () => {
      const mockProduct = {
        id: 1,
        name: 'Test Product',
        quantity: 100,
      };

      vi.spyOn(productRepo, 'findOne').mockResolvedValue(mockProduct as any);
      vi.spyOn(transactionRepo, 'find').mockResolvedValue([]);

      const result = await service.forecastDemand(1, 14);

      expect(result).toBeDefined();
    });
  });
});
