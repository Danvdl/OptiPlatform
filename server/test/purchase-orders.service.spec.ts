import { Test, TestingModule } from '@nestjs/testing';
import { vi } from 'vitest';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PurchaseOrdersService } from '../src/suppliers/purchase-orders.service';
import { PurchaseOrder } from '../src/suppliers/entities/purchase-order.entity';
import { PurchaseOrderItem } from '../src/suppliers/entities/purchase-order-item.entity';
import { Supplier } from '../src/suppliers/entities/supplier.entity';
import { Product } from '../src/inventory/entities/product.entity';
import { InventoryTransaction } from '../src/inventory/entities/inventory-transaction.entity';

describe('PurchaseOrdersService', () => {
  let service: PurchaseOrdersService;
  let purchaseOrderRepo: Repository<PurchaseOrder>;
  let purchaseOrderItemRepo: Repository<PurchaseOrderItem>;
  let supplierRepo: Repository<Supplier>;
  let productRepo: Repository<Product>;
  let inventoryTransactionRepo: Repository<InventoryTransaction>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PurchaseOrdersService,
        {
          provide: getRepositoryToken(PurchaseOrder),
          useValue: {
            find: vi.fn(),
            findOne: vi.fn(),
            findOneBy: vi.fn(),
            save: vi.fn(),
            create: vi.fn(),
            createQueryBuilder: vi.fn(() => ({
              where: vi.fn().mockReturnThis(),
              andWhere: vi.fn().mockReturnThis(),
              leftJoin: vi.fn().mockReturnThis(),
              leftJoinAndSelect: vi.fn().mockReturnThis(),
              orderBy: vi.fn().mockReturnThis(),
              select: vi.fn().mockReturnThis(),
              addSelect: vi.fn().mockReturnThis(),
              getRawMany: vi.fn().mockResolvedValue([]),
              getMany: vi.fn().mockResolvedValue([]),
            })),
            manager: {
              transaction: vi.fn(async (cb) => {
                const mockPORepo = {
                  save: vi.fn((entity) => Promise.resolve(entity)),
                  findOne: vi.fn(),
                  findOneBy: vi.fn(),
                  create: vi.fn((entity, data) => data),
                  count: vi.fn().mockResolvedValue(0),
                };
                const mockPOItemRepo = {
                  save: vi.fn((entity) => Promise.resolve(entity)),
                  findOne: vi.fn(),
                  findOneBy: vi.fn(),
                  remove: vi.fn((entity) => Promise.resolve(entity)),
                  create: vi.fn((entity, data) => data),
                  find: vi.fn().mockResolvedValue([]),
                };
                const mockProductRepo = {
                  findOneBy: vi.fn(),
                };
                const mockSupplierRepo = {
                  findOneBy: vi.fn(),
                };
                const mockInventoryTxRepo = {
                  save: vi.fn((entity) => Promise.resolve(entity)),
                  create: vi.fn((entity, data) => data),
                };
                const manager = {
                  save: vi.fn((entity, data) => Promise.resolve(data)),
                  findOne: vi.fn(),
                  findOneBy: vi.fn(),
                  create: vi.fn((entity, data) => data),
                  find: vi.fn().mockResolvedValue([]),
                  delete: vi.fn().mockResolvedValue({ affected: 1 }),
                  getRepository: vi.fn((entity) => {
                    if (entity.name === 'PurchaseOrder') return mockPORepo;
                    if (entity.name === 'PurchaseOrderItem') return mockPOItemRepo;
                    if (entity.name === 'Product') return mockProductRepo;
                    if (entity.name === 'Supplier') return mockSupplierRepo;
                    if (entity.name === 'InventoryTransaction') return mockInventoryTxRepo;
                    return mockPORepo;
                  }),
                };
                return cb(manager);
              }),
            },
          },
        },
        {
          provide: getRepositoryToken(PurchaseOrderItem),
          useValue: {
            find: vi.fn(),
            findOne: vi.fn(),
            findOneBy: vi.fn(),
            save: vi.fn(),
            create: vi.fn(),
            manager: {
              transaction: vi.fn(async (cb) => {
                const mockPORepo = {
                  save: vi.fn((entity) => Promise.resolve(entity)),
                  findOne: vi.fn(),
                  findOneBy: vi.fn(),
                  create: vi.fn((entity, data) => data),
                };
                const mockPOItemRepo = {
                  save: vi.fn((entity) => Promise.resolve(entity)),
                  findOne: vi.fn(),
                  findOneBy: vi.fn(),
                  remove: vi.fn((entity) => Promise.resolve(entity)),
                  create: vi.fn((entity, data) => data),
                  find: vi.fn().mockResolvedValue([]),
                };
                const mockProductRepo = {
                  findOneBy: vi.fn(),
                  save: vi.fn((entity) => Promise.resolve(entity)),
                };
                const mockInventoryTxRepo = {
                  save: vi.fn((entity) => Promise.resolve(entity)),
                  create: vi.fn((entity, data) => data),
                };
                const manager = {
                  save: vi.fn((entity, data) => Promise.resolve(data)),
                  findOne: vi.fn(),
                  findOneBy: vi.fn(),
                  create: vi.fn((entity, data) => data),
                  remove: vi.fn((entity) => Promise.resolve(entity)),
                  find: vi.fn().mockResolvedValue([]),
                  delete: vi.fn().mockResolvedValue({ affected: 1 }),
                  getRepository: vi.fn((entity) => {
                    if (entity.name === 'PurchaseOrder') return mockPORepo;
                    if (entity.name === 'PurchaseOrderItem') return mockPOItemRepo;
                    if (entity.name === 'Product') return mockProductRepo;
                    if (entity.name === 'InventoryTransaction') return mockInventoryTxRepo;
                    return mockPOItemRepo;
                  }),
                };
                return cb(manager);
              }),
            },
          },
        },
        {
          provide: getRepositoryToken(Supplier),
          useValue: {
            findOne: vi.fn(),
            findOneBy: vi.fn(),
          },
        },
        {
          provide: getRepositoryToken(Product),
          useValue: {
            findOne: vi.fn(),
            findOneBy: vi.fn(),
          },
        },
        {
          provide: getRepositoryToken(InventoryTransaction),
          useValue: {
            save: vi.fn(),
            create: vi.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<PurchaseOrdersService>(PurchaseOrdersService);
    purchaseOrderRepo = module.get<Repository<PurchaseOrder>>(getRepositoryToken(PurchaseOrder));
    purchaseOrderItemRepo = module.get<Repository<PurchaseOrderItem>>(getRepositoryToken(PurchaseOrderItem));
    supplierRepo = module.get<Repository<Supplier>>(getRepositoryToken(Supplier));
    productRepo = module.get<Repository<Product>>(getRepositoryToken(Product));
    inventoryTransactionRepo = module.get<Repository<InventoryTransaction>>(getRepositoryToken(InventoryTransaction));
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findAll', () => {
    it('should return all purchase orders', async () => {
      const mockOrders = [
        { id: 1, orderNumber: 'PO-001', status: 'pending' },
        { id: 2, orderNumber: 'PO-002', status: 'received' },
      ];

      vi.spyOn(purchaseOrderRepo, 'find').mockResolvedValue(mockOrders as any);

      const result = await service.findAll();

      expect(result).toEqual(mockOrders);
      expect(purchaseOrderRepo.find).toHaveBeenCalled();
    });
  });

  describe('findOne', () => {
    it('should find a purchase order by id', async () => {
      const mockOrder = { 
        id: 1, 
        orderNumber: 'PO-001',
        status: 'pending',
        supplier: { id: 1, name: 'Test Supplier' }
      };
      
      vi.spyOn(purchaseOrderRepo, 'findOne').mockResolvedValue(mockOrder as any);

      const result = await service.findOne(1);

      expect(result).toEqual(mockOrder);
      expect(purchaseOrderRepo.findOne).toHaveBeenCalled();
    });
  });

  describe('findByStatus', () => {
    it('should find purchase orders by status', async () => {
      const mockOrders = [
        { id: 1, orderNumber: 'PO-001', status: 'pending' },
      ];

      vi.spyOn(purchaseOrderRepo, 'find').mockResolvedValue(mockOrders as any);

      const result = await service.findByStatus('pending' as any);

      expect(result).toEqual(mockOrders);
      expect(purchaseOrderRepo.find).toHaveBeenCalled();
    });
  });

  describe('findBySupplier', () => {
    it('should find purchase orders by supplier', async () => {
      const mockOrders = [
        { id: 1, orderNumber: 'PO-001', supplierId: 1 },
        { id: 2, orderNumber: 'PO-002', supplierId: 1 },
      ];

      vi.spyOn(purchaseOrderRepo, 'find').mockResolvedValue(mockOrders as any);

      const result = await service.findBySupplier(1);

      expect(result).toEqual(mockOrders);
      expect(purchaseOrderRepo.find).toHaveBeenCalled();
    });
  });

  describe('findPendingApproval', () => {
    it('should find purchase orders awaiting approval', async () => {
      const mockOrders = [
        { id: 1, orderNumber: 'PO-001', status: 'draft', submittedDate: new Date() },
        { id: 2, orderNumber: 'PO-002', status: 'draft', submittedDate: new Date() },
      ];

      vi.spyOn(purchaseOrderRepo, 'find').mockResolvedValue(mockOrders as any);

      const result = await service.findPendingApproval();

      expect(result).toEqual(mockOrders);
      expect(purchaseOrderRepo.find).toHaveBeenCalledWith({
        where: { status: 'pending_approval' },
        relations: ['supplier', 'items'],
        order: { createdAt: 'DESC' }
      });
    });
  });

  describe('findOverdue', () => {
    it('should find overdue purchase orders', async () => {
      const pastDate = new Date('2024-01-01');
      const mockOrders = [
        { id: 1, orderNumber: 'PO-001', status: 'sent', expectedDeliveryDate: pastDate },
      ];

      const mockQueryBuilder = {
        where: vi.fn().mockReturnThis(),
        andWhere: vi.fn().mockReturnThis(),
        leftJoinAndSelect: vi.fn().mockReturnThis(),
        orderBy: vi.fn().mockReturnThis(),
        getMany: vi.fn().mockResolvedValue(mockOrders),
      };
      vi.spyOn(purchaseOrderRepo, 'createQueryBuilder').mockReturnValue(mockQueryBuilder as any);

      const result = await service.findOverdue();

      expect(result).toEqual(mockOrders);
      expect(purchaseOrderRepo.createQueryBuilder).toHaveBeenCalled();
    });
  });

  describe('create', () => {
    it('should create a new purchase order with items', async () => {
      const mockSupplier = { id: 1, name: 'Test Supplier', shippingCost: 0 };
      const mockProduct = { id: 10, name: 'Test Product', price: 100 };
      
      const createData = {
        supplierId: 1,
        expectedDeliveryDate: new Date('2024-12-01'),
        items: [
          { productId: 10, quantityOrdered: 5, unitPrice: 100 },
        ],
      };

      const mockSavedPO = {
        id: 1,
        orderNumber: 'PO-000001',
        ...createData,
        status: 'draft',
        totalAmount: 500,
      };

      // Configure the manager transaction mock to return proper values
      vi.spyOn(purchaseOrderRepo.manager, 'transaction').mockImplementationOnce(async (cb: any) => {
        const manager = {
          findOneBy: vi.fn()
            .mockResolvedValueOnce(mockSupplier)  // supplier lookup
            .mockResolvedValueOnce(mockProduct),  // product lookup
          save: vi.fn().mockResolvedValue(mockSavedPO),
          create: vi.fn((entity, data) => ({ ...data, id: 1 })),
          findOne: vi.fn().mockResolvedValue(mockSavedPO),
          find: vi.fn().mockResolvedValue([]),
          delete: vi.fn().mockResolvedValue({ affected: 1 }),
          getRepository: vi.fn(() => ({ count: vi.fn().mockResolvedValue(0) })),
        };
        return cb(manager);
      });

      const result = await service.create(createData as any, 1);

      expect(result).toBeDefined();
      expect(purchaseOrderRepo.manager.transaction).toHaveBeenCalled();
    });
  });

  describe('update', () => {
    it('should update purchase order details', async () => {
      const existingPO = {
        id: 1,
        orderNumber: 'PO-001',
        status: 'draft',
        notes: 'Old notes',
      };

      const updateData = {
        id: 1,
        notes: 'Updated notes',
        expectedDeliveryDate: new Date('2024-12-15'),
      };

      vi.spyOn(purchaseOrderRepo, 'findOneBy').mockResolvedValue(existingPO as any);
      vi.spyOn(purchaseOrderRepo, 'save').mockResolvedValue({ ...existingPO, ...updateData } as any);

      const result = await service.update(updateData as any);

      expect(result.notes).toBe('Updated notes');
      expect(purchaseOrderRepo.save).toHaveBeenCalled();
    });

    it('should throw error if purchase order not found', async () => {
      vi.spyOn(purchaseOrderRepo, 'findOneBy').mockResolvedValue(null);

      await expect(service.update({ id: 999 } as any)).rejects.toThrow();
    });
  });

  describe('approve', () => {
    it('should approve a purchase order', async () => {
      const draftPO = {
        id: 1,
        orderNumber: 'PO-001',
        status: 'pending_approval',
      };

      vi.spyOn(purchaseOrderRepo, 'findOneBy').mockResolvedValue(draftPO as any);
      vi.spyOn(purchaseOrderRepo, 'save').mockResolvedValue({
        ...draftPO,
        status: 'approved',
        approvedBy: 1,
        approvedDate: expect.any(Date),
      } as any);

      const result = await service.approve(1, 1, 'Approved for purchase');

      expect(result.status).toBe('approved');
      expect(purchaseOrderRepo.save).toHaveBeenCalled();
    });

    it('should throw error if order already approved', async () => {
      const approvedPO = {
        id: 1,
        orderNumber: 'PO-001',
        status: 'approved',
      };

      vi.spyOn(purchaseOrderRepo, 'findOneBy').mockResolvedValue(approvedPO as any);

      await expect(service.approve(1, 1)).rejects.toThrow();
    });
  });

  describe('reject', () => {
    it('should reject a purchase order', async () => {
      const draftPO = {
        id: 1,
        orderNumber: 'PO-001',
        status: 'pending_approval',
      };

      vi.spyOn(purchaseOrderRepo, 'findOneBy').mockResolvedValue(draftPO as any);
      vi.spyOn(purchaseOrderRepo, 'save').mockResolvedValue({
        ...draftPO,
        status: 'rejected',
      } as any);

      const result = await service.reject(1, 1, 'Budget constraints');

      expect(result.status).toBe('rejected');
      expect(purchaseOrderRepo.save).toHaveBeenCalled();
    });
  });

  describe('cancel', () => {
    it('should cancel a purchase order', async () => {
      const orderedPO = {
        id: 1,
        orderNumber: 'PO-001',
        status: 'ordered',
      };

      vi.spyOn(purchaseOrderRepo, 'findOneBy').mockResolvedValue(orderedPO as any);
      vi.spyOn(purchaseOrderRepo, 'save').mockResolvedValue({
        ...orderedPO,
        status: 'cancelled',
      } as any);

      const result = await service.cancel(1, 'Supplier unavailable');

      expect(result.status).toBe('cancelled');
      expect(purchaseOrderRepo.save).toHaveBeenCalled();
    });

    it('should throw error if order already received', async () => {
      const receivedPO = {
        id: 1,
        orderNumber: 'PO-001',
        status: 'received',
      };

      vi.spyOn(purchaseOrderRepo, 'findOneBy').mockResolvedValue(receivedPO as any);

      await expect(service.cancel(1, 'Too late')).rejects.toThrow();
    });
  });

  describe('addItem', () => {
    it('should add item to purchase order', async () => {
      const mockPO = { id: 1, orderNumber: 'PO-001', status: 'draft' };
      const mockProduct = { id: 10, name: 'Product A', price: 50 };
      const mockSavedItem = { id: 1, productId: 10, quantityOrdered: 10, unitPrice: 50 };

      vi.spyOn(purchaseOrderItemRepo.manager, 'transaction').mockImplementationOnce(async (cb: any) => {
        const manager = {
          findOneBy: vi.fn()
            .mockResolvedValueOnce(mockPO)      // PO lookup
            .mockResolvedValueOnce(mockProduct), // Product lookup
          save: vi.fn().mockResolvedValue(mockSavedItem),
          create: vi.fn((entity, data) => data),
          findOne: vi.fn(),
          find: vi.fn().mockResolvedValue([]),
          delete: vi.fn().mockResolvedValue({ affected: 1 }),
          getRepository: vi.fn(() => ({ count: vi.fn().mockResolvedValue(0) })),
        };
        return cb(manager);
      });

      const itemData = {
        productId: 10,
        quantityOrdered: 10,
        unitPrice: 50,
      };

      const result = await service.addItem(1, itemData as any);

      expect(result).toBeDefined();
      expect(purchaseOrderItemRepo.manager.transaction).toHaveBeenCalled();
    });
  });

  describe('updateItem', () => {
    it('should update purchase order item', async () => {
      const existingItem = {
        id: 1,
        purchaseOrderId: 1,
        productId: 10,
        quantity: 5,
        unitPrice: 50,
        purchaseOrder: { status: 'draft' },
      };

      vi.spyOn(purchaseOrderItemRepo.manager, 'transaction').mockImplementationOnce(async (cb: any) => {
        const existingItem = {
          id: 1,
          purchaseOrderId: 1,
          productId: 10,
          quantityOrdered: 5,
          unitPrice: 50,
          purchaseOrder: { status: 'draft' },
        };
        const manager = {
          findOne: vi.fn().mockResolvedValue(existingItem),
          save: vi.fn().mockResolvedValue({ ...existingItem, quantityOrdered: 10 }),
          create: vi.fn((entity, data) => data),
          findOneBy: vi.fn(),
          find: vi.fn().mockResolvedValue([]),
          delete: vi.fn().mockResolvedValue({ affected: 1 }),
          getRepository: vi.fn(() => ({ count: vi.fn().mockResolvedValue(0) })),
        };
        return cb(manager);
      });

      const result = await service.updateItem(1, { quantityOrdered: 10 } as any);

      expect(result.quantityOrdered).toBe(10);
      expect(purchaseOrderItemRepo.manager.transaction).toHaveBeenCalled();
    });
  });

  describe('removeItem', () => {
    it('should remove item from purchase order', async () => {
      const mockItem = {
        id: 1,
        purchaseOrderId: 1,
        purchaseOrder: { status: 'draft' },
      };

      vi.spyOn(purchaseOrderItemRepo.manager, 'transaction').mockImplementationOnce(async (cb: any) => {
        const mockItem = {
          id: 1,
          purchaseOrderId: 1,
          purchaseOrder: { status: 'draft' },
        };
        const manager = {
          findOne: vi.fn().mockResolvedValue(mockItem),
          delete: vi.fn().mockResolvedValue({ affected: 1 }),
          save: vi.fn(),
          create: vi.fn((entity, data) => data),
          findOneBy: vi.fn(),
          find: vi.fn().mockResolvedValue([]),
          getRepository: vi.fn(() => ({ count: vi.fn().mockResolvedValue(0) })),
        };
        return cb(manager);
      });

      const result = await service.removeItem(1);

      expect(result).toBe(true);
      expect(purchaseOrderItemRepo.manager.transaction).toHaveBeenCalled();
    });

    it('should return false if item not found', async () => {
      vi.spyOn(purchaseOrderItemRepo.manager, 'transaction').mockImplementationOnce(async (cb: any) => {
        const manager = {
          findOne: vi.fn().mockResolvedValue(null),
          save: vi.fn(),
          create: vi.fn((entity, data) => data),
          findOneBy: vi.fn(),
          find: vi.fn().mockResolvedValue([]),
          delete: vi.fn().mockResolvedValue({ affected: 0 }),
          getRepository: vi.fn(() => ({ count: vi.fn().mockResolvedValue(0) })),
        };
        return cb(manager);
      });

      await expect(service.removeItem(999)).rejects.toThrow();
    });
  });

  describe('receiveItem', () => {
    it('should receive item and update inventory', async () => {
      const mockItem = {
        id: 1,
        purchaseOrderId: 1,
        productId: 10,
        quantity: 100,
        quantityReceived: 0,
        purchaseOrder: { id: 1, supplierId: 5 },
      };

      vi.spyOn(purchaseOrderItemRepo.manager, 'transaction').mockImplementationOnce(async (cb: any) => {
        const mockItem = {
          id: 1,
          purchaseOrderId: 1,
          productId: 10,
          quantityOrdered: 100,
          quantityReceived: 0,
          product: { id: 10 },
          purchaseOrder: { id: 1, supplierId: 5 },
        };
        const manager = {
          findOne: vi.fn().mockResolvedValue(mockItem),
          save: vi.fn().mockResolvedValue({ ...mockItem, quantityReceived: 50 }),
          create: vi.fn((entity: any, data: any) => data),
          findOneBy: vi.fn(),
          find: vi.fn().mockResolvedValue([{ ...mockItem, quantityReceived: 50 }]),
          delete: vi.fn().mockResolvedValue({ affected: 1 }),
          getRepository: vi.fn(() => ({ count: vi.fn().mockResolvedValue(0), save: vi.fn() })),
        };
        return cb(manager);
      });

      const receiveData = {
        itemId: 1,
        quantityReceived: 50,
      };

      const result = await service.receiveItem(receiveData as any, 1);

      expect(result.quantityReceived).toBe(50);
      expect(purchaseOrderItemRepo.manager.transaction).toHaveBeenCalled();
    });

    it('should throw error if receiving more than ordered', async () => {
      const mockItem = {
        id: 1,
        quantity: 100,
        quantityReceived: 90,
      };

      vi.spyOn(purchaseOrderItemRepo.manager, 'transaction').mockImplementationOnce(async (cb: any) => {
        const mockItem = {
          id: 1,
          quantityOrdered: 100,
          quantityReceived: 90,
          product: { id: 10 },
          purchaseOrder: { id: 1 },
        };
        const manager = {
          findOne: vi.fn().mockResolvedValue(mockItem),
          save: vi.fn(),
          create: vi.fn((entity, data) => data),
          findOneBy: vi.fn(),
          find: vi.fn().mockResolvedValue([]),
          delete: vi.fn().mockResolvedValue({ affected: 1 }),
          getRepository: vi.fn(() => ({ count: vi.fn().mockResolvedValue(0) })),
        };
        return cb(manager);
      });

      await expect(service.receiveItem({ itemId: 1, quantityReceived: 20 } as any, 1))
        .rejects.toThrow();
    });
  });

  describe('getPurchaseOrderAnalytics', () => {
    it('should calculate analytics for all suppliers', async () => {
      const mockOrders = [
        { id: 1, totalAmount: 1000, status: 'received', items: [] },
        { id: 2, totalAmount: 2000, status: 'ordered', items: [] },
      ];

      const mockQueryBuilder = {
        leftJoin: vi.fn().mockReturnThis(),
        andWhere: vi.fn().mockReturnThis(),
        getMany: vi.fn().mockResolvedValue(mockOrders),
      };
      vi.spyOn(purchaseOrderRepo, 'createQueryBuilder').mockReturnValue(mockQueryBuilder as any);

      const result = await service.getPurchaseOrderAnalytics();

      expect(result.totalOrders).toBe(2);
      expect(result.totalValue).toBe(3000);
      expect(purchaseOrderRepo.createQueryBuilder).toHaveBeenCalled();
    });

    it('should filter analytics by supplier', async () => {
      const mockOrders = [
        { id: 1, supplierId: 5, totalAmount: 1000, status: 'ordered' },
      ];

      const mockQueryBuilder = {
        leftJoin: vi.fn().mockReturnThis(),
        andWhere: vi.fn().mockReturnThis(),
        getMany: vi.fn().mockResolvedValue(mockOrders),
      };
      vi.spyOn(purchaseOrderRepo, 'createQueryBuilder').mockReturnValue(mockQueryBuilder as any);

      const result = await service.getPurchaseOrderAnalytics(5);

      expect(result.totalOrders).toBe(1);
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'po.supplierId = :supplierId',
        { supplierId: 5 }
      );
    });

    it('should filter analytics by date range', async () => {
      const mockOrders = [
        { id: 1, totalAmount: 500, orderDate: new Date('2024-06-15'), status: 'ordered' },
      ];

      const mockQueryBuilder = {
        leftJoin: vi.fn().mockReturnThis(),
        andWhere: vi.fn().mockReturnThis(),
        getMany: vi.fn().mockResolvedValue(mockOrders),
      };
      vi.spyOn(purchaseOrderRepo, 'createQueryBuilder').mockReturnValue(mockQueryBuilder as any);

      const startDate = new Date('2024-06-01');
      const endDate = new Date('2024-06-30');

      const result = await service.getPurchaseOrderAnalytics(undefined, startDate, endDate);

      expect(result.totalOrders).toBe(1);
      expect(result.totalValue).toBe(500);
    });
  });

});
