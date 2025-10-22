import { Test, TestingModule } from '@nestjs/testing';
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
            createProduct: jest.fn(),
            updateProduct: jest.fn(),
            removeProduct: jest.fn(),
            findAllProducts: jest.fn(),
            findProduct: jest.fn(),
            getProductProfitability: jest.fn(),
            getTopProfitableProducts: jest.fn(),
            getInventoryValuation: jest.fn(),
          },
        },
      ],
    }).compile();

    resolver = module.get<ProductResolver>(ProductResolver);
    service = module.get<InventoryService>(InventoryService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(resolver).toBeDefined();
  });

  describe('createProduct', () => {
    it('should create a product', async () => {
      const mockProduct = { id: 1, name: 'Test Product', sku: 'TEST-001' };
      const createProductInput = { name: 'Test Product', sku: 'TEST-001' };

      jest.spyOn(service, 'createProduct').mockResolvedValue(mockProduct as any);

      const result = await resolver.createProduct(createProductInput as any);

      expect(result).toEqual(mockProduct);
      expect(service.createProduct).toHaveBeenCalledWith(createProductInput);
    });
  });

  describe('updateProduct', () => {
    it('should update a product', async () => {
      const mockProduct = { id: 1, name: 'Updated Product' };
      const updateProductInput = { id: 1, name: 'Updated Product' };

      jest.spyOn(service, 'updateProduct').mockResolvedValue(mockProduct as any);

      const result = await resolver.updateProduct(updateProductInput as any);

      expect(result).toEqual(mockProduct);
      expect(service.updateProduct).toHaveBeenCalledWith(updateProductInput);
    });
  });

  describe('removeProduct', () => {
    it('should remove a product', async () => {
      jest.spyOn(service, 'removeProduct').mockResolvedValue(undefined);

      const result = await resolver.removeProduct(1);

      expect(result).toBe(true);
      expect(service.removeProduct).toHaveBeenCalledWith(1);
    });
  });

  describe('products', () => {
    it('should return all products', async () => {
      const mockProducts = [
        { id: 1, name: 'Product 1' },
        { id: 2, name: 'Product 2' },
      ];

      jest.spyOn(service, 'findAllProducts').mockResolvedValue(mockProducts as any);

      const result = await resolver.products();

      expect(result).toEqual(mockProducts);
      expect(service.findAllProducts).toHaveBeenCalled();
    });
  });

  describe('product', () => {
    it('should return a single product', async () => {
      const mockProduct = { id: 1, name: 'Test Product' };

      jest.spyOn(service, 'findProduct').mockResolvedValue(mockProduct as any);

      const result = await resolver.product(1);

      expect(result).toEqual(mockProduct);
      expect(service.findProduct).toHaveBeenCalledWith(1);
    });
  });

  describe('productProfitability', () => {
    it('should return product profitability', async () => {
      const mockProfitability = { profit: 1000, margin: 0.25 };

      jest.spyOn(service, 'getProductProfitability').mockResolvedValue(mockProfitability as any);

      const result = await resolver.productProfitability(1);

      expect(result).toBeDefined();
      expect(service.getProductProfitability).toHaveBeenCalledWith(1);
    });
  });

  describe('topProfitableProducts', () => {
    it('should return top profitable products', async () => {
      const mockProducts = [
        { id: 1, name: 'Product 1', profit: 1000 },
        { id: 2, name: 'Product 2', profit: 800 },
      ];

      jest.spyOn(service, 'getTopProfitableProducts').mockResolvedValue(mockProducts as any);

      const result = await resolver.topProfitableProducts(10);

      expect(result).toBeDefined();
      expect(service.getTopProfitableProducts).toHaveBeenCalledWith(10);
    });
  });

  describe('inventoryValuation', () => {
    it('should return inventory valuation', async () => {
      const mockValuation = { total: 50000, byCategory: {} };

      jest.spyOn(service, 'getInventoryValuation').mockResolvedValue(mockValuation as any);

      const result = await resolver.inventoryValuation();

      expect(result).toBeDefined();
      expect(service.getInventoryValuation).toHaveBeenCalled();
    });
  });
});
