import { Test, TestingModule } from '@nestjs/testing';
import { vi } from 'vitest';
import { SuppliersResolver } from '../src/suppliers/suppliers.resolver';
import { SuppliersService } from '../src/suppliers/suppliers.service';
import { Supplier, SupplierStatus, SupplierType } from '../src/suppliers/entities/supplier.entity';
import { SupplierProduct } from '../src/suppliers/entities/supplier-product.entity';

describe('SuppliersResolver', () => {
  let resolver: SuppliersResolver;
  let service: SuppliersService;

  const mockSupplier: Partial<Supplier> = {
    id: 1,
    name: 'Test Supplier',
    email: 'supplier@test.com',
    phone: '123-456-7890',
    address: '123 Test St',
    city: 'Test City',
    country: 'Test Country',
    contactPerson: 'John Doe',
    paymentTermsDays: 30,
    status: SupplierStatus.ACTIVE,
    type: SupplierType.DISTRIBUTOR,
    notes: 'Test notes',
    supplierProducts: [],
    purchaseOrders: [],
    createdAt: new Date(),
  };

  const mockSupplierProduct: Partial<SupplierProduct> = {
    id: 1,
    supplierId: 1,
    productId: 1,
    supplierSku: 'SUP-001',
    supplierProductName: 'Test Product',
    unitPrice: 100,
    currency: 'USD',
    minimumOrderQuantity: 10,
    leadTimeDays: 7,
    isPreferred: true,
    isActive: true,
    notes: 'Test product',
    supplier: mockSupplier as Supplier,
    product: null,
    createdAt: new Date(),
  };

  const mockSuppliersService = {
    findAllSuppliers: vi.fn(),
    findSupplier: vi.fn(),
    findActiveSuppliers: vi.fn(),
    createSupplier: vi.fn(),
    updateSupplier: vi.fn(),
    deleteSupplier: vi.fn(),
    getSupplierProducts: vi.fn(),
    getProductSuppliers: vi.fn(),
    createSupplierProduct: vi.fn(),
    updateSupplierProduct: vi.fn(),
    compareSupplierPrices: vi.fn(),
    getSupplierPerformanceMetrics: vi.fn(),
    checkLowStockProducts: vi.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SuppliersResolver,
        {
          provide: SuppliersService,
          useValue: mockSuppliersService,
        },
      ],
    }).compile();

    resolver = module.get<SuppliersResolver>(SuppliersResolver);
    service = module.get<SuppliersService>(SuppliersService);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('suppliers', () => {
    it('should return all suppliers', async () => {
      const suppliers = [mockSupplier];
      mockSuppliersService.findAllSuppliers.mockResolvedValue(suppliers);

      const result = await resolver.suppliers();

      expect(result).toEqual(suppliers);
      expect(service.findAllSuppliers).toHaveBeenCalled();
    });
  });

  describe('supplier', () => {
    it('should return a single supplier by id', async () => {
      mockSuppliersService.findSupplier.mockResolvedValue(mockSupplier);

      const result = await resolver.supplier(1);

      expect(result).toEqual(mockSupplier);
      expect(service.findSupplier).toHaveBeenCalledWith(1);
    });
  });

  describe('activeSuppliers', () => {
    it('should return only active suppliers', async () => {
      const suppliers = [mockSupplier];
      mockSuppliersService.findActiveSuppliers.mockResolvedValue(suppliers);

      const result = await resolver.activeSuppliers();

      expect(result).toEqual(suppliers);
      expect(service.findActiveSuppliers).toHaveBeenCalled();
    });
  });

  describe('createSupplier', () => {
    it('should create a new supplier', async () => {
      const input = {
        name: 'New Supplier',
        email: 'new@supplier.com',
        phone: '123-456-7890',
      };
      mockSuppliersService.createSupplier.mockResolvedValue(mockSupplier);

      const result = await resolver.createSupplier(input);

      expect(result).toEqual(mockSupplier);
      expect(service.createSupplier).toHaveBeenCalledWith(input);
    });
  });

  describe('updateSupplier', () => {
    it('should update an existing supplier', async () => {
      const input = {
        id: 1,
        name: 'Updated Supplier',
      };
      const updated = { ...mockSupplier, name: 'Updated Supplier' };
      mockSuppliersService.updateSupplier.mockResolvedValue(updated);

      const result = await resolver.updateSupplier(input);

      expect(result).toEqual(updated);
      expect(service.updateSupplier).toHaveBeenCalledWith(input);
    });
  });

  describe('deleteSupplier', () => {
    it('should delete a supplier and return true', async () => {
      mockSuppliersService.deleteSupplier.mockResolvedValue(true);

      const result = await resolver.deleteSupplier(1);

      expect(result).toBe(true);
      expect(service.deleteSupplier).toHaveBeenCalledWith(1);
    });
  });

  describe('supplierProducts', () => {
    it('should return products for a supplier', async () => {
      const products = [mockSupplierProduct as SupplierProduct];
      mockSuppliersService.getSupplierProducts.mockResolvedValue(products);

      const result = await resolver.supplierProducts(1);

      expect(result).toEqual(products);
      expect(service.getSupplierProducts).toHaveBeenCalledWith(1);
    });
  });

  describe('productSuppliers', () => {
    it('should return suppliers for a product', async () => {
      const products = [mockSupplierProduct as SupplierProduct];
      mockSuppliersService.getProductSuppliers.mockResolvedValue(products);

      const result = await resolver.productSuppliers(1);

      expect(result).toEqual(products);
      expect(service.getProductSuppliers).toHaveBeenCalledWith(1);
    });
  });

  describe('createSupplierProduct', () => {
    it('should create a product for a supplier', async () => {
      const input = {
        supplierId: 1,
        productId: 1,
        unitPrice: 100,
        leadTimeDays: 7,
      };
      mockSuppliersService.createSupplierProduct.mockResolvedValue(mockSupplierProduct as SupplierProduct);

      const result = await resolver.createSupplierProduct(input);

      expect(result).toEqual(mockSupplierProduct);
      expect(service.createSupplierProduct).toHaveBeenCalledWith(input);
    });
  });

  describe('updateSupplierProduct', () => {
    it('should update a supplier product', async () => {
      const input = {
        id: 1,
        unitPrice: 120,
      };
      const updated = { ...mockSupplierProduct, unitPrice: 120 };
      mockSuppliersService.updateSupplierProduct.mockResolvedValue(updated as SupplierProduct);

      const result = await resolver.updateSupplierProduct(input);

      expect(result).toEqual(updated);
      expect(service.updateSupplierProduct).toHaveBeenCalledWith(input);
    });
  });
});

