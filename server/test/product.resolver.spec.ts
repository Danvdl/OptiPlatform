// @ts-nocheck
import { Test, TestingModule } from '@nestjs/testing';
import { vi } from 'vitest';
import { ProductResolver } from '../src/inventory/product.resolver';
import { InventoryService } from '../src/inventory/inventory.service';

describe('ProductResolver', () => {
  let resolver: ProductResolver;
  let service: InventoryService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProductResolver,
        {
          provide: InventoryService,
          useValue: {
            createProduct: vi.fn(),
            updateProduct: vi.fn(),
            removeProduct: vi.fn(),
            findAllProducts: vi.fn(),
            findProduct: vi.fn(),
            getProductProfitability: vi.fn(),
            getTopProfitableProducts: vi.fn(),
            getInventoryValuation: vi.fn(),
          },
        },
      ],
    }).compile();

    resolver = module.get<ProductResolver>(ProductResolver);
    service = module.get<InventoryService>(InventoryService);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should be defined', () => {
    expect(resolver).toBeDefined();
  });

  describe('createProduct', () => {
    it('should create a product', async () => {
      const tenantId = 'test-tenant-123';
      const mockProduct = { id: 1, name: 'Test Product', sku: 'TEST-001' };
      const createProductInput = { name: 'Test Product', sku: 'TEST-001' };

      vi.spyOn(service, 'createProduct').mockResolvedValue(mockProduct as any);

      const result = await resolver.createProduct(createProductInput as any, tenantId);

      expect(result).toEqual(mockProduct);
      expect(service.createProduct).toHaveBeenCalledWith(createProductInput, tenantId);
    });
  });

  describe('updateProduct', () => {
    it('should update a product', async () => {
      const tenantId = 'test-tenant-123';
      const mockProduct = { id: 1, name: 'Updated Product' };
      const updateProductInput = { id: 1, name: 'Updated Product' };

      vi.spyOn(service, 'updateProduct').mockResolvedValue(mockProduct as any);

      const result = await resolver.updateProduct(updateProductInput as any, tenantId);

      expect(result).toEqual(mockProduct);
      expect(service.updateProduct).toHaveBeenCalledWith(updateProductInput, tenantId);
    });
  });

  describe('removeProduct', () => {
    it('should remove a product', async () => {
      const tenantId = 'test-tenant-123';
      vi.spyOn(service, 'removeProduct').mockResolvedValue(undefined);

      const result = await resolver.removeProduct(1, tenantId);

      expect(result).toBe(true);
      expect(service.removeProduct).toHaveBeenCalledWith(1, tenantId);
    });
  });

  describe('products', () => {
    it('should return all products', async () => {
      const tenantId = 'test-tenant-123';
      const mockProducts = [
        { id: 1, name: 'Product 1' },
        { id: 2, name: 'Product 2' },
      ];

      vi.spyOn(service, 'findAllProducts').mockResolvedValue(mockProducts as any);

      const result = await resolver.products(tenantId);

      expect(result).toEqual(mockProducts);
      expect(service.findAllProducts).toHaveBeenCalledWith(tenantId);
    });
  });

  describe('product', () => {
    it('should return a single product', async () => {
      const tenantId = 'test-tenant-123';
      const mockProduct = { id: 1, name: 'Test Product' };

      vi.spyOn(service, 'findProduct').mockResolvedValue(mockProduct as any);

      const result = await resolver.product(1, tenantId);

      expect(result).toEqual(mockProduct);
      expect(service.findProduct).toHaveBeenCalledWith(1, tenantId);
    });
  });

  describe('productProfitability', () => {
    it('should return product profitability', async () => {
      const tenantId = 'test-tenant-123';
      const mockProfitability = { profit: 1000, margin: 0.25 };

      vi.spyOn(service, 'getProductProfitability').mockResolvedValue(mockProfitability as any);

      const result = await resolver.productProfitability(1, tenantId);

      expect(result).toBeDefined();
      expect(service.getProductProfitability).toHaveBeenCalledWith(1, tenantId);
    });
  });

  describe('topProfitableProducts', () => {
    it('should return top profitable products', async () => {
      const tenantId = 'test-tenant-123';
      const mockProducts = [
        { id: 1, name: 'Product 1', profit: 1000 },
        { id: 2, name: 'Product 2', profit: 800 },
      ];

      vi.spyOn(service, 'getTopProfitableProducts').mockResolvedValue(mockProducts as any);

      const result = await resolver.topProfitableProducts(10, tenantId);

      expect(result).toBeDefined();
      expect(service.getTopProfitableProducts).toHaveBeenCalledWith(10, tenantId);
    });
  });

  describe('inventoryValuation', () => {
    it('should return inventory valuation', async () => {
      const tenantId = 'test-tenant-123';
      const mockValuation = { total: 50000, byCategory: {} };

      vi.spyOn(service, 'getInventoryValuation').mockResolvedValue(mockValuation as any);

      const result = await resolver.inventoryValuation(tenantId);

      expect(result).toBeDefined();
      expect(service.getInventoryValuation).toHaveBeenCalledWith(tenantId);
    });
  });
});
