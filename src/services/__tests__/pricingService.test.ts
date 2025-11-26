import { describe, test, expect, vi, beforeEach } from 'vitest';
import {
  fetchPricingData,
  updateProductPrices,
  fetchPriceHistoryByProduct,
  type PricingData,
  type UpdateProductPricesInput,
  type PriceHistoryEntry,
} from '../pricingService';

// Mock dependencies
vi.mock('../apiClient', () => ({
  graphql: vi.fn(),
}));

vi.mock('../../utils/inventoryApi', () => ({
  fetchItems: vi.fn(),
}));

import { graphql } from '../apiClient';
import { fetchItems } from '../../utils/inventoryApi';

describe('pricingService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('fetchPricingData', () => {
    const mockProducts = [
      { id: 1, name: 'Product A', purchasePrice: 10, salePrice: 15 },
      { id: 2, name: 'Product B', purchasePrice: 20, salePrice: 30 },
      { id: 3, name: 'Product C', purchasePrice: 0, salePrice: 0 },
    ];

    const mockTransactions = [
      { product: { id: 1 }, transactionType: 'add', quantity: 100 },
      { product: { id: 1 }, transactionType: 'remove', quantity: 20 },
      { product: { id: 2 }, transactionType: 'purchase', quantity: 50 },
      { product: { id: 2 }, transactionType: 'sale', quantity: 10 },
    ];

    test('fetches and calculates pricing data correctly', async () => {
      vi.mocked(graphql).mockResolvedValue({ products: mockProducts });
      vi.mocked(fetchItems).mockResolvedValue(mockTransactions as any);

      const result = await fetchPricingData();

      expect(result).toHaveLength(3);
      expect(result[0]).toMatchObject({
        id: 1,
        productName: 'Product A',
        costPrice: 10,
        sellingPrice: 15,
      });
    });

    test('calculates stock levels correctly for addition transactions', async () => {
      vi.mocked(graphql).mockResolvedValue({ products: mockProducts });
      vi.mocked(fetchItems).mockResolvedValue(mockTransactions as any);

      const result = await fetchPricingData();

      // Product 1: 100 added - 20 removed = 80 stock
      expect(result[0].inventoryValue).toBe(10 * 80); // 800
      expect(result[0].potentialRevenue).toBe(15 * 80); // 1200
    });

    test('calculates margin percentage correctly', async () => {
      vi.mocked(graphql).mockResolvedValue({ products: mockProducts });
      vi.mocked(fetchItems).mockResolvedValue([]);

      const result = await fetchPricingData();

      // Product A: ((15 - 10) / 15) * 100 = 33.33%
      expect(result[0].margin).toBeCloseTo(33.33, 1);
      
      // Product B: ((30 - 20) / 30) * 100 = 33.33%
      expect(result[1].margin).toBeCloseTo(33.33, 1);
    });

    test('handles zero prices correctly', async () => {
      vi.mocked(graphql).mockResolvedValue({ products: mockProducts });
      vi.mocked(fetchItems).mockResolvedValue([]);

      const result = await fetchPricingData();

      // Product C has zero prices
      expect(result[2].margin).toBe(0);
      expect(result[2].inventoryValue).toBe(0);
      expect(result[2].potentialRevenue).toBe(0);
    });

    test('handles products without prices', async () => {
      const productsWithoutPrices = [
        { id: 1, name: 'Product A' },
      ];
      
      vi.mocked(graphql).mockResolvedValue({ products: productsWithoutPrices });
      vi.mocked(fetchItems).mockResolvedValue([]);

      const result = await fetchPricingData();

      expect(result[0].costPrice).toBe(0);
      expect(result[0].sellingPrice).toBe(0);
      expect(result[0].margin).toBe(0);
    });

    test('handles different transaction types correctly', async () => {
      const transactions = [
        { product: { id: 1 }, transactionType: 'add', quantity: 10 },
        { product: { id: 1 }, transactionType: 'purchase', quantity: 20 },
        { product: { id: 1 }, transactionType: 'transfer_in', quantity: 15 },
        { product: { id: 1 }, transactionType: 'unreserve', quantity: 5 },
        { product: { id: 1 }, transactionType: 'return_from_customer', quantity: 8 },
        { product: { id: 1 }, transactionType: 'sale', quantity: 12 },
        { product: { id: 1 }, transactionType: 'remove', quantity: 6 },
      ];

      vi.mocked(graphql).mockResolvedValue({ products: [mockProducts[0]] });
      vi.mocked(fetchItems).mockResolvedValue(transactions as any);

      const result = await fetchPricingData();

      // Addition types: 10 + 20 + 15 + 5 + 8 = 58
      // Subtraction types: 12 + 6 = 18
      // Net: 58 - 18 = 40
      expect(result[0].inventoryValue).toBe(10 * 40);
    });

    test('prevents negative stock levels', async () => {
      const transactions = [
        { product: { id: 1 }, transactionType: 'add', quantity: 10 },
        { product: { id: 1 }, transactionType: 'sale', quantity: 50 }, // More than available
      ];

      vi.mocked(graphql).mockResolvedValue({ products: [mockProducts[0]] });
      vi.mocked(fetchItems).mockResolvedValue(transactions as any);

      const result = await fetchPricingData();

      // Should be max(0, 10 - 50) = 0
      expect(result[0].inventoryValue).toBe(0);
      expect(result[0].potentialRevenue).toBe(0);
    });

    test('handles products with no transactions', async () => {
      vi.mocked(graphql).mockResolvedValue({ products: mockProducts });
      vi.mocked(fetchItems).mockResolvedValue([]);

      const result = await fetchPricingData();

      result.forEach(product => {
        expect(product.inventoryValue).toBe(0);
        expect(product.potentialRevenue).toBe(0);
      });
    });
  });

  describe('updateProductPrices', () => {
    test('updates product prices successfully', async () => {
      const input: UpdateProductPricesInput = {
        id: 1,
        purchasePrice: 15,
        salePrice: 25,
        currency: 'USD',
      };

      const mockResponse = {
        id: 1,
        name: 'Product A',
        purchasePrice: 15,
        salePrice: 25,
        currency: 'USD',
      };

      vi.mocked(graphql).mockResolvedValue({ updateProduct: mockResponse });

      const result = await updateProductPrices(input);

      expect(graphql).toHaveBeenCalledWith(
        expect.stringContaining('UpdateProduct'),
        { data: input }
      );
      expect(result).toEqual(mockResponse);
    });

    test('updates only purchase price', async () => {
      const input: UpdateProductPricesInput = {
        id: 1,
        purchasePrice: 12,
      };

      vi.mocked(graphql).mockResolvedValue({
        updateProduct: { id: 1 },
      });

      await updateProductPrices(input);

      expect(graphql).toHaveBeenCalledWith(
        expect.any(String),
        { data: input }
      );
    });

    test('updates only sale price', async () => {
      const input: UpdateProductPricesInput = {
        id: 1,
        salePrice: 20,
      };

      vi.mocked(graphql).mockResolvedValue({
        updateProduct: { id: 1 },
      });

      await updateProductPrices(input);

      expect(graphql).toHaveBeenCalledWith(
        expect.any(String),
        { data: input }
      );
    });

    test('handles GraphQL errors', async () => {
      const input: UpdateProductPricesInput = {
        id: 1,
        purchasePrice: 15,
      };

      vi.mocked(graphql).mockRejectedValue(new Error('Update failed'));

      await expect(updateProductPrices(input)).rejects.toThrow('Update failed');
    });
  });

  describe('fetchPriceHistoryByProduct', () => {
    const mockHistory = [
      {
        id: 1,
        product: { name: 'Product A' },
        priceType: 'sale',
        oldPrice: 20,
        newPrice: 25,
        currency: 'USD',
        reason: 'Market adjustment',
        changedAt: '2024-01-01T00:00:00Z',
      },
      {
        id: 2,
        product: { name: 'Product A' },
        priceType: 'purchase',
        oldPrice: 10,
        newPrice: 12,
        currency: 'USD',
        reason: 'Supplier increase',
        changedAt: '2024-01-02T00:00:00Z',
      },
    ];

    test('fetches price history successfully', async () => {
      vi.mocked(graphql).mockResolvedValue({
        priceHistoryByProduct: mockHistory,
      });

      const result = await fetchPriceHistoryByProduct(1);

      expect(graphql).toHaveBeenCalledWith(
        expect.stringContaining('PriceHistoryByProduct'),
        { productId: 1 }
      );
      expect(result).toHaveLength(2);
    });

    test('maps response to PriceHistoryEntry format', async () => {
      vi.mocked(graphql).mockResolvedValue({
        priceHistoryByProduct: mockHistory,
      });

      const result = await fetchPriceHistoryByProduct(1);

      expect(result[0]).toEqual({
        id: 1,
        productName: 'Product A',
        priceType: 'sale',
        oldPrice: 20,
        newPrice: 25,
        currency: 'USD',
        reason: 'Market adjustment',
        changedAt: '2024-01-01T00:00:00Z',
      });
    });

    test('handles missing product name', async () => {
      const historyWithoutName = [
        {
          id: 1,
          product: null,
          priceType: 'sale',
          oldPrice: 20,
          newPrice: 25,
          changedAt: '2024-01-01T00:00:00Z',
        },
      ];

      vi.mocked(graphql).mockResolvedValue({
        priceHistoryByProduct: historyWithoutName,
      });

      const result = await fetchPriceHistoryByProduct(1);

      expect(result[0].productName).toBe('');
    });

    test('normalizes price type to sale or purchase', async () => {
      const historyWithVariousTypes = [
        { ...mockHistory[0], priceType: 'sale' },
        { ...mockHistory[1], priceType: 'purchase' },
        { ...mockHistory[0], id: 3, priceType: 'other' },
      ];

      vi.mocked(graphql).mockResolvedValue({
        priceHistoryByProduct: historyWithVariousTypes,
      });

      const result = await fetchPriceHistoryByProduct(1);

      expect(result[0].priceType).toBe('sale');
      expect(result[1].priceType).toBe('purchase');
      expect(result[2].priceType).toBe('purchase'); // Default to purchase
    });

    test('handles empty history', async () => {
      vi.mocked(graphql).mockResolvedValue({
        priceHistoryByProduct: [],
      });

      const result = await fetchPriceHistoryByProduct(1);

      expect(result).toEqual([]);
    });

    test('handles optional fields', async () => {
      const historyWithoutOptionals = [
        {
          id: 1,
          product: { name: 'Product A' },
          priceType: 'sale',
          oldPrice: 20,
          newPrice: 25,
          changedAt: '2024-01-01T00:00:00Z',
        },
      ];

      vi.mocked(graphql).mockResolvedValue({
        priceHistoryByProduct: historyWithoutOptionals,
      });

      const result = await fetchPriceHistoryByProduct(1);

      expect(result[0].currency).toBeUndefined();
      expect(result[0].reason).toBeUndefined();
    });
  });
});
