import { Test, TestingModule } from '@nestjs/testing';
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
            find: jest.fn(),
            findOne: jest.fn(),
            save: jest.fn(),
            create: jest.fn(),
            manager: {
              transaction: jest.fn((cb) => cb({
                save: jest.fn((entity) => Promise.resolve(entity)),
                findOne: jest.fn(),
                findOneBy: jest.fn(),
              })),
            },
          },
        },
        {
          provide: getRepositoryToken(PurchaseOrderItem),
          useValue: {
            find: jest.fn(),
            findOne: jest.fn(),
            save: jest.fn(),
            create: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(Supplier),
          useValue: {
            findOne: jest.fn(),
            findOneBy: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(Product),
          useValue: {
            findOne: jest.fn(),
            findOneBy: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(InventoryTransaction),
          useValue: {
            save: jest.fn(),
            create: jest.fn(),
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
    jest.clearAllMocks();
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

      jest.spyOn(purchaseOrderRepo, 'find').mockResolvedValue(mockOrders as any);

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
      
      jest.spyOn(purchaseOrderRepo, 'findOne').mockResolvedValue(mockOrder as any);

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

      jest.spyOn(purchaseOrderRepo, 'find').mockResolvedValue(mockOrders as any);

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

      jest.spyOn(purchaseOrderRepo, 'find').mockResolvedValue(mockOrders as any);

      const result = await service.findBySupplier(1);

      expect(result).toEqual(mockOrders);
      expect(purchaseOrderRepo.find).toHaveBeenCalled();
    });
  });

});
