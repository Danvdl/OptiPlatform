import { describe, test, expect, vi, beforeEach } from 'vitest';
import {
  graphql,
  ApiError,
  fetchItems,
  addItem,
  updateItem,
  fetchProducts,
  createProduct,
  fetchCategories,
  createCategory,
  fetchProductNotes,
  createProductNote,
  fetchInventorySummary,
  type InventoryItem,
  type Product,
  type Category,
  type ProductNote,
} from '../inventoryApi';
import { ErrorCode } from '../errorCodes';

// Mock dependencies
vi.mock('../authStore', () => ({
  getToken: vi.fn(),
}));

import { getToken } from '../authStore';

describe('inventoryApi', () => {
  const mockFetch = vi.fn();
  
  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch = mockFetch;
    vi.mocked(getToken).mockResolvedValue('mock-token');
  });

  describe('graphql', () => {
    test('makes GraphQL request with token', async () => {
      mockFetch.mockResolvedValue({
        json: async () => ({ data: { result: 'success' } }),
      });

      await graphql('query { test }', { var: 'value' });

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/graphql'),
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
            'Authorization': 'Bearer mock-token',
          }),
          body: JSON.stringify({
            query: 'query { test }',
            variables: { var: 'value' },
          }),
        })
      );
    });

    test('makes request without token if not available', async () => {
      vi.mocked(getToken).mockResolvedValue(null);
      mockFetch.mockResolvedValue({
        json: async () => ({ data: { result: 'success' } }),
      });

      await graphql('query { test }');

      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: expect.not.objectContaining({
            Authorization: expect.any(String),
          }),
        })
      );
    });

    test('returns data from successful response', async () => {
      const mockData = { users: [{ id: 1, name: 'Test' }] };
      mockFetch.mockResolvedValue({
        json: async () => ({ data: mockData }),
      });

      const result = await graphql('query { users }');

      expect(result).toEqual(mockData);
    });

    test('throws ApiError on network error', async () => {
      mockFetch.mockRejectedValue(new Error('Network failed'));

      await expect(graphql('query { test }')).rejects.toThrow(ApiError);
      await expect(graphql('query { test }')).rejects.toMatchObject({
        code: ErrorCode.NETWORK,
        message: 'Network error',
      });
    });

    test('throws ApiError on GraphQL errors', async () => {
      mockFetch.mockResolvedValue({
        json: async () => ({
          errors: [
            {
              message: 'Field not found',
              extensions: { code: 'GRAPHQL_VALIDATION_FAILED' },
            },
          ],
        }),
      });

      await expect(graphql('query { invalid }')).rejects.toThrow(ApiError);
      await expect(graphql('query { invalid }')).rejects.toMatchObject({
        code: 'GRAPHQL_VALIDATION_FAILED',
        message: 'Field not found',
      });
    });

    test('uses UNKNOWN code if error code not provided', async () => {
      mockFetch.mockResolvedValue({
        json: async () => ({
          errors: [{ message: 'Unknown error' }],
        }),
      });

      await expect(graphql('query { test }')).rejects.toMatchObject({
        code: ErrorCode.UNKNOWN,
      });
    });
  });

  describe('fetchItems', () => {
    const mockItems: InventoryItem[] = [
      {
        id: 1,
        product: {
          id: 10,
          name: 'Product A',
          description: 'Description A',
          sku: 'SKU-001',
          unit: 'pcs',
          restockThreshold: 10,
          category: { id: 1, name: 'Category A' },
        },
        quantity: 100,
        transactionType: 'add',
        notes: 'Initial stock',
        occurredAt: '2024-01-15T00:00:00Z',
      },
    ];

    test('fetches inventory items successfully', async () => {
      mockFetch.mockResolvedValue({
        json: async () => ({ data: { transactions: mockItems } }),
      });

      const result = await fetchItems();

      expect(mockFetch).toHaveBeenCalled();
      expect(result).toEqual(mockItems);
    });
  });

  describe('addItem', () => {
    test('adds item with all parameters', async () => {
      mockFetch.mockResolvedValue({
        json: async () => ({ data: { createTransaction: { id: 1 } } }),
      });

      await addItem(10, 50, 'add', 'Test note');

      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          body: expect.stringContaining('ADD'), // Transaction type normalized to uppercase
        })
      );
    });

    test('normalizes transaction type to uppercase', async () => {
      mockFetch.mockResolvedValue({
        json: async () => ({ data: { createTransaction: { id: 1 } } }),
      });

      await addItem(10, 50, 'add');

      const callBody = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(callBody.variables.type).toBe('ADD');
    });

    test('handles hyphenated transaction types', async () => {
      mockFetch.mockResolvedValue({
        json: async () => ({ data: { createTransaction: { id: 1 } } }),
      });

      await addItem(10, 50, 'transfer-in');

      const callBody = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(callBody.variables.type).toBe('TRANSFER_IN');
    });

    test('adds item without notes', async () => {
      mockFetch.mockResolvedValue({
        json: async () => ({ data: { createTransaction: { id: 1 } } }),
      });

      await addItem(10, 50, 'remove');

      const callBody = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(callBody.variables).toMatchObject({
        productId: 10,
        quantity: 50,
        type: 'REMOVE',
      });
    });
  });

  describe('updateItem', () => {
    test('updates item with notes', async () => {
      mockFetch.mockResolvedValue({
        json: async () => ({ data: { updateTransaction: { id: 1 } } }),
      });

      await updateItem(5, 75, 'Updated note');

      const callBody = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(callBody.variables).toMatchObject({
        id: 5,
        quantity: 75,
        notes: 'Updated note',
      });
    });

    test('updates item without notes', async () => {
      mockFetch.mockResolvedValue({
        json: async () => ({ data: { updateTransaction: { id: 1 } } }),
      });

      await updateItem(5, 75);

      const callBody = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(callBody.variables).toMatchObject({
        id: 5,
        quantity: 75,
      });
    });
  });

  describe('fetchProducts', () => {
    const mockProducts: Product[] = [
      {
        id: 1,
        name: 'Product 1',
        description: 'Desc 1',
        sku: 'SKU-001',
        unit: 'pcs',
        restockThreshold: 10,
        categoryId: 1,
        createdAt: '2024-01-01T00:00:00Z',
        category: { id: 1, name: 'Cat 1', description: 'Cat Desc', createdAt: '2024-01-01T00:00:00Z' },
      },
    ];

    test('fetches products successfully', async () => {
      mockFetch.mockResolvedValue({
        json: async () => ({ data: { products: mockProducts } }),
      });

      const result = await fetchProducts();

      expect(result).toEqual(mockProducts);
    });
  });

  describe('createProduct', () => {
    test('creates product with all fields', async () => {
      mockFetch.mockResolvedValue({
        json: async () => ({ data: { createProduct: { id: 1, name: 'New Product' } } }),
      });

      await createProduct({
        name: 'New Product',
        description: 'Description',
        sku: 'SKU-NEW',
        unit: 'pcs',
        categoryId: 5,
        restockThreshold: 20,
      });

      const callBody = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(callBody.variables.data).toMatchObject({
        name: 'New Product',
        description: 'Description',
        sku: 'SKU-NEW',
        unit: 'pcs',
        categoryId: 5,
        restockThreshold: 20,
      });
    });

    test('creates product with minimal fields', async () => {
      mockFetch.mockResolvedValue({
        json: async () => ({ data: { createProduct: { id: 1, name: 'Simple' } } }),
      });

      await createProduct({ name: 'Simple' });

      const callBody = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(callBody.variables.data).toMatchObject({ name: 'Simple' });
    });
  });

  describe('fetchCategories', () => {
    const mockCategories: Category[] = [
      {
        id: 1,
        name: 'Category 1',
        description: 'Description 1',
        createdAt: '2024-01-01T00:00:00Z',
        products: [
          { id: 1, name: 'Product 1', description: 'Desc', sku: 'SKU-1', restockThreshold: 100, createdAt: '2024-01-01T00:00:00Z' },
        ],
      },
    ];

    test('fetches categories successfully', async () => {
      mockFetch.mockResolvedValue({
        json: async () => ({ data: { categories: mockCategories } }),
      });

      const result = await fetchCategories();

      expect(result).toEqual(mockCategories);
    });
  });

  describe('createCategory', () => {
    test('creates category with description', async () => {
      mockFetch.mockResolvedValue({
        json: async () => ({ data: { createCategory: { id: 1, name: 'New Cat' } } }),
      });

      await createCategory({ name: 'New Cat', description: 'New Description' });

      const callBody = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(callBody.variables.data).toMatchObject({
        name: 'New Cat',
        description: 'New Description',
      });
    });

    test('creates category without description', async () => {
      mockFetch.mockResolvedValue({
        json: async () => ({ data: { createCategory: { id: 1, name: 'Simple Cat' } } }),
      });

      await createCategory({ name: 'Simple Cat' });

      const callBody = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(callBody.variables.data.name).toBe('Simple Cat');
    });
  });

  describe('fetchProductNotes', () => {
    const mockNotes: ProductNote[] = [
      {
        id: 1,
        productId: 10,
        userId: 5,
        note: 'Test note',
        createdAt: '2024-01-15T00:00:00Z',
        product: {
          id: 10,
          name: 'Product A',
          restockThreshold: 10,
          createdAt: '2024-01-01T00:00:00Z',
        },
      },
    ];

    test('fetches product notes successfully', async () => {
      mockFetch.mockResolvedValue({
        json: async () => ({ data: { productNotes: mockNotes } }),
      });

      const result = await fetchProductNotes(10);

      expect(mockFetch).toHaveBeenCalled();
      expect(result).toEqual(mockNotes);
    });
  });

  describe('createProductNote', () => {
    test('creates product note successfully', async () => {
      mockFetch.mockResolvedValue({
        json: async () => ({ data: { createProductNote: { id: 1 } } }),
      });

      await createProductNote({ productId: 10, note: 'Important note' });

      const callBody = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(callBody.variables.data).toMatchObject({
        productId: 10,
        note: 'Important note',
      });
    });
  });

  describe('fetchInventorySummary', () => {
    const mockProducts: Product[] = [
      {
        id: 1,
        name: 'Product 1',
        restockThreshold: 50,
        createdAt: '2024-01-01T00:00:00Z',
      },
      {
        id: 2,
        name: 'Product 2',
        restockThreshold: 20,
        createdAt: '2024-01-01T00:00:00Z',
      },
    ];

    const mockCategories: Category[] = [
      { id: 1, name: 'Cat 1', createdAt: '2024-01-01T00:00:00Z' },
    ];

    const mockTransactions: InventoryItem[] = [
      {
        id: 1,
        product: { id: 1, name: 'Product 1', restockThreshold: 50 },
        quantity: 30, // Below threshold
        transactionType: 'add',
        occurredAt: '2024-01-01T00:00:00Z',
      },
      {
        id: 2,
        product: { id: 2, name: 'Product 2', restockThreshold: 20 },
        quantity: 100, // Above threshold
        transactionType: 'add',
        occurredAt: '2024-01-02T00:00:00Z',
      },
    ];

    test('fetches inventory summary successfully', async () => {
      mockFetch
        .mockResolvedValueOnce({ json: async () => ({ data: { products: mockProducts } }) })
        .mockResolvedValueOnce({ json: async () => ({ data: { categories: mockCategories } }) })
        .mockResolvedValueOnce({ json: async () => ({ data: { transactions: mockTransactions } }) });

      const result = await fetchInventorySummary();

      expect(result).toMatchObject({
        totalProducts: 2,
        totalCategories: 1,
        recentTransactions: 2,
        lowStockCount: 1,
      });
      expect(result.lowStockProducts).toHaveLength(1);
      expect(result.lowStockProducts[0]).toMatchObject({
        id: 1,
        name: 'Product 1',
        currentStock: 30,
      });
    });

    test('calculates stock levels correctly', async () => {
      const lowThresholdProduct: Product = {
        id: 1,
        name: 'Product 1',
        restockThreshold: 100, // High threshold so 80 is low stock
        createdAt: '2024-01-01T00:00:00Z',
      };

      const transactions: InventoryItem[] = [
        {
          id: 1,
          product: { id: 1, name: 'Product 1', restockThreshold: 100 },
          quantity: 100,
          transactionType: 'add',
          occurredAt: '2024-01-01T00:00:00Z',
        },
        {
          id: 2,
          product: { id: 1, name: 'Product 1', restockThreshold: 100 },
          quantity: -20,
          transactionType: 'remove',
          occurredAt: '2024-01-02T00:00:00Z',
        },
      ];

      mockFetch
        .mockResolvedValueOnce({ json: async () => ({ data: { products: [lowThresholdProduct] } }) })
        .mockResolvedValueOnce({ json: async () => ({ data: { categories: mockCategories } }) })
        .mockResolvedValueOnce({ json: async () => ({ data: { transactions } }) });

      const result = await fetchInventorySummary();

      // Stock should be 100 + (-20) = 80, which is below threshold of 100
      expect(result.lowStockProducts).toHaveLength(1);
      expect(result.lowStockProducts[0].currentStock).toBe(80);
    });
  });
});
