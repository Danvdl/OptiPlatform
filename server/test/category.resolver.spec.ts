import { Test, TestingModule } from '@nestjs/testing';
import { vi } from 'vitest';
import { CategoryResolver } from '../src/inventory/category.resolver';
import { InventoryService } from '../src/inventory/inventory.service';
import { Category } from '../src/inventory/entities/category.entity';

describe('CategoryResolver', () => {
  let resolver: CategoryResolver;
  let service: InventoryService;

  const mockCategory: Category = {
    id: 1,
    name: 'Electronics',
    description: 'Electronic devices',
    products: [],
    createdAt: new Date(),
  };

  const mockInventoryService = {
    findAllCategories: vi.fn(),
    findCategory: vi.fn(),
    createCategory: vi.fn(),
    updateCategory: vi.fn(),
    removeCategory: vi.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CategoryResolver,
        {
          provide: InventoryService,
          useValue: mockInventoryService,
        },
      ],
    }).compile();

    resolver = module.get<CategoryResolver>(CategoryResolver);
    service = module.get<InventoryService>(InventoryService);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('categories', () => {
    it('should return an array of categories', async () => {
      const categories = [mockCategory];
      mockInventoryService.findAllCategories.mockResolvedValue(categories);

      const result = await resolver.categories();

      expect(result).toEqual(categories);
      expect(service.findAllCategories).toHaveBeenCalled();
    });
  });

  describe('category', () => {
    it('should return a single category by id', async () => {
      mockInventoryService.findCategory.mockResolvedValue(mockCategory);

      const result = await resolver.category(1);

      expect(result).toEqual(mockCategory);
      expect(service.findCategory).toHaveBeenCalledWith(1);
    });
  });

  describe('createCategory', () => {
    it('should create a new category', async () => {
      const input = { name: 'Electronics', description: 'Electronic devices' };
      mockInventoryService.createCategory.mockResolvedValue(mockCategory);

      const result = await resolver.createCategory(input);

      expect(result).toEqual(mockCategory);
      expect(service.createCategory).toHaveBeenCalledWith(input);
    });
  });

  describe('updateCategory', () => {
    it('should update an existing category', async () => {
      const input = { id: 1, name: 'Updated Electronics' };
      const updated = { ...mockCategory, name: 'Updated Electronics' };
      mockInventoryService.updateCategory.mockResolvedValue(updated);

      const result = await resolver.updateCategory(input);

      expect(result).toEqual(updated);
      expect(service.updateCategory).toHaveBeenCalledWith(input);
    });
  });

  describe('removeCategory', () => {
    it('should remove a category and return true', async () => {
      mockInventoryService.removeCategory.mockResolvedValue(undefined);

      const result = await resolver.removeCategory(1);

      expect(result).toBe(true);
      expect(service.removeCategory).toHaveBeenCalledWith(1);
    });
  });

  describe('testCreateCategory', () => {
    it('should create a test category without auth', async () => {
      mockInventoryService.createCategory.mockResolvedValue(mockCategory);

      const result = await resolver.testCreateCategory('Test Category');

      expect(result).toEqual(mockCategory);
      expect(service.createCategory).toHaveBeenCalledWith({
        name: 'Test Category',
        description: 'Test category from API',
      });
    });
  });
});
