// @ts-nocheck
import { Test, TestingModule } from '@nestjs/testing';
import { vi } from 'vitest';
import { getRepositoryToken } from '@nestjs/typeorm';
import { InventoryService } from '../src/inventory/inventory.service';
import { Product } from '../src/inventory/entities/product.entity';
import { Category } from '../src/inventory/entities/category.entity';
import { ProductNote } from '../src/inventory/entities/product-note.entity';
import { InventoryTransaction } from '../src/inventory/entities/inventory-transaction.entity';
import { TransactionType, TransactionStatus } from '../src/inventory/entities/inventory-transaction.entity';
import { NotificationsService } from '../src/notifications/notifications.service';
import { PriceHistoryService } from '../src/inventory/price-history.service';
import { ConfigService } from '@nestjs/config';

describe('InventoryService', () => {
  let service: InventoryService;
  let productRepo: any;
  let txRepo: any;
  let categoryRepo: any;
  let productNoteRepo: any;
  let notifications: any;
  let priceHistoryService: any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        InventoryService,
        {
          provide: getRepositoryToken(Product),
          useValue: {
            create: vi.fn((d) => d),
            save: vi.fn(async (d) => Object.assign({ id: 1 }, d)),
            update: vi.fn(),
            delete: vi.fn(),
            find: vi.fn(),
            findOne: vi.fn(),
            findOneBy: vi.fn(),
            count: vi.fn(),
          },
        },
        {
          provide: getRepositoryToken(InventoryTransaction),
          useValue: {
            create: vi.fn((d) => d),
            save: vi.fn(async (d) => Object.assign({ id: 100, occurredAt: new Date() }, d)),
            delete: vi.fn(),
            find: vi.fn(),
            findOne: vi.fn(),
            count: vi.fn(),
            createQueryBuilder: vi.fn(() => ({
              select: vi.fn().mockReturnThis(),
              where: vi.fn().mockReturnThis(),
              andWhere: vi.fn().mockReturnThis(),
              getRawOne: vi.fn().mockResolvedValue({ sum: '0' }),
              getMany: vi.fn().mockResolvedValue([]),
            })),
          },
        },
        {
          provide: getRepositoryToken(Category),
          useValue: {
            create: vi.fn((d) => d),
            save: vi.fn(async (d) => Object.assign({ id: 10 }, d)),
            delete: vi.fn(),
            find: vi.fn(),
            findOne: vi.fn(),
            findOneBy: vi.fn(),
            count: vi.fn(),
          },
        },
        {
          provide: getRepositoryToken(ProductNote),
          useValue: {
            create: vi.fn((d) => d),
            save: vi.fn(async (d) => Object.assign({ id: 50, createdAt: new Date() }, d)),
            delete: vi.fn(),
            find: vi.fn(),
          },
        },
        {
          provide: NotificationsService,
          useValue: {
            sendLowStockAlert: vi.fn(),
          },
        },
        {
          provide: PriceHistoryService,
          useValue: {
            trackPriceChange: vi.fn(),
          },
        },
        {
          provide: ConfigService,
          useValue: {
            get: vi.fn(() => undefined),
          },
        },
      ],
    }).compile();

    service = module.get<InventoryService>(InventoryService);
    productRepo = module.get(getRepositoryToken(Product));
    txRepo = module.get(getRepositoryToken(InventoryTransaction));
    categoryRepo = module.get(getRepositoryToken(Category));
    productNoteRepo = module.get(getRepositoryToken(ProductNote));
    notifications = module.get(NotificationsService);
    priceHistoryService = module.get(PriceHistoryService);
  });

  describe('Product Operations', () => {
    it('creates a product with default restock threshold', async () => {
      const tenantId = 'test-tenant-123';
      await service.createProduct({ name: 'Widget', sku: 'W-1' } as any, tenantId);
      expect(productRepo.create).toHaveBeenCalledWith({ name: 'Widget', sku: 'W-1', tenantId, restockThreshold: 5 });
      expect(productRepo.save).toHaveBeenCalled();
    });

    it('creates a product with custom restock threshold', async () => {
      const tenantId = 'test-tenant-123';
      await service.createProduct({ name: 'Widget', sku: 'W-1', restockThreshold: 10 } as any, tenantId);
      expect(productRepo.create).toHaveBeenCalledWith({ name: 'Widget', sku: 'W-1', tenantId, restockThreshold: 10 });
    });

    it('tracks price changes when creating product with purchase price', async () => {
      const tenantId = 'test-tenant-123';
      productRepo.save.mockResolvedValue({ id: 1, name: 'Widget', purchasePrice: 100 });
      
      await service.createProduct({ 
        name: 'Widget', 
        sku: 'W-1',
        purchasePrice: 100,
        salePrice: 150
      } as any, tenantId, 1);

      expect(priceHistoryService.trackPriceChange).toHaveBeenCalledWith(
        1, 'purchase', 0, 100, 1, 'Initial product creation', 'USD'
      );
      expect(priceHistoryService.trackPriceChange).toHaveBeenCalledWith(
        1, 'sale', 0, 150, 1, 'Initial product creation', 'USD'
      );
    });

    it('updates a product successfully', async () => {
      const tenantId = 'test-tenant-123';
      productRepo.findOneBy.mockResolvedValue({
        id: 1,
        name: 'Widget',
        purchasePrice: 100,
        salePrice: 150,
        currency: 'USD'
      });

      await service.updateProduct({ id: 1, name: 'Updated Widget' } as any, tenantId);
      
      expect(productRepo.update).toHaveBeenCalledWith(
        { id: 1 },
        { name: 'Updated Widget' }
      );
    });

    it('tracks price changes when updating product prices', async () => {
      const tenantId = 'test-tenant-123';
      productRepo.findOneBy.mockResolvedValue({
        id: 1,
        purchasePrice: 100,
        salePrice: 150,
        currency: 'USD'
      });

      await service.updateProduct({ 
        id: 1, 
        purchasePrice: 120,
        salePrice: 180
      } as any, tenantId, 1);

      expect(priceHistoryService.trackPriceChange).toHaveBeenCalledWith(
        1, 'purchase', 100, 120, 1, 'Product price update', 'USD'
      );
      expect(priceHistoryService.trackPriceChange).toHaveBeenCalledWith(
        1, 'sale', 150, 180, 1, 'Product price update', 'USD'
      );
    });

    it('throws error when updating non-existent product', async () => {
      const tenantId = 'test-tenant-123';
      productRepo.findOneBy.mockResolvedValue(null);

      await expect(service.updateProduct({ id: 999 } as any, tenantId))
        .rejects.toThrow('Product not found');
    });

    it('removes a product', async () => {
      const tenantId = 'test-tenant-123';
      await service.removeProduct(1, tenantId);
      expect(productRepo.delete).toHaveBeenCalledWith({ id: 1, tenantId });
    });

    it('finds all products with category relations', async () => {
      const tenantId = 'test-tenant-123';
      productRepo.find.mockResolvedValue([{ id: 1, name: 'Widget' }]);
      
      const result = await service.findAllProducts(tenantId);
      
      expect(productRepo.find).toHaveBeenCalledWith({ 
        where: { tenantId },
        relations: ['category'] 
      });
      expect(result).toHaveLength(1);
    });

    it('finds a single product by id', async () => {
      const tenantId = 'test-tenant-123';
      productRepo.findOne.mockResolvedValue({ id: 1, name: 'Widget' });
      
      const result = await service.findProduct(1, tenantId);
      
      expect(productRepo.findOne).toHaveBeenCalledWith({
        where: { id: 1, tenantId },
        relations: ['category']
      });
      expect(result).toEqual({ id: 1, name: 'Widget' });
    });    it('finds products by category', async () => {
      productRepo.find.mockResolvedValue([
        { id: 1, categoryId: 5, name: 'Widget 1' },
        { id: 2, categoryId: 5, name: 'Widget 2' }
      ]);
      
      const result = await service.findProductsByCategory(5);
      
      expect(productRepo.find).toHaveBeenCalledWith({
        where: { categoryId: 5 },
        relations: ['category']
      });
      expect(result).toHaveLength(2);
    });
  });

  describe('Category Operations', () => {
    it('creates a category', async () => {
      const tenantId = 'test-tenant-123';
      const categoryData = { name: 'Electronics', description: 'Electronic items' };
      
      await service.createCategory(categoryData as any, tenantId);
      
      expect(categoryRepo.create).toHaveBeenCalledWith({ ...categoryData, tenantId });
      expect(categoryRepo.save).toHaveBeenCalled();
    });

    it('updates a category', async () => {
      const tenantId = 'test-tenant-123';
      const categoryData = { id: 1, name: 'Updated Category' };
      categoryRepo.findOneBy.mockResolvedValue({ id: 1, name: 'Old Category', tenantId });
      
      await service.updateCategory(categoryData as any, tenantId);
      
      expect(categoryRepo.findOneBy).toHaveBeenCalledWith({ id: 1, tenantId });
      expect(categoryRepo.save).toHaveBeenCalled();
    });

    it('removes a category', async () => {
      const tenantId = 'test-tenant-123';
      await service.removeCategory(1, tenantId);
      expect(categoryRepo.delete).toHaveBeenCalledWith({ id: 1, tenantId });
    });

    it('finds all categories with products', async () => {
      const tenantId = 'test-tenant-123';
      categoryRepo.find.mockResolvedValue([{ id: 1, name: 'Electronics' }]);
      
      const result = await service.findAllCategories(tenantId);
      
      expect(categoryRepo.find).toHaveBeenCalledWith({ 
        where: { tenantId },
        relations: ['products'] 
      });
      expect(result).toHaveLength(1);
    });

    it('finds a single category by id', async () => {
      const tenantId = 'test-tenant-123';
      categoryRepo.findOne.mockResolvedValue({ id: 1, name: 'Electronics' });
      
      const result = await service.findCategory(1, tenantId);
      
      expect(categoryRepo.findOne).toHaveBeenCalledWith({
        where: { id: 1, tenantId },
        relations: ['products']
      });
      expect(result).toEqual({ id: 1, name: 'Electronics' });
    });
  });

  describe('Product Notes Operations', () => {
    it('creates a product note', async () => {
      const noteData = { productId: 1, userId: 1, note: 'Test note' };
      
      await service.createProductNote(noteData as any);
      
      expect(productNoteRepo.create).toHaveBeenCalledWith(noteData);
      expect(productNoteRepo.save).toHaveBeenCalled();
    });

    it('removes a product note', async () => {
      await service.removeProductNote(1);
      expect(productNoteRepo.delete).toHaveBeenCalledWith(1);
    });

    it('finds product notes ordered by creation date', async () => {
      productNoteRepo.find.mockResolvedValue([
        { id: 1, note: 'Note 1' },
        { id: 2, note: 'Note 2' }
      ]);
      
      const result = await service.findProductNotes(1);
      
      expect(productNoteRepo.find).toHaveBeenCalledWith({
        where: { productId: 1 },
        relations: ['product', 'user'],
        order: { createdAt: 'DESC' }
      });
      expect(result).toHaveLength(2);
    });
  });

  describe('Transaction Operations', () => {
    it('creates a transaction with total cost calculated from unit cost', async () => {
      productRepo.findOneBy.mockResolvedValue({ id: 1, name: 'Widget', restockThreshold: 10 });
      
      const mockQueryBuilder = {
        select: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        getRawOne: vi.fn().mockResolvedValue({ sum: '15' }) // Stock above threshold
      };
      txRepo.createQueryBuilder.mockReturnValue(mockQueryBuilder);

      const txData = {
        productId: 1,
        quantity: 5,
        unitCost: 10,
        transactionType: TransactionType.ADD
      };

      await service.createTransaction(txData as any);

      expect(txRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          productId: 1,
          quantity: 5,
          unitCost: 10,
          totalCost: 50
        })
      );
    });

    it('alerts when stock is low after transaction', async () => {
      const mockQueryBuilder = {
        select: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        getRawOne: vi.fn().mockResolvedValue({ sum: '3' }) // Low stock
      };
      txRepo.createQueryBuilder.mockReturnValue(mockQueryBuilder);
      productRepo.findOneBy.mockResolvedValue({ id: 1, name: 'Widget', restockThreshold: 5 });

      await service.createTransaction({
        productId: 1,
        quantity: -2,
        transactionType: TransactionType.REMOVE,
      } as any);

      expect(notifications.sendLowStockAlert).toHaveBeenCalledWith('Widget', 3);
    });

    it('does not alert when stock is above threshold', async () => {
      const mockQueryBuilder = {
        select: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        getRawOne: vi.fn().mockResolvedValue({ sum: '50' }) // Good stock
      };
      txRepo.createQueryBuilder.mockReturnValue(mockQueryBuilder);
      productRepo.findOneBy.mockResolvedValue({ id: 1, name: 'Widget', restockThreshold: 10 });

      await service.createTransaction({
        productId: 1,
        quantity: 10,
        transactionType: TransactionType.ADD,
      } as any);

      expect(notifications.sendLowStockAlert).not.toHaveBeenCalled();
    });

    it('updates a transaction', async () => {
      const txData = { id: 1, notes: 'Updated notes' };
      
      await service.updateTransaction(txData as any);
      
      expect(txRepo.save).toHaveBeenCalledWith(txData);
    });

    it('removes a transaction', async () => {
      await service.removeTransaction(1);
      expect(txRepo.delete).toHaveBeenCalledWith(1);
    });

    it('finds all transactions with relations', async () => {
      txRepo.find.mockResolvedValue([
        { id: 1, quantity: 10 },
        { id: 2, quantity: -5 }
      ]);
      
      const result = await service.findAllTransactions();
      
      expect(txRepo.find).toHaveBeenCalledWith({
        relations: ['product', 'user'],
        order: { occurredAt: 'DESC' }
      });
      expect(result).toHaveLength(2);
    });

    it('finds a single transaction', async () => {
      txRepo.findOne.mockResolvedValue({ id: 1, quantity: 10 });
      
      const result = await service.findTransaction(1);
      
      expect(txRepo.findOne).toHaveBeenCalledWith({
        where: { id: 1 },
        relations: ['product', 'user']
      });
    });

    it('finds transactions by product', async () => {
      txRepo.find.mockResolvedValue([
        { id: 1, productId: 1, quantity: 10 },
        { id: 2, productId: 1, quantity: -5 }
      ]);
      
      const result = await service.findTransactionsByProduct(1);
      
      expect(txRepo.find).toHaveBeenCalledWith({
        where: { productId: 1 },
        relations: ['product', 'user'],
        order: { occurredAt: 'DESC' }
      });
      expect(result).toHaveLength(2);
    });
  });

  describe('Stock Calculation Methods', () => {
    it('calculates current stock from transactions', async () => {
      const mockQueryBuilder = {
        select: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        getRawOne: vi.fn().mockResolvedValue({ sum: '125' })
      };
      txRepo.createQueryBuilder.mockReturnValue(mockQueryBuilder);

      const stock = await service.getCurrentStock(1);

      expect(mockQueryBuilder.select).toHaveBeenCalledWith('SUM(t.quantity)', 'sum');
      expect(mockQueryBuilder.where).toHaveBeenCalledWith('t.productId = :productId', { productId: 1 });
      expect(stock).toBe(125);
    });

    it('returns 0 when no transactions exist', async () => {
      const mockQueryBuilder = {
        select: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        getRawOne: vi.fn().mockResolvedValue({ sum: null })
      };
      txRepo.createQueryBuilder.mockReturnValue(mockQueryBuilder);

      const stock = await service.getCurrentStock(1);

      expect(stock).toBe(0);
    });

    it('gets low stock products', async () => {
      productRepo.find.mockResolvedValue([
        { id: 1, name: 'Widget A', restockThreshold: 10 },
        { id: 2, name: 'Widget B', restockThreshold: 5 },
        { id: 3, name: 'Widget C', restockThreshold: 20 }
      ]);

      // Mock query builder for getCurrentStock calls
      const mockQueryBuilder = {
        select: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        getRawOne: vi.fn()
          .mockResolvedValueOnce({ sum: '3' })  // Low stock
          .mockResolvedValueOnce({ sum: '50' }) // Good stock
          .mockResolvedValueOnce({ sum: '15' }) // Low stock
      };
      txRepo.createQueryBuilder.mockReturnValue(mockQueryBuilder);

      const result = await service.getLowStockProducts();

      expect(result).toHaveLength(2);
      expect(result[0]).toMatchObject({ id: 1, currentStock: 3 });
      expect(result[1]).toMatchObject({ id: 3, currentStock: 15 });
    });

    it('gets inventory summary', async () => {
      productRepo.count.mockResolvedValue(50);
      productRepo.find.mockResolvedValue([{ id: 1, restockThreshold: 10, purchasePrice: 100, salePrice: 150 }]);
      categoryRepo.count.mockResolvedValue(10);
      txRepo.count.mockResolvedValue(200);
      
      // Mock query builder for stock calculations
      const mockQueryBuilder = {
        select: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        getRawOne: vi.fn().mockResolvedValue({ sum: '5' }) // Low stock
      };
      txRepo.createQueryBuilder.mockReturnValue(mockQueryBuilder);
      
      // Mock for getAverageCostPerUnit
      txRepo.find.mockResolvedValue([{ unitCost: 95, quantity: 10 }]);

      const tenantId = 'test-tenant-123';
      const summary = await service.getInventorySummary(tenantId);

      expect(summary.totalProducts).toBe(50);
      expect(summary.totalCategories).toBe(10);
      expect(summary.recentTransactions).toBe(200);
      expect(summary.lowStockCount).toBe(1);
      expect(summary.inventoryValuation).toBeDefined();
    });
  });

  describe('Valuation and Profitability', () => {
    it('calculates inventory valuation', async () => {
      productRepo.find.mockResolvedValue([
        { id: 1, purchasePrice: 100, salePrice: 150 },
        { id: 2, purchasePrice: 50, salePrice: 75 },
        { id: 3, purchasePrice: 200, salePrice: 300 }
      ]);

      // Mock query builder for getCurrentStock calls - will be called once per product
      let stockCallCount = 0;
      const mockQueryBuilder = {
        select: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        getRawOne: vi.fn().mockImplementation(() => {
          stockCallCount++;
          if (stockCallCount === 1) return Promise.resolve({ sum: '10' });
          if (stockCallCount === 2) return Promise.resolve({ sum: '20' });
          if (stockCallCount === 3) return Promise.resolve({ sum: '5' });
          return Promise.resolve({ sum: '0' });
        })
      };
      txRepo.createQueryBuilder.mockReturnValue(mockQueryBuilder);

      // Mock for getAverageCostPerUnit calls
      txRepo.find
        .mockResolvedValueOnce([{ unitCost: 95, quantity: 10 }])
        .mockResolvedValueOnce([{ unitCost: 48, quantity: 20 }])
        .mockResolvedValueOnce([{ unitCost: 190, quantity: 5 }]);

      const tenantId = 'test-tenant-123';
      const valuation = await service.getInventoryValuation(tenantId);

      expect(valuation.totalPurchaseValue).toBe(3000);  // (100*10)+(50*20)+(200*5)
      expect(valuation.totalSaleValue).toBe(4500);      // (150*10)+(75*20)+(300*5)
      expect(valuation.totalCostValue).toBe(2860);      // (95*10)+(48*20)+(190*5)
      expect(valuation.potentialProfit).toBe(1500);     // 4500-3000
      expect(valuation.realizedProfit).toBe(1640);      // 4500-2860
    });

    it('calculates average cost per unit from positive transactions only', async () => {
      // Mock returns transactions with quantity > 0 already filtered
      txRepo.find.mockResolvedValue([
        { unitCost: 100, quantity: 10 },
        { unitCost: 90, quantity: 20 }
      ]);

      const avgCost = await service.getAverageCostPerUnit(1);

      // (100*10 + 90*20) / 30 = 93.33
      expect(avgCost).toBeCloseTo(93.33, 2);
    });

    it('returns 0 for average cost when no transactions', async () => {
      txRepo.find.mockResolvedValue([]);

      const avgCost = await service.getAverageCostPerUnit(1);

      expect(avgCost).toBe(0);
    });

    it('calculates product profitability', async () => {
      productRepo.findOneBy.mockResolvedValue({
        id: 1,
        name: 'Widget',
        purchasePrice: 100,
        salePrice: 150
      });

      // Mock query builder for getCurrentStock
      const mockQueryBuilder = {
        select: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        getRawOne: vi.fn().mockResolvedValue({ sum: '50' })
      };
      txRepo.createQueryBuilder.mockReturnValue(mockQueryBuilder);

      // Mock for getAverageCostPerUnit
      txRepo.find.mockResolvedValue([{ unitCost: 95, quantity: 50 }]);

      const tenantId = 'test-tenant-123';
      const profitability = await service.getProductProfitability(1, tenantId);

      expect(profitability).toMatchObject({
        productId: 1,
        productName: 'Widget',
        currentStock: 50,
        purchasePrice: 100,
        salePrice: 150,
        averageCost: 95,
        profitMargin: 33,           // (150-100)/150 * 100
        realizedProfitMargin: 37,   // (150-95)/150 * 100
        inventoryValue: 5000,       // 50 * 100
        potentialRevenue: 7500      // 50 * 150
      });
    });

    it('returns null for non-existent product profitability', async () => {
      const tenantId = 'test-tenant-123';
      productRepo.findOneBy.mockResolvedValue(null);

      const profitability = await service.getProductProfitability(999, tenantId);

      expect(profitability).toBeNull();
    });

    it('gets top profitable products', async () => {
      const products = [
        { id: 1, name: 'Product A', purchasePrice: 100, salePrice: 140 },
        { id: 2, name: 'Product B', purchasePrice: 50, salePrice: 80 },
        { id: 3, name: 'Product C', purchasePrice: 200, salePrice: 220 }
      ];
      
      productRepo.find.mockResolvedValue(products);
      
      // Mock findOneBy for each getProductProfitability call
      productRepo.findOneBy
        .mockResolvedValueOnce(products[0])
        .mockResolvedValueOnce(products[1])
        .mockResolvedValueOnce(products[2]);

      // Mock query builder for getCurrentStock calls - create new instance each time
      let callCount = 0;
      txRepo.createQueryBuilder.mockImplementation(() => {
        callCount++;
        const sum = callCount === 1 ? '10' : callCount === 2 ? '5' : '0';
        return {
          select: vi.fn().mockReturnThis(),
          where: vi.fn().mockReturnThis(),
          getRawOne: vi.fn().mockResolvedValue({ sum })
        };
      });

      // Mock for getAverageCostPerUnit calls
      txRepo.find
        .mockResolvedValueOnce([{ unitCost: 90, quantity: 10 }])
        .mockResolvedValueOnce([{ unitCost: 45, quantity: 5 }])
        .mockResolvedValueOnce([]);

      const tenantId = 'test-tenant-123';
      const topProducts = await service.getTopProfitableProducts(10, tenantId);

      expect(topProducts).toHaveLength(2);
      // Product B has higher margin: (80-45)/80 = 43.75%
      // Product A has margin: (140-90)/140 = 35.71%
      expect(topProducts[0].realizedProfitMargin).toBeGreaterThan(topProducts[1].realizedProfitMargin);
    });
  });

  describe('Advanced Transaction Methods', () => {
    it('creates an adjustment transaction for stock increase', async () => {
      productRepo.findOneBy.mockResolvedValue({
        id: 1,
        name: 'Widget',
        restockThreshold: 10
      });

      const mockQueryBuilder = {
        select: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        getRawOne: vi.fn().mockResolvedValue({ sum: '50' })
      };
      txRepo.createQueryBuilder.mockReturnValue(mockQueryBuilder);

      const adjustmentData = {
        productId: 1,
        userId: 1,
        adjustmentQuantity: 20,
        reason: 'FOUND',
        notes: 'Found in warehouse',
        unitCost: 100
      };

      await service.createAdjustment(adjustmentData as any);

      expect(txRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          productId: 1,
          userId: 1,
          quantity: 20,
          transactionType: TransactionType.ADD,
          status: TransactionStatus.COMPLETED,
          notes: expect.stringContaining('FOUND'),
          unitCost: 100,
          reasonCode: 'FOUND'
        })
      );
    });

    it('creates an adjustment transaction for stock decrease', async () => {
      productRepo.findOneBy.mockResolvedValue({
        id: 1,
        name: 'Widget',
        restockThreshold: 10
      });

      const mockQueryBuilder = {
        select: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        getRawOne: vi.fn().mockResolvedValue({ sum: '50' })
      };
      txRepo.createQueryBuilder.mockReturnValue(mockQueryBuilder);

      const adjustmentData = {
        productId: 1,
        userId: 1,
        adjustmentQuantity: -10,
        reason: 'DAMAGED',
        notes: 'Items damaged during inspection'
      };

      await service.createAdjustment(adjustmentData as any);

      expect(txRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          quantity: 10,
          transactionType: TransactionType.REMOVE
        })
      );
    });

    it('throws error when adjustment would result in negative stock', async () => {
      productRepo.findOneBy.mockResolvedValue({ id: 1, name: 'Widget' });
      
      const mockQueryBuilder = {
        select: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        getRawOne: vi.fn().mockResolvedValue({ sum: '5' })
      };
      txRepo.createQueryBuilder.mockReturnValue(mockQueryBuilder);

      const adjustmentData = {
        productId: 1,
        adjustmentQuantity: -10,
        reason: 'DAMAGED'
      };

      await expect(service.createAdjustment(adjustmentData as any))
        .rejects.toThrow('Adjustment would result in negative stock');
    });

    it('throws error when adjusting non-existent product', async () => {
      productRepo.findOneBy.mockResolvedValue(null);

      const adjustmentData = {
        productId: 999,
        adjustmentQuantity: 10,
        reason: 'FOUND'
      };

      await expect(service.createAdjustment(adjustmentData as any))
        .rejects.toThrow('Product not found');
    });

    it('sends low stock alert after adjustment if below threshold', async () => {
      productRepo.findOneBy.mockResolvedValue({
        id: 1,
        name: 'Widget',
        restockThreshold: 10
      });

      const mockQueryBuilder = {
        select: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        getRawOne: vi.fn().mockResolvedValue({ sum: '12' }) // Current stock before adjustment
      };
      txRepo.createQueryBuilder.mockReturnValue(mockQueryBuilder);

      const adjustmentData = {
        productId: 1,
        adjustmentQuantity: -5,
        reason: 'DAMAGED'
      };

      await service.createAdjustment(adjustmentData as any);

      expect(notifications.sendLowStockAlert).toHaveBeenCalledWith('Widget', 7);
    });
  });
});
