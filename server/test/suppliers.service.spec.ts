// @ts-nocheck
import { Test, TestingModule } from '@nestjs/testing';
import { vi } from 'vitest';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SuppliersService } from '../src/suppliers/suppliers.service';
import { Supplier } from '../src/suppliers/entities/supplier.entity';
import { SupplierProduct } from '../src/suppliers/entities/supplier-product.entity';
import { PurchaseOrder } from '../src/suppliers/entities/purchase-order.entity';
import { PurchaseOrderItem } from '../src/suppliers/entities/purchase-order-item.entity';
import { Product } from '../src/inventory/entities/product.entity';
import { InventoryTransaction } from '../src/inventory/entities/inventory-transaction.entity';

describe('SuppliersService', () => {
  let service: SuppliersService;
  let supplierRepo: Repository<Supplier>;
  let supplierProductRepo: Repository<SupplierProduct>;
  let purchaseOrderRepo: Repository<PurchaseOrder>;
  let purchaseOrderItemRepo: Repository<PurchaseOrderItem>;
  let productRepo: Repository<Product>;
  let inventoryTransactionRepo: Repository<InventoryTransaction>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SuppliersService,
        {
          provide: getRepositoryToken(Supplier),
          useValue: {
            find: vi.fn(),
            findOne: vi.fn(),
            findOneBy: vi.fn(),
            save: vi.fn(),
            delete: vi.fn(),
            create: vi.fn(),
            count: vi.fn().mockResolvedValue(0),
            manager: {
              transaction: vi.fn((cb) => cb({
                save: vi.fn((entity) => Promise.resolve(entity)),
                findOne: vi.fn(),
              })),
            },
          },
        },
        {
          provide: getRepositoryToken(SupplierProduct),
          useValue: {
            find: vi.fn(),
            findOne: vi.fn(),
            findOneBy: vi.fn(),
            save: vi.fn(),
            create: vi.fn(),
            createQueryBuilder: vi.fn(),
          },
        },
        {
          provide: getRepositoryToken(PurchaseOrder),
          useValue: {
            find: vi.fn(),
            findOne: vi.fn(),
            save: vi.fn(),
            create: vi.fn(),
            count: vi.fn().mockResolvedValue(0),
          },
        },
        {
          provide: getRepositoryToken(PurchaseOrderItem),
          useValue: {
            find: vi.fn(),
            findOne: vi.fn(),
            save: vi.fn(),
            create: vi.fn(),
            manager: {
              transaction: vi.fn((cb) => cb({
                save: vi.fn((entity) => Promise.resolve(entity)),
                findOne: vi.fn(),
              })),
            },
          },
        },
        {
          provide: getRepositoryToken(Product),
          useValue: {
            findOne: vi.fn(),
            findOneBy: vi.fn(),
            find: vi.fn(),
          },
        },
        {
          provide: getRepositoryToken(InventoryTransaction),
          useValue: {
            save: vi.fn(),
            create: vi.fn(),
            createQueryBuilder: vi.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<SuppliersService>(SuppliersService);
    supplierRepo = module.get<Repository<Supplier>>(getRepositoryToken(Supplier));
    supplierProductRepo = module.get<Repository<SupplierProduct>>(getRepositoryToken(SupplierProduct));
    purchaseOrderRepo = module.get<Repository<PurchaseOrder>>(getRepositoryToken(PurchaseOrder));
    purchaseOrderItemRepo = module.get<Repository<PurchaseOrderItem>>(getRepositoryToken(PurchaseOrderItem));
    productRepo = module.get<Repository<Product>>(getRepositoryToken(Product));
    inventoryTransactionRepo = module.get<Repository<InventoryTransaction>>(getRepositoryToken(InventoryTransaction));
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createSupplier', () => {
    it('should create a new supplier', async () => {
      const tenantId = 'test-tenant-123';
      const supplierData = {
        name: 'Test Supplier',
        contactPerson: 'John Doe',
        email: 'test@supplier.com',
        phone: '123-456-7890',
      };

      const mockSupplier = { id: 1, ...supplierData, isActive: true, tenantId };
      vi.spyOn(supplierRepo, 'save').mockResolvedValue(mockSupplier as any);

      const result = await service.createSupplier(supplierData, tenantId);

      expect(result).toBeDefined();
      expect(supplierRepo.save).toHaveBeenCalled();
    });
  });

  describe('findAllSuppliers', () => {
    it('should return all suppliers', async () => {
      const tenantId = 'test-tenant-123';
      const mockSuppliers = [
        { id: 1, name: 'Supplier 1', isActive: true, tenantId },
        { id: 2, name: 'Supplier 2', isActive: true, tenantId },
      ];

      vi.spyOn(supplierRepo, 'find').mockResolvedValue(mockSuppliers as any);

      const result = await service.findAllSuppliers(tenantId);

      expect(result).toEqual(mockSuppliers);
      expect(supplierRepo.find).toHaveBeenCalled();
    });
  });

  describe('findSupplier', () => {
    it('should find a supplier by id', async () => {
      const tenantId = 'test-tenant-123';
      const mockSupplier = { id: 1, name: 'Test Supplier', tenantId };
      vi.spyOn(supplierRepo, 'findOne').mockResolvedValue(mockSupplier as any);

      const result = await service.findSupplier(1, tenantId);

      expect(result).toEqual(mockSupplier);
      expect(supplierRepo.findOne).toHaveBeenCalled();
    });
  });

  describe('findActiveSuppliers', () => {
    it('should return only active suppliers', async () => {
      const tenantId = 'test-tenant-123';
      const mockSuppliers = [
        { id: 1, name: 'Active Supplier 1', isActive: true, tenantId },
        { id: 2, name: 'Active Supplier 2', isActive: true, tenantId },
      ];

      vi.spyOn(supplierRepo, 'find').mockResolvedValue(mockSuppliers as any);

      const result = await service.findActiveSuppliers(tenantId);

      expect(result).toEqual(mockSuppliers);
      expect(supplierRepo.find).toHaveBeenCalled();
    });
  });

  describe('updateSupplier', () => {
    it('should update supplier information', async () => {
      const tenantId = 'test-tenant-123';
      const updateData = {
        id: 1,
        name: 'Updated Supplier',
      };

      const existingSupplier = { id: 1, name: 'Old Name', tenantId };
      const updatedSupplier = { id: 1, name: 'Updated Supplier', tenantId };

      vi.spyOn(supplierRepo, 'findOne').mockResolvedValue(existingSupplier as any);
      vi.spyOn(supplierRepo, 'findOneBy').mockResolvedValue(existingSupplier as any);
      vi.spyOn(supplierRepo, 'save').mockResolvedValue(updatedSupplier as any);

      const result = await service.updateSupplier(updateData, tenantId);

      expect(result).toEqual(updatedSupplier);
      expect(supplierRepo.save).toHaveBeenCalled();
    });
  });

  describe('deleteSupplier', () => {
    it('should delete a supplier', async () => {
      const tenantId = 'test-tenant-123';
      vi.spyOn(supplierRepo, 'delete').mockResolvedValue({ affected: 1, raw: {} } as any);

      const result = await service.deleteSupplier(1, tenantId);

      expect(result).toBe(true);
      expect(supplierRepo.delete).toHaveBeenCalled();
    });

    it('should return false when supplier not found', async () => {
      const tenantId = 'test-tenant-123';
      vi.spyOn(supplierRepo, 'delete').mockResolvedValue({ affected: 0, raw: {} } as any);

      const result = await service.deleteSupplier(999, tenantId);

      expect(result).toBe(false);
    });
  });

  describe('getSupplierProducts', () => {
    it('should get products for a supplier', async () => {
      const mockProducts = [
        { id: 1, supplierId: 1, productId: 10, price: 50 },
        { id: 2, supplierId: 1, productId: 11, price: 75 },
      ];

      vi.spyOn(supplierProductRepo, 'find').mockResolvedValue(mockProducts as any);

      const result = await service.getSupplierProducts(1);

      expect(result).toEqual(mockProducts);
      expect(supplierProductRepo.find).toHaveBeenCalled();
    });
  });

  describe('getProductSuppliers', () => {
    it('should get suppliers for a product', async () => {
      const mockSuppliers = [
        { id: 1, supplierId: 100, productId: 1, price: 50 },
        { id: 2, supplierId: 101, productId: 1, price: 55 },
      ];

      vi.spyOn(supplierProductRepo, 'find').mockResolvedValue(mockSuppliers as any);

      const result = await service.getProductSuppliers(1);

      expect(result).toEqual(mockSuppliers);
      expect(supplierProductRepo.find).toHaveBeenCalled();
    });
  });

  describe('findAllPurchaseOrders', () => {
    it('should return all purchase orders', async () => {
      const mockOrders = [
        { id: 1, orderNumber: 'PO-001', status: 'pending' },
        { id: 2, orderNumber: 'PO-002', status: 'received' },
      ];

      vi.spyOn(purchaseOrderRepo, 'find').mockResolvedValue(mockOrders as any);

      const result = await service.findAllPurchaseOrders();

      expect(result).toEqual(mockOrders);
      expect(purchaseOrderRepo.find).toHaveBeenCalled();
    });
  });

  describe('findPurchaseOrder', () => {
    it('should find a purchase order by id', async () => {
      const mockOrder = { id: 1, orderNumber: 'PO-001' };
      vi.spyOn(purchaseOrderRepo, 'findOne').mockResolvedValue(mockOrder as any);

      const result = await service.findPurchaseOrder(1);

      expect(result).toEqual(mockOrder);
      expect(purchaseOrderRepo.findOne).toHaveBeenCalled();
    });
  });

  describe('findPurchaseOrdersByStatus', () => {
    it('should find purchase orders by status', async () => {
      const mockOrders = [
        { id: 1, orderNumber: 'PO-001', status: 'pending' },
      ];

      vi.spyOn(purchaseOrderRepo, 'find').mockResolvedValue(mockOrders as any);

      const result = await service.findPurchaseOrdersByStatus('pending' as any);

      expect(result).toEqual(mockOrders);
      expect(purchaseOrderRepo.find).toHaveBeenCalled();
    });
  });

  describe('findPurchaseOrdersBySupplier', () => {
    it('should find purchase orders by supplier', async () => {
      const mockOrders = [
        { id: 1, orderNumber: 'PO-001', supplierId: 1 },
      ];

      vi.spyOn(purchaseOrderRepo, 'find').mockResolvedValue(mockOrders as any);

      const result = await service.findPurchaseOrdersBySupplier(1);

      expect(result).toEqual(mockOrders);
      expect(purchaseOrderRepo.find).toHaveBeenCalled();
    });
  });

  describe('createSupplierProduct', () => {
    it('should create supplier product association', async () => {
      const mockSupplier = { id: 1, name: 'Supplier A' };
      const mockProduct = { id: 10, name: 'Product X' };
      const data = {
        supplierId: 1,
        productId: 10,
        supplierSku: 'SUP-X-001',
        unitPrice: 50,
        leadTimeDays: 7,
      };

      vi.spyOn(supplierRepo, 'findOneBy').mockResolvedValue(mockSupplier as any);
      vi.spyOn(productRepo, 'findOneBy').mockResolvedValue(mockProduct as any);
      vi.spyOn(supplierProductRepo, 'save').mockResolvedValue({ id: 1, ...data } as any);

      const result = await service.createSupplierProduct(data as any);

      expect(result).toBeDefined();
      expect(supplierProductRepo.save).toHaveBeenCalled();
    });

    it('should throw error if supplier not found', async () => {
      vi.spyOn(supplierRepo, 'findOneBy').mockResolvedValue(null);

      await expect(service.createSupplierProduct({ supplierId: 999, productId: 1 } as any))
        .rejects.toThrow();
    });

    it('should throw error if product not found', async () => {
      const mockSupplier = { id: 1, name: 'Supplier A' };
      vi.spyOn(supplierRepo, 'findOneBy').mockResolvedValue(mockSupplier as any);
      vi.spyOn(productRepo, 'findOneBy').mockResolvedValue(null);

      await expect(service.createSupplierProduct({ supplierId: 1, productId: 999 } as any))
        .rejects.toThrow();
    });
  });

  describe('updateSupplierProduct', () => {
    it('should update supplier product details', async () => {
      const existing = {
        id: 1,
        supplierId: 1,
        productId: 10,
        unitPrice: 50,
        leadTimeDays: 7,
      };

      const updateData = {
        id: 1,
        unitPrice: 55,
        leadTimeDays: 5,
      };

      vi.spyOn(supplierProductRepo, 'findOneBy').mockResolvedValue(existing as any);
      vi.spyOn(supplierProductRepo, 'save').mockResolvedValue({ ...existing, ...updateData } as any);

      const result = await service.updateSupplierProduct(updateData as any);

      expect(result.unitPrice).toBe(55);
      expect(result.leadTimeDays).toBe(5);
      expect(supplierProductRepo.save).toHaveBeenCalled();
    });

    it('should throw error if supplier product not found', async () => {
      vi.spyOn(supplierProductRepo, 'findOneBy').mockResolvedValue(null);

      await expect(service.updateSupplierProduct({ id: 999 } as any))
        .rejects.toThrow();
    });
  });

  describe('compareSupplierPrices', () => {
    it('should compare prices across suppliers for products', async () => {
      const mockComparisons = [
        {
          supplierId: 1,
          productId: 10,
          unitPrice: 50,
          supplier: { id: 1, name: 'Supplier A' },
          product: { id: 10, name: 'Product X' },
        },
        {
          supplierId: 2,
          productId: 10,
          unitPrice: 45,
          supplier: { id: 2, name: 'Supplier B' },
          product: { id: 10, name: 'Product X' },
        },
      ];

      const mockQueryBuilder = {
        innerJoin: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        andWhere: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        addSelect: vi.fn().mockReturnThis(),
        orderBy: vi.fn().mockReturnThis(),
        addOrderBy: vi.fn().mockReturnThis(),
        getMany: vi.fn().mockResolvedValue(mockComparisons),
      };
      vi.spyOn(supplierProductRepo, 'createQueryBuilder').mockReturnValue(mockQueryBuilder as any);

      const result = await service.compareSupplierPrices({ productId: 10 } as any);

      expect(result).toBeDefined();
      expect(result.length).toBeGreaterThan(0);
      expect(supplierProductRepo.createQueryBuilder).toHaveBeenCalled();
    });

    it('should filter by specific suppliers', async () => {
      const mockComparisons = [
        {
          supplierId: 1,
          productId: 10,
          unitPrice: 50,
          supplierSku: 'SKU-A',
          leadTimeDays: 7,
          discountPercentage: 0,
          minimumOrderQuantity: 10,
          isPreferred: true,
          supplier: {
            id: 1,
            name: 'Supplier A',
            leadTimeDays: 7,
            reliabilityScore: 95,
          },
          product: {
            id: 10,
            name: 'Product X',
          },
        },
      ];

      const mockQueryBuilder = {
        innerJoin: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        andWhere: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        addSelect: vi.fn().mockReturnThis(),
        orderBy: vi.fn().mockReturnThis(),
        addOrderBy: vi.fn().mockReturnThis(),
        getMany: vi.fn().mockResolvedValue(mockComparisons),
      };
      vi.spyOn(supplierProductRepo, 'createQueryBuilder').mockReturnValue(mockQueryBuilder as any);

      const result = await service.compareSupplierPrices({
        productId: 10,
        supplierIds: [1],
      } as any);

      expect(result).toBeDefined();
      expect(supplierProductRepo.createQueryBuilder).toHaveBeenCalled();
    });
  });

  describe('getBestSupplierForProduct', () => {
    it('should return best supplier based on price and lead time', async () => {
      const mockSuppliers = [
        {
          id: 1,
          supplierId: 1,
          productId: 10,
          unitPrice: 50,
          leadTimeDays: 7,
          supplier: { id: 1, name: 'Supplier A', isActive: true },
        },
        {
          id: 2,
          supplierId: 2,
          productId: 10,
          unitPrice: 45,
          leadTimeDays: 5,
          supplier: { id: 2, name: 'Supplier B', isActive: true },
        },
      ];

      const mockQueryBuilder = {
        innerJoin: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        andWhere: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        addSelect: vi.fn().mockReturnThis(),
        orderBy: vi.fn().mockReturnThis(),
        addOrderBy: vi.fn().mockReturnThis(),
        getMany: vi.fn().mockResolvedValue(mockSuppliers),
      };
      vi.spyOn(supplierProductRepo, 'createQueryBuilder').mockReturnValue(mockQueryBuilder as any);

      const result = await service.getBestSupplierForProduct(10, 100);

      expect(result).toBeDefined();
      expect(result.unitPrice).toBeLessThanOrEqual(50);
    });

    it('should return null if no suppliers available', async () => {
      const mockQueryBuilder = {
        innerJoin: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        andWhere: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        addSelect: vi.fn().mockReturnThis(),
        orderBy: vi.fn().mockReturnThis(),
        addOrderBy: vi.fn().mockReturnThis(),
        getMany: vi.fn().mockResolvedValue([]),
      };
      vi.spyOn(supplierProductRepo, 'createQueryBuilder').mockReturnValue(mockQueryBuilder as any);

      const result = await service.getBestSupplierForProduct(10);

      expect(result).toBeNull();
    });
  });

  describe('checkLowStockProducts', () => {
    it('should identify products below reorder point', async () => {
      const mockProducts = [
        { id: 1, name: 'Product A', reorderPoint: 50 },
        { id: 2, name: 'Product B', reorderPoint: 30 },
      ];

      const mockQueryBuilder = {
        select: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        andWhere: vi.fn().mockReturnThis(),
        getRawOne: vi.fn()
          .mockResolvedValueOnce({ currentStock: 20 })
          .mockResolvedValueOnce({ currentStock: 15 }),
      };

      vi.spyOn(productRepo, 'find').mockResolvedValue(mockProducts as any);
      vi.spyOn(inventoryTransactionRepo, 'createQueryBuilder').mockReturnValue(mockQueryBuilder as any);

      const result = await service.checkLowStockProducts();

      expect(result).toBeDefined();
      expect(productRepo.find).toHaveBeenCalled();
    });
  });

  describe('getCurrentStock', () => {
    it('should calculate current stock from inventory transactions', async () => {
      const mockQueryBuilder = {
        select: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        andWhere: vi.fn().mockReturnThis(),
        getRawOne: vi.fn().mockResolvedValue({ currentStock: 60 }),
      };
      vi.spyOn(inventoryTransactionRepo, 'createQueryBuilder').mockReturnValue(mockQueryBuilder as any);

      const result = await service.getCurrentStock(1);

      expect(result).toBe(60);
      expect(inventoryTransactionRepo.createQueryBuilder).toHaveBeenCalled();
    });

    it('should return 0 for products with no transactions', async () => {
      const mockQueryBuilder = {
        select: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        andWhere: vi.fn().mockReturnThis(),
        getRawOne: vi.fn().mockResolvedValue({ currentStock: 0 }),
      };
      vi.spyOn(inventoryTransactionRepo, 'createQueryBuilder').mockReturnValue(mockQueryBuilder as any);

      const result = await service.getCurrentStock(999);

      expect(result).toBe(0);
    });
  });

  describe('getSupplierPerformanceMetrics', () => {
    it('should calculate performance metrics for supplier', async () => {
      const mockOrders = [
        {
          id: 1,
          supplierId: 1,
          status: 'received',
          totalAmount: 1000,
          createdAt: new Date('2024-01-01'),
          expectedDeliveryDate: new Date('2024-01-10'),
          items: [
            { quantityOrdered: 100, quantityReceived: 100 },
          ],
        },
        {
          id: 2,
          supplierId: 1,
          status: 'received',
          totalAmount: 2000,
          createdAt: new Date('2024-02-01'),
          expectedDeliveryDate: new Date('2024-02-10'),
          items: [
            { quantityOrdered: 200, quantityReceived: 190 },
          ],
        },
      ];

      const mockSupplier = { id: 1, name: 'Test Supplier', supplierProducts: [{ isActive: true }, { isActive: true }, { isActive: false }] };
      vi.spyOn(supplierRepo, 'findOne').mockResolvedValue(mockSupplier as any);
      vi.spyOn(purchaseOrderRepo, 'find').mockResolvedValue(mockOrders as any);

      const tenantId = 'test-tenant-123';
      const result = await service.getSupplierPerformanceMetrics(1, tenantId);

      expect(result).toBeDefined();
      expect(result.totalOrders).toBe(2);
      expect(result.totalValue).toBe(3000);
      expect(result.onTimeDeliveryRate).toBeGreaterThanOrEqual(0);
    });

    it('should handle supplier with no orders', async () => {
      const tenantId = 'test-tenant-123';
      const mockSupplier = { id: 999, name: 'Empty Supplier', supplierProducts: [] };
      vi.spyOn(supplierRepo, 'findOne').mockResolvedValue(mockSupplier as any);
      vi.spyOn(purchaseOrderRepo, 'find').mockResolvedValue([]);

      const result = await service.getSupplierPerformanceMetrics(999, tenantId);

      expect(result.totalOrders).toBe(0);
      expect(result.totalValue).toBe(0);
    });
  });
});
