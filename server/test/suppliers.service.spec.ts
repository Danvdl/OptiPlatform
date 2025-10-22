import { Test, TestingModule } from '@nestjs/testing';
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
            find: jest.fn(),
            findOne: jest.fn(),
            findOneBy: jest.fn(),
            save: jest.fn(),
            delete: jest.fn(),
            create: jest.fn(),
            count: jest.fn().mockResolvedValue(0),
            manager: {
              transaction: jest.fn((cb) => cb({
                save: jest.fn((entity) => Promise.resolve(entity)),
                findOne: jest.fn(),
              })),
            },
          },
        },
        {
          provide: getRepositoryToken(SupplierProduct),
          useValue: {
            find: jest.fn(),
            findOne: jest.fn(),
            save: jest.fn(),
            create: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(PurchaseOrder),
          useValue: {
            find: jest.fn(),
            findOne: jest.fn(),
            save: jest.fn(),
            create: jest.fn(),
            count: jest.fn().mockResolvedValue(0),
          },
        },
        {
          provide: getRepositoryToken(PurchaseOrderItem),
          useValue: {
            find: jest.fn(),
            findOne: jest.fn(),
            save: jest.fn(),
            create: jest.fn(),
            manager: {
              transaction: jest.fn((cb) => cb({
                save: jest.fn((entity) => Promise.resolve(entity)),
                findOne: jest.fn(),
              })),
            },
          },
        },
        {
          provide: getRepositoryToken(Product),
          useValue: {
            findOne: jest.fn(),
            find: jest.fn(),
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

    service = module.get<SuppliersService>(SuppliersService);
    supplierRepo = module.get<Repository<Supplier>>(getRepositoryToken(Supplier));
    supplierProductRepo = module.get<Repository<SupplierProduct>>(getRepositoryToken(SupplierProduct));
    purchaseOrderRepo = module.get<Repository<PurchaseOrder>>(getRepositoryToken(PurchaseOrder));
    purchaseOrderItemRepo = module.get<Repository<PurchaseOrderItem>>(getRepositoryToken(PurchaseOrderItem));
    productRepo = module.get<Repository<Product>>(getRepositoryToken(Product));
    inventoryTransactionRepo = module.get<Repository<InventoryTransaction>>(getRepositoryToken(InventoryTransaction));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createSupplier', () => {
    it('should create a new supplier', async () => {
      const supplierData = {
        name: 'Test Supplier',
        contactPerson: 'John Doe',
        email: 'test@supplier.com',
        phone: '123-456-7890',
      };

      const mockSupplier = { id: 1, ...supplierData, isActive: true };
      jest.spyOn(supplierRepo, 'save').mockResolvedValue(mockSupplier as any);

      const result = await service.createSupplier(supplierData);

      expect(result).toBeDefined();
      expect(supplierRepo.save).toHaveBeenCalled();
    });
  });

  describe('findAllSuppliers', () => {
    it('should return all suppliers', async () => {
      const mockSuppliers = [
        { id: 1, name: 'Supplier 1', isActive: true },
        { id: 2, name: 'Supplier 2', isActive: true },
      ];

      jest.spyOn(supplierRepo, 'find').mockResolvedValue(mockSuppliers as any);

      const result = await service.findAllSuppliers();

      expect(result).toEqual(mockSuppliers);
      expect(supplierRepo.find).toHaveBeenCalled();
    });
  });

  describe('findSupplier', () => {
    it('should find a supplier by id', async () => {
      const mockSupplier = { id: 1, name: 'Test Supplier' };
      jest.spyOn(supplierRepo, 'findOne').mockResolvedValue(mockSupplier as any);

      const result = await service.findSupplier(1);

      expect(result).toEqual(mockSupplier);
      expect(supplierRepo.findOne).toHaveBeenCalled();
    });
  });

  describe('findActiveSuppliers', () => {
    it('should return only active suppliers', async () => {
      const mockSuppliers = [
        { id: 1, name: 'Active Supplier 1', isActive: true },
        { id: 2, name: 'Active Supplier 2', isActive: true },
      ];

      jest.spyOn(supplierRepo, 'find').mockResolvedValue(mockSuppliers as any);

      const result = await service.findActiveSuppliers();

      expect(result).toEqual(mockSuppliers);
      expect(supplierRepo.find).toHaveBeenCalled();
    });
  });

  describe('updateSupplier', () => {
    it('should update supplier information', async () => {
      const updateData = {
        id: 1,
        name: 'Updated Supplier',
      };

      const existingSupplier = { id: 1, name: 'Old Name' };
      const updatedSupplier = { id: 1, name: 'Updated Supplier' };

      jest.spyOn(supplierRepo, 'findOne').mockResolvedValue(existingSupplier as any);
      jest.spyOn(supplierRepo, 'findOneBy').mockResolvedValue(existingSupplier as any);
      jest.spyOn(supplierRepo, 'save').mockResolvedValue(updatedSupplier as any);

      const result = await service.updateSupplier(updateData);

      expect(result).toEqual(updatedSupplier);
      expect(supplierRepo.save).toHaveBeenCalled();
    });
  });

  describe('deleteSupplier', () => {
    it('should delete a supplier', async () => {
      jest.spyOn(supplierRepo, 'delete').mockResolvedValue({ affected: 1, raw: {} } as any);

      const result = await service.deleteSupplier(1);

      expect(result).toBe(true);
      expect(supplierRepo.delete).toHaveBeenCalledWith(1);
    });

    it('should return false when supplier not found', async () => {
      jest.spyOn(supplierRepo, 'delete').mockResolvedValue({ affected: 0, raw: {} } as any);

      const result = await service.deleteSupplier(999);

      expect(result).toBe(false);
    });
  });

  describe('getSupplierProducts', () => {
    it('should get products for a supplier', async () => {
      const mockProducts = [
        { id: 1, supplierId: 1, productId: 10, price: 50 },
        { id: 2, supplierId: 1, productId: 11, price: 75 },
      ];

      jest.spyOn(supplierProductRepo, 'find').mockResolvedValue(mockProducts as any);

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

      jest.spyOn(supplierProductRepo, 'find').mockResolvedValue(mockSuppliers as any);

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

      jest.spyOn(purchaseOrderRepo, 'find').mockResolvedValue(mockOrders as any);

      const result = await service.findAllPurchaseOrders();

      expect(result).toEqual(mockOrders);
      expect(purchaseOrderRepo.find).toHaveBeenCalled();
    });
  });

  describe('findPurchaseOrder', () => {
    it('should find a purchase order by id', async () => {
      const mockOrder = { id: 1, orderNumber: 'PO-001' };
      jest.spyOn(purchaseOrderRepo, 'findOne').mockResolvedValue(mockOrder as any);

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

      jest.spyOn(purchaseOrderRepo, 'find').mockResolvedValue(mockOrders as any);

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

      jest.spyOn(purchaseOrderRepo, 'find').mockResolvedValue(mockOrders as any);

      const result = await service.findPurchaseOrdersBySupplier(1);

      expect(result).toEqual(mockOrders);
      expect(purchaseOrderRepo.find).toHaveBeenCalled();
    });
  });
});
