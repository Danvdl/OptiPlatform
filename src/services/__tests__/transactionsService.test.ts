import { describe, test, expect, vi, beforeEach } from 'vitest';
import {
  fetchAdvancedTransactions,
  createAdvancedTransaction,
  type AdvancedTransaction,
  type CreateTransactionInput,
} from '../transactionsService';

// Mock dependencies
vi.mock('../apiClient', () => ({
  graphql: vi.fn(),
}));

vi.mock('../../utils/frontendLogger', () => ({
  logError: vi.fn(),
}));

import { graphql } from '../apiClient';
import { logError } from '../../utils/frontendLogger';

describe('transactionsService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('fetchAdvancedTransactions', () => {
    const mockGraphQLResponse = [
      {
        id: 1,
        product: { name: 'Product A' },
        transactionType: 'PURCHASE',
        quantity: 100,
        unitCost: 10.5,
        totalCost: 1050,
        reasonCode: 'RESTOCK',
        status: 'COMPLETED',
        occurredAt: '2024-01-15T10:30:00Z',
        fromLocationId: 5,
        toLocationId: 10,
        supplierName: 'ABC Supplier',
        referenceTransactionId: 123,
      },
      {
        id: 2,
        product: { name: 'Product B' },
        transactionType: 'SALE',
        quantity: 50,
        status: 'PENDING',
        occurredAt: '2024-01-16T14:00:00Z',
      },
    ];

    test('fetches advanced transactions successfully', async () => {
      vi.mocked(graphql).mockResolvedValue({
        transactions: mockGraphQLResponse,
      });

      const result = await fetchAdvancedTransactions();

      expect(graphql).toHaveBeenCalledWith(
        expect.stringContaining('GetAdvancedTransactions')
      );
      expect(result).toHaveLength(2);
    });

    test('maps transaction fields correctly', async () => {
      vi.mocked(graphql).mockResolvedValue({
        transactions: [mockGraphQLResponse[0]],
      });

      const result = await fetchAdvancedTransactions();

      expect(result[0]).toMatchObject({
        id: 1,
        productName: 'Product A',
        type: 'purchase', // Lowercase
        quantity: 100,
        unitCost: 10.5,
        totalCost: 1050,
        reason: 'RESTOCK',
        status: 'completed', // Lowercase
        occurredAt: '2024-01-15T10:30:00Z',
        fromLocation: '#5',
        toLocation: '#10',
        supplierName: 'ABC Supplier',
        reference: '#123',
      });
    });

    test('normalizes transactionType to lowercase', async () => {
      const types = ['PURCHASE', 'SALE', 'TRANSFER', 'ADJUSTMENT'];

      for (const type of types) {
        vi.mocked(graphql).mockResolvedValue({
          transactions: [{ ...mockGraphQLResponse[0], transactionType: type }],
        });

        const result = await fetchAdvancedTransactions();
        expect(result[0].type).toBe(type.toLowerCase());
      }
    });

    test('normalizes status to lowercase', async () => {
      const statuses = ['PENDING', 'COMPLETED', 'CANCELLED', 'FAILED'];

      for (const status of statuses) {
        vi.mocked(graphql).mockResolvedValue({
          transactions: [{ ...mockGraphQLResponse[0], status }],
        });

        const result = await fetchAdvancedTransactions();
        expect(result[0].status).toBe(status.toLowerCase());
      }
    });

    test('handles missing product name', async () => {
      vi.mocked(graphql).mockResolvedValue({
        transactions: [{
          ...mockGraphQLResponse[0],
          product: null,
        }],
      });

      const result = await fetchAdvancedTransactions();

      expect(result[0].productName).toBe('');
    });

    test('handles missing optional fields', async () => {
      vi.mocked(graphql).mockResolvedValue({
        transactions: [mockGraphQLResponse[1]],
      });

      const result = await fetchAdvancedTransactions();

      expect(result[0]).toMatchObject({
        id: 2,
        productName: 'Product B',
        type: 'sale',
        quantity: 50,
        status: 'pending',
        occurredAt: '2024-01-16T14:00:00Z',
      });
      expect(result[0].unitCost).toBeUndefined();
      expect(result[0].totalCost).toBeUndefined();
      expect(result[0].reason).toBeUndefined();
      expect(result[0].fromLocation).toBeUndefined();
      expect(result[0].toLocation).toBeUndefined();
      expect(result[0].supplierName).toBeUndefined();
      expect(result[0].reference).toBeUndefined();
    });

    test('formats location IDs with hash prefix', async () => {
      vi.mocked(graphql).mockResolvedValue({
        transactions: [{
          ...mockGraphQLResponse[0],
          fromLocationId: 42,
          toLocationId: 99,
        }],
      });

      const result = await fetchAdvancedTransactions();

      expect(result[0].fromLocation).toBe('#42');
      expect(result[0].toLocation).toBe('#99');
    });

    test('formats reference transaction ID with hash prefix', async () => {
      vi.mocked(graphql).mockResolvedValue({
        transactions: [{
          ...mockGraphQLResponse[0],
          referenceTransactionId: 456,
        }],
      });

      const result = await fetchAdvancedTransactions();

      expect(result[0].reference).toBe('#456');
    });

    test('returns empty array on error', async () => {
      vi.mocked(graphql).mockRejectedValue(new Error('Network error'));

      const result = await fetchAdvancedTransactions();

      expect(result).toEqual([]);
      expect(logError).toHaveBeenCalledWith(
        expect.any(Error),
        { context: 'fetchTransactions' }
      );
    });

    test('handles non-Error exceptions', async () => {
      vi.mocked(graphql).mockRejectedValue('String error');

      const result = await fetchAdvancedTransactions();

      expect(result).toEqual([]);
      expect(logError).toHaveBeenCalledWith(
        expect.objectContaining({ message: expect.any(String) }),
        { context: 'fetchTransactions' }
      );
    });

    test('handles empty transactions list', async () => {
      vi.mocked(graphql).mockResolvedValue({ transactions: [] });

      const result = await fetchAdvancedTransactions();

      expect(result).toEqual([]);
    });

    test('handles null/undefined transactionType gracefully', async () => {
      vi.mocked(graphql).mockResolvedValue({
        transactions: [{
          ...mockGraphQLResponse[0],
          transactionType: null,
        }],
      });

      const result = await fetchAdvancedTransactions();

      expect(result[0].type).toBe('');
    });

    test('handles null/undefined status gracefully', async () => {
      vi.mocked(graphql).mockResolvedValue({
        transactions: [{
          ...mockGraphQLResponse[0],
          status: null,
        }],
      });

      const result = await fetchAdvancedTransactions();

      expect(result[0].status).toBe('');
    });
  });

  describe('createAdvancedTransaction', () => {
    const mockCreatedTransaction: AdvancedTransaction = {
      id: 100,
      productName: 'New Product',
      type: 'purchase',
      quantity: 200,
      reason: 'Initial stock',
      status: 'pending',
      occurredAt: '2024-01-20T00:00:00Z',
      fromLocation: 'Warehouse A',
      toLocation: 'Store B',
    };

    test('creates advanced transaction successfully', async () => {
      const input: CreateTransactionInput = {
        productName: 'New Product',
        type: 'purchase',
        quantity: 200,
        reason: 'Initial stock',
        fromLocation: 'Warehouse A',
        toLocation: 'Store B',
      };

      vi.mocked(graphql).mockResolvedValue({
        createAdvancedTransaction: mockCreatedTransaction,
      });

      const result = await createAdvancedTransaction(input);

      expect(graphql).toHaveBeenCalledWith(
        expect.stringContaining('CreateAdvancedTransaction'),
        { input }
      );
      expect(result).toEqual(mockCreatedTransaction);
    });

    test('creates transaction with minimal input', async () => {
      const input: CreateTransactionInput = {
        productName: 'Product X',
        type: 'sale',
        quantity: 10,
      };

      vi.mocked(graphql).mockResolvedValue({
        createAdvancedTransaction: {
          ...mockCreatedTransaction,
          type: 'sale',
          quantity: 10,
        },
      });

      const result = await createAdvancedTransaction(input);

      expect(result.quantity).toBe(10);
      expect(result.type).toBe('sale');
    });

    test('includes all optional fields when provided', async () => {
      const input: CreateTransactionInput = {
        productName: 'Full Transaction',
        type: 'transfer',
        quantity: 50,
        reason: 'Inventory adjustment',
        fromLocation: 'Location A',
        toLocation: 'Location B',
      };

      vi.mocked(graphql).mockResolvedValue({
        createAdvancedTransaction: mockCreatedTransaction,
      });

      await createAdvancedTransaction(input);

      expect(graphql).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          input: expect.objectContaining({
            productName: 'Full Transaction',
            type: 'transfer',
            quantity: 50,
            reason: 'Inventory adjustment',
            fromLocation: 'Location A',
            toLocation: 'Location B',
          }),
        })
      );
    });

    test('throws error on GraphQL failure', async () => {
      const input: CreateTransactionInput = {
        productName: 'Failed Transaction',
        type: 'purchase',
        quantity: 100,
      };

      const error = new Error('GraphQL mutation failed');
      vi.mocked(graphql).mockRejectedValue(error);

      await expect(createAdvancedTransaction(input)).rejects.toThrow(
        'GraphQL mutation failed'
      );
      expect(logError).toHaveBeenCalledWith(
        error,
        { context: 'createTransaction', input }
      );
    });

    test('handles non-Error exceptions', async () => {
      const input: CreateTransactionInput = {
        productName: 'Test',
        type: 'sale',
        quantity: 1,
      };

      vi.mocked(graphql).mockRejectedValue('String error');

      await expect(createAdvancedTransaction(input)).rejects.toBeDefined();
      expect(logError).toHaveBeenCalledWith(
        expect.objectContaining({ message: expect.any(String) }),
        { context: 'createTransaction', input }
      );
    });
  });
});
