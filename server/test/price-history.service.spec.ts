import { Test, TestingModule } from '@nestjs/testing';
import { vi } from 'vitest';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PriceHistoryService } from '../src/inventory/price-history.service';
import { PriceHistory } from '../src/inventory/entities/price-history.entity';

describe('PriceHistoryService', () => {
  let service: PriceHistoryService;
  let repository: Repository<PriceHistory>;

  const mockPriceHistory = {
    id: 1,
    productId: 1,
    userId: 1,
    priceType: 'purchase',
    oldPrice: 100,
    newPrice: 120,
    currency: 'USD',
    reason: 'Supplier price increase',
    changedAt: new Date('2024-01-01'),
    product: { id: 1, name: 'Widget' },
    user: { id: 1, username: 'admin' },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PriceHistoryService,
        {
          provide: getRepositoryToken(PriceHistory),
          useValue: {
            create: vi.fn((dto) => dto),
            save: vi.fn((entity) => Promise.resolve({ id: 1, ...entity })),
            find: vi.fn(),
            findOne: vi.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<PriceHistoryService>(PriceHistoryService);
    repository = module.get<Repository<PriceHistory>>(getRepositoryToken(PriceHistory));
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a price history record', async () => {
      const input = {
        productId: 1,
        userId: 1,
        priceType: 'purchase' as const,
        oldPrice: 100,
        newPrice: 120,
        currency: 'USD',
      };

      const result = await service.create(input);

      expect(repository.create).toHaveBeenCalledWith(input);
      expect(repository.save).toHaveBeenCalled();
      expect(result).toHaveProperty('id');
    });
  });

  describe('findByProduct', () => {
    it('should find all price history for a product', async () => {
      const productId = 1;
      const mockRecords = [mockPriceHistory, { ...mockPriceHistory, id: 2 }];
      
      vi.spyOn(repository, 'find').mockResolvedValue(mockRecords as any);

      const result = await service.findByProduct(productId);

      expect(repository.find).toHaveBeenCalledWith({
        where: { productId },
        order: { changedAt: 'DESC' },
        relations: ['product', 'user'],
      });
      expect(result).toEqual(mockRecords);
      expect(result).toHaveLength(2);
    });

    it('should return empty array when no history exists', async () => {
      vi.spyOn(repository, 'find').mockResolvedValue([]);

      const result = await service.findByProduct(999);

      expect(result).toEqual([]);
    });
  });

  describe('findByPriceType', () => {
    it('should find price history filtered by type', async () => {
      const productId = 1;
      const priceType = 'sale';
      const mockRecords = [{ ...mockPriceHistory, priceType: 'sale' }];
      
      vi.spyOn(repository, 'find').mockResolvedValue(mockRecords as any);

      const result = await service.findByPriceType(productId, priceType);

      expect(repository.find).toHaveBeenCalledWith({
        where: { productId, priceType },
        order: { changedAt: 'DESC' },
        relations: ['product', 'user'],
      });
      expect(result).toEqual(mockRecords);
    });

    it('should handle both purchase and sale price types', async () => {
      vi.spyOn(repository, 'find').mockResolvedValue([mockPriceHistory] as any);

      await service.findByPriceType(1, 'purchase');
      expect(repository.find).toHaveBeenCalledWith(
        expect.objectContaining({ where: expect.objectContaining({ priceType: 'purchase' }) })
      );

      await service.findByPriceType(1, 'sale');
      expect(repository.find).toHaveBeenCalledWith(
        expect.objectContaining({ where: expect.objectContaining({ priceType: 'sale' }) })
      );
    });
  });

  describe('getLatestPrice', () => {
    it('should get the most recent price for a product and type', async () => {
      const productId = 1;
      const priceType = 'purchase';
      
      vi.spyOn(repository, 'findOne').mockResolvedValue(mockPriceHistory as any);

      const result = await service.getLatestPrice(productId, priceType);

      expect(repository.findOne).toHaveBeenCalledWith({
        where: { productId, priceType },
        order: { changedAt: 'DESC' },
        relations: ['product', 'user'],
      });
      expect(result).toEqual(mockPriceHistory);
    });

    it('should return null when no price history exists', async () => {
      vi.spyOn(repository, 'findOne').mockResolvedValue(null);

      const result = await service.getLatestPrice(999, 'sale');

      expect(result).toBeNull();
    });
  });

  describe('trackPriceChange', () => {
    it('should track a purchase price change', async () => {
      const result = await service.trackPriceChange(1, 'purchase', 100, 120, 1, 'Supplier increase');

      expect(repository.create).toHaveBeenCalledWith({
        productId: 1,
        userId: 1,
        priceType: 'purchase',
        oldPrice: 100,
        newPrice: 120,
        currency: 'USD',
        reason: 'Supplier increase',
      });
      expect(repository.save).toHaveBeenCalled();
    });

    it('should track a sale price change', async () => {
      await service.trackPriceChange(2, 'sale', 150, 175, 2, 'Market adjustment', 'EUR');

      expect(repository.create).toHaveBeenCalledWith({
        productId: 2,
        userId: 2,
        priceType: 'sale',
        oldPrice: 150,
        newPrice: 175,
        currency: 'EUR',
        reason: 'Market adjustment',
      });
    });

    it('should use default USD currency when not specified', async () => {
      await service.trackPriceChange(1, 'purchase', 100, 120);

      expect(repository.create).toHaveBeenCalledWith(
        expect.objectContaining({ currency: 'USD' })
      );
    });

    it('should allow tracking without userId or reason', async () => {
      await service.trackPriceChange(1, 'purchase', 100, 120);

      expect(repository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          productId: 1,
          priceType: 'purchase',
          oldPrice: 100,
          newPrice: 120,
        })
      );
    });
  });

  describe('getPriceStatistics', () => {
    it('should calculate statistics for price history', async () => {
      const priceRecords = [
        { newPrice: 100, changedAt: new Date('2024-01-01') },
        { newPrice: 120, changedAt: new Date('2024-02-01') },
        { newPrice: 90, changedAt: new Date('2024-03-01') },
        { newPrice: 110, changedAt: new Date('2024-04-01') },
      ];

      vi.spyOn(repository, 'find').mockResolvedValue(priceRecords as any);

      const result = await service.getPriceStatistics(1, 'purchase');

      expect(result).toEqual({
        minPrice: 90,
        maxPrice: 120,
        avgPrice: 105, // (100 + 120 + 90 + 110) / 4
        currentPrice: 110,
        totalChanges: 4,
        firstRecorded: new Date('2024-01-01'),
        lastUpdated: new Date('2024-04-01'),
      });
    });

    it('should return null when no price history exists', async () => {
      vi.spyOn(repository, 'find').mockResolvedValue([]);

      const result = await service.getPriceStatistics(999, 'sale');

      expect(result).toBeNull();
    });

    it('should handle single price record correctly', async () => {
      const singleRecord = [{ newPrice: 150, changedAt: new Date('2024-01-01') }];
      vi.spyOn(repository, 'find').mockResolvedValue(singleRecord as any);

      const result = await service.getPriceStatistics(1, 'sale');

      expect(result).toEqual({
        minPrice: 150,
        maxPrice: 150,
        avgPrice: 150,
        currentPrice: 150,
        totalChanges: 1,
        firstRecorded: new Date('2024-01-01'),
        lastUpdated: new Date('2024-01-01'),
      });
    });

    it('should correctly identify min and max from varied prices', async () => {
      const priceRecords = [
        { newPrice: 200, changedAt: new Date('2024-01-01') },
        { newPrice: 50, changedAt: new Date('2024-02-01') },
        { newPrice: 300, changedAt: new Date('2024-03-01') },
      ];

      vi.spyOn(repository, 'find').mockResolvedValue(priceRecords as any);

      const result = await service.getPriceStatistics(1, 'purchase');

      expect(result?.minPrice).toBe(50);
      expect(result?.maxPrice).toBe(300);
      expect(result?.currentPrice).toBe(300); // Last one
    });
  });
});
