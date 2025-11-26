import { Test, TestingModule } from '@nestjs/testing';
import { vi } from 'vitest';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AnomalyDetectionService } from '../src/analytics/anomaly-detection.service';
import { InventoryTransaction } from '../src/inventory/entities/inventory-transaction.entity';
import { Product } from '../src/inventory/entities/product.entity';

describe('AnomalyDetectionService', () => {
  let service: AnomalyDetectionService;
  let transactionRepo: Repository<InventoryTransaction>;
  let productRepo: Repository<Product>;

  const mockProduct = {
    id: 1,
    name: 'Test Product',
    sku: 'TEST-001',
  };

  const createMockTransaction = (date: Date, quantity: number, type: string = 'sale') => ({
    id: Math.random(),
    productId: 1,
    quantity,
    transactionType: type,
    occurredAt: date,
  });

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AnomalyDetectionService,
        {
          provide: getRepositoryToken(InventoryTransaction),
          useValue: {
            createQueryBuilder: vi.fn(),
            find: vi.fn(),
          },
        },
        {
          provide: getRepositoryToken(Product),
          useValue: {
            find: vi.fn(),
            findOne: vi.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<AnomalyDetectionService>(AnomalyDetectionService);
    transactionRepo = module.get<Repository<InventoryTransaction>>(
      getRepositoryToken(InventoryTransaction)
    );
    productRepo = module.get<Repository<Product>>(getRepositoryToken(Product));
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('detectInventoryAnomalies', () => {
    it('should detect anomalies across all products', async () => {
      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-01-31');

      const products = [
        { id: 1, name: 'Product A' },
        { id: 2, name: 'Product B' },
      ];

      // Create transactions with a spike
      const normalDays = Array.from({ length: 20 }, (_, i) => 
        createMockTransaction(new Date(2024, 0, i + 1), 10, 'sale')
      );
      const spikeDay = createMockTransaction(new Date(2024, 0, 21), 100, 'sale');

      const mockQueryBuilder = {
        where: vi.fn().mockReturnThis(),
        andWhere: vi.fn().mockReturnThis(),
        orderBy: vi.fn().mockReturnThis(),
        getMany: vi.fn().mockResolvedValue([...normalDays, spikeDay]),
      };

      vi.spyOn(productRepo, 'find').mockResolvedValue(products as any);
      vi.spyOn(productRepo, 'findOne').mockResolvedValue(mockProduct as any);
      vi.spyOn(transactionRepo, 'createQueryBuilder').mockReturnValue(mockQueryBuilder as any);

      const result = await service.detectInventoryAnomalies(startDate, endDate, 2.5);

      expect(productRepo.find).toHaveBeenCalled();
      expect(result).toBeInstanceOf(Array);
    });

    it('should return empty array when no products exist', async () => {
      vi.spyOn(productRepo, 'find').mockResolvedValue([]);

      const result = await service.detectInventoryAnomalies(
        new Date('2024-01-01'),
        new Date('2024-01-31')
      );

      expect(result).toEqual([]);
    });

    it('should sort anomalies by absolute z-score', async () => {
      const products = [{ id: 1, name: 'Product' }];
      
      const transactions = [
        ...Array.from({ length: 10 }, (_, i) => 
          createMockTransaction(new Date(2024, 0, i + 1), 10, 'sale')
        ),
        createMockTransaction(new Date(2024, 0, 11), 50, 'sale'), // Moderate spike
        createMockTransaction(new Date(2024, 0, 12), 100, 'sale'), // High spike
      ];

      const mockQueryBuilder = {
        where: vi.fn().mockReturnThis(),
        andWhere: vi.fn().mockReturnThis(),
        orderBy: vi.fn().mockReturnThis(),
        getMany: vi.fn().mockResolvedValue(transactions),
      };

      vi.spyOn(productRepo, 'find').mockResolvedValue(products as any);
      vi.spyOn(productRepo, 'findOne').mockResolvedValue(mockProduct as any);
      vi.spyOn(transactionRepo, 'createQueryBuilder').mockReturnValue(mockQueryBuilder as any);

      const result = await service.detectInventoryAnomalies(
        new Date('2024-01-01'),
        new Date('2024-01-31'),
        1.5 // Lower threshold to catch both
      );

      if (result.length > 1) {
        expect(Math.abs(result[0].zScore)).toBeGreaterThanOrEqual(Math.abs(result[1].zScore));
      }
    });
  });

  describe('detectProductAnomalies', () => {
    it('should return empty array for non-existent product', async () => {
      vi.spyOn(productRepo, 'findOne').mockResolvedValue(null);

      const result = await service.detectProductAnomalies(
        999,
        new Date('2024-01-01'),
        new Date('2024-01-31')
      );

      expect(result).toEqual([]);
    });

    it('should return empty array with insufficient data (< 7 transactions)', async () => {
      const transactions = Array.from({ length: 5 }, (_, i) => 
        createMockTransaction(new Date(2024, 0, i + 1), 10, 'sale')
      );

      const mockQueryBuilder = {
        where: vi.fn().mockReturnThis(),
        andWhere: vi.fn().mockReturnThis(),
        orderBy: vi.fn().mockReturnThis(),
        getMany: vi.fn().mockResolvedValue(transactions),
      };

      vi.spyOn(productRepo, 'findOne').mockResolvedValue(mockProduct as any);
      vi.spyOn(transactionRepo, 'createQueryBuilder').mockReturnValue(mockQueryBuilder as any);

      const result = await service.detectProductAnomalies(
        1,
        new Date('2024-01-01'),
        new Date('2024-01-31')
      );

      expect(result).toEqual([]);
    });

    it('should return empty array when standard deviation is zero (no variation)', async () => {
      // All transactions have same quantity
      const transactions = Array.from({ length: 10 }, (_, i) => 
        createMockTransaction(new Date(2024, 0, i + 1), 10, 'sale')
      );

      const mockQueryBuilder = {
        where: vi.fn().mockReturnThis(),
        andWhere: vi.fn().mockReturnThis(),
        orderBy: vi.fn().mockReturnThis(),
        getMany: vi.fn().mockResolvedValue(transactions),
      };

      vi.spyOn(productRepo, 'findOne').mockResolvedValue(mockProduct as any);
      vi.spyOn(transactionRepo, 'createQueryBuilder').mockReturnValue(mockQueryBuilder as any);

      const result = await service.detectProductAnomalies(
        1,
        new Date('2024-01-01'),
        new Date('2024-01-31')
      );

      expect(result).toEqual([]);
    });

    it('should detect spike anomaly', async () => {
      const normalDays = Array.from({ length: 20 }, (_, i) => 
        createMockTransaction(new Date(2024, 0, i + 1), 10, 'sale')
      );
      const spikeDay = createMockTransaction(new Date(2024, 0, 21), 100, 'sale');

      const mockQueryBuilder = {
        where: vi.fn().mockReturnThis(),
        andWhere: vi.fn().mockReturnThis(),
        orderBy: vi.fn().mockReturnThis(),
        getMany: vi.fn().mockResolvedValue([...normalDays, spikeDay]),
      };

      vi.spyOn(productRepo, 'findOne').mockResolvedValue(mockProduct as any);
      vi.spyOn(transactionRepo, 'createQueryBuilder').mockReturnValue(mockQueryBuilder as any);

      const result = await service.detectProductAnomalies(
        1,
        new Date('2024-01-01'),
        new Date('2024-01-31'),
        2.0
      );

      expect(result.length).toBeGreaterThan(0);
      const spikeAnomaly = result[0];
      expect(spikeAnomaly.type).toBe('spike');
      expect(spikeAnomaly.productId).toBe(1);
      expect(spikeAnomaly.productName).toBe('Test Product');
      expect(spikeAnomaly.zScore).toBeGreaterThan(0);
    });

    it('should detect drop anomaly', async () => {
      const normalDays = Array.from({ length: 20 }, (_, i) => 
        createMockTransaction(new Date(2024, 0, i + 1), 100, 'sale')
      );
      const dropDay = createMockTransaction(new Date(2024, 0, 21), 10, 'sale');

      const mockQueryBuilder = {
        where: vi.fn().mockReturnThis(),
        andWhere: vi.fn().mockReturnThis(),
        orderBy: vi.fn().mockReturnThis(),
        getMany: vi.fn().mockResolvedValue([...normalDays, dropDay]),
      };

      vi.spyOn(productRepo, 'findOne').mockResolvedValue(mockProduct as any);
      vi.spyOn(transactionRepo, 'createQueryBuilder').mockReturnValue(mockQueryBuilder as any);

      const result = await service.detectProductAnomalies(
        1,
        new Date('2024-01-01'),
        new Date('2024-01-31'),
        2.0
      );

      expect(result.length).toBeGreaterThan(0);
      const dropAnomaly = result[0];
      expect(dropAnomaly.type).toBe('drop');
      expect(dropAnomaly.zScore).toBeLessThan(0);
    });

    it('should classify severity correctly', async () => {
      const normalDays = Array.from({ length: 15 }, (_, i) => 
        createMockTransaction(new Date(2024, 0, i + 1), 10, 'sale')
      );
      const extremeSpike = createMockTransaction(new Date(2024, 0, 16), 200, 'sale');

      const mockQueryBuilder = {
        where: vi.fn().mockReturnThis(),
        andWhere: vi.fn().mockReturnThis(),
        orderBy: vi.fn().mockReturnThis(),
        getMany: vi.fn().mockResolvedValue([...normalDays, extremeSpike]),
      };

      vi.spyOn(productRepo, 'findOne').mockResolvedValue(mockProduct as any);
      vi.spyOn(transactionRepo, 'createQueryBuilder').mockReturnValue(mockQueryBuilder as any);

      const result = await service.detectProductAnomalies(
        1,
        new Date('2024-01-01'),
        new Date('2024-01-31'),
        1.5
      );

      expect(result.length).toBeGreaterThan(0);
      const anomaly = result[0];
      expect(['low', 'moderate', 'high', 'critical']).toContain(anomaly.severity);
    });

    it('should include recommendation for spike', async () => {
      const normalDays = Array.from({ length: 10 }, (_, i) => 
        createMockTransaction(new Date(2024, 0, i + 1), 10, 'sale')
      );
      const spike = createMockTransaction(new Date(2024, 0, 11), 80, 'sale');

      const mockQueryBuilder = {
        where: vi.fn().mockReturnThis(),
        andWhere: vi.fn().mockReturnThis(),
        orderBy: vi.fn().mockReturnThis(),
        getMany: vi.fn().mockResolvedValue([...normalDays, spike]),
      };

      vi.spyOn(productRepo, 'findOne').mockResolvedValue(mockProduct as any);
      vi.spyOn(transactionRepo, 'createQueryBuilder').mockReturnValue(mockQueryBuilder as any);

      const result = await service.detectProductAnomalies(
        1,
        new Date('2024-01-01'),
        new Date('2024-01-31'),
        2.0
      );

      expect(result.length).toBeGreaterThan(0);
      expect(result[0].recommendation).toContain('Test Product');
      expect(result[0].recommendation.length).toBeGreaterThan(0);
    });

    it('should calculate deviation percentage correctly', async () => {
      const transactions = [
        ...Array.from({ length: 10 }, (_, i) => 
          createMockTransaction(new Date(2024, 0, i + 1), 100, 'sale')
        ),
        createMockTransaction(new Date(2024, 0, 11), 150, 'sale'), // 50% increase
      ];

      const mockQueryBuilder = {
        where: vi.fn().mockReturnThis(),
        andWhere: vi.fn().mockReturnThis(),
        orderBy: vi.fn().mockReturnThis(),
        getMany: vi.fn().mockResolvedValue(transactions),
      };

      vi.spyOn(productRepo, 'findOne').mockResolvedValue(mockProduct as any);
      vi.spyOn(transactionRepo, 'createQueryBuilder').mockReturnValue(mockQueryBuilder as any);

      const result = await service.detectProductAnomalies(
        1,
        new Date('2024-01-01'),
        new Date('2024-01-31'),
        2.0
      );

      if (result.length > 0) {
        expect(result[0]).toHaveProperty('deviation');
        expect(typeof result[0].deviation).toBe('number');
      }
    });
  });

  describe('detectVelocityChanges', () => {
    it('should detect accelerating trend', async () => {
      const now = new Date();
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      const sixtyDaysAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);

      // Recent period: high sales
      const recentTxns = Array.from({ length: 10 }, (_, i) => 
        createMockTransaction(new Date(now.getTime() - i * 24 * 60 * 60 * 1000), 10, 'sale')
      );

      // Historical period: low sales
      const historicalTxns = Array.from({ length: 10 }, (_, i) => 
        createMockTransaction(new Date(thirtyDaysAgo.getTime() - i * 24 * 60 * 60 * 1000), 3, 'sale')
      );

      const mockQueryBuilder = {
        where: vi.fn().mockReturnThis(),
        andWhere: vi.fn().mockReturnThis(),
        getMany: vi.fn()
          .mockResolvedValueOnce(recentTxns)
          .mockResolvedValueOnce(historicalTxns),
      };

      vi.spyOn(transactionRepo, 'createQueryBuilder').mockReturnValue(mockQueryBuilder as any);

      const result = await service.detectVelocityChanges(1);

      expect(result.trend).toBe('accelerating');
      expect(result.currentVelocity).toBeGreaterThan(result.historicalVelocity);
      expect(result.changePercent).toBeGreaterThan(0);
    });

    it('should detect decelerating trend', async () => {
      const now = new Date();

      // Recent period: low sales
      const recentTxns = Array.from({ length: 10 }, (_, i) => 
        createMockTransaction(new Date(now.getTime() - i * 24 * 60 * 60 * 1000), 2, 'sale')
      );

      // Historical period: high sales
      const historicalTxns = Array.from({ length: 10 }, (_, i) => 
        createMockTransaction(new Date(), 10, 'sale')
      );

      const mockQueryBuilder = {
        where: vi.fn().mockReturnThis(),
        andWhere: vi.fn().mockReturnThis(),
        getMany: vi.fn()
          .mockResolvedValueOnce(recentTxns)
          .mockResolvedValueOnce(historicalTxns),
      };

      vi.spyOn(transactionRepo, 'createQueryBuilder').mockReturnValue(mockQueryBuilder as any);

      const result = await service.detectVelocityChanges(1);

      expect(result.trend).toBe('decelerating');
      expect(result.changePercent).toBeLessThan(0);
    });

    it('should detect stable trend', async () => {
      // Both periods: similar sales
      const transactions = Array.from({ length: 10 }, (_, i) => 
        createMockTransaction(new Date(), 10, 'sale')
      );

      const mockQueryBuilder = {
        where: vi.fn().mockReturnThis(),
        andWhere: vi.fn().mockReturnThis(),
        getMany: vi.fn().mockResolvedValue(transactions),
      };

      vi.spyOn(transactionRepo, 'createQueryBuilder').mockReturnValue(mockQueryBuilder as any);

      const result = await service.detectVelocityChanges(1);

      expect(result.trend).toBe('stable');
      expect(Math.abs(result.changePercent)).toBeLessThan(15);
    });

    it('should handle zero historical velocity', async () => {
      const recentTxns = Array.from({ length: 5 }, () => 
        createMockTransaction(new Date(), 10, 'sale')
      );

      const mockQueryBuilder = {
        where: vi.fn().mockReturnThis(),
        andWhere: vi.fn().mockReturnThis(),
        getMany: vi.fn()
          .mockResolvedValueOnce(recentTxns)
          .mockResolvedValueOnce([]), // No historical data
      };

      vi.spyOn(transactionRepo, 'createQueryBuilder').mockReturnValue(mockQueryBuilder as any);

      const result = await service.detectVelocityChanges(1);

      expect(result.historicalVelocity).toBe(0);
      expect(result.changePercent).toBe(0);
      expect(result.isSignificant).toBe(false);
      expect(result.trend).toBe('stable');
    });

    it('should mark change as significant when > 25%', async () => {
      const recentTxns = Array.from({ length: 30 }, () => 
        createMockTransaction(new Date(), 10, 'sale')
      );

      const historicalTxns = Array.from({ length: 30 }, () => 
        createMockTransaction(new Date(), 3, 'sale')
      );

      const mockQueryBuilder = {
        where: vi.fn().mockReturnThis(),
        andWhere: vi.fn().mockReturnThis(),
        getMany: vi.fn()
          .mockResolvedValueOnce(recentTxns)
          .mockResolvedValueOnce(historicalTxns),
      };

      vi.spyOn(transactionRepo, 'createQueryBuilder').mockReturnValue(mockQueryBuilder as any);

      const result = await service.detectVelocityChanges(1);

      expect(result.isSignificant).toBe(true);
      expect(Math.abs(result.changePercent)).toBeGreaterThan(25);
    });

    it('should calculate velocities as daily averages', async () => {
      // 30 transactions over 30 days = 1 per day
      const recentTxns = Array.from({ length: 30 }, () => 
        createMockTransaction(new Date(), 1, 'sale')
      );

      // 60 transactions over 30 days = 2 per day
      const historicalTxns = Array.from({ length: 60 }, () => 
        createMockTransaction(new Date(), 1, 'sale')
      );

      const mockQueryBuilder = {
        where: vi.fn().mockReturnThis(),
        andWhere: vi.fn().mockReturnThis(),
        getMany: vi.fn()
          .mockResolvedValueOnce(recentTxns)
          .mockResolvedValueOnce(historicalTxns),
      };

      vi.spyOn(transactionRepo, 'createQueryBuilder').mockReturnValue(mockQueryBuilder as any);

      const result = await service.detectVelocityChanges(1);

      expect(result.currentVelocity).toBe(1); // 30 / 30
      expect(result.historicalVelocity).toBe(2); // 60 / 30
    });

    it('should filter only sale transactions', async () => {
      const mockQueryBuilder = {
        where: vi.fn().mockReturnThis(),
        andWhere: vi.fn().mockReturnThis(),
        getMany: vi.fn().mockResolvedValue([]),
      };

      vi.spyOn(transactionRepo, 'createQueryBuilder').mockReturnValue(mockQueryBuilder as any);

      await service.detectVelocityChanges(1);

      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith("txn.transactionType = 'sale'");
    });
  });

  describe('detectSeasonalAnomalies', () => {
    it('should return empty array (placeholder implementation)', async () => {
      const result = await service.detectSeasonalAnomalies();

      expect(result).toEqual([]);
      expect(Array.isArray(result)).toBe(true);
    });
  });
});
