import { describe, test, expect, vi, beforeEach } from 'vitest';
import {
  fetchPurchaseOrders,
  createPurchaseOrder,
  type PurchaseOrder,
  type CreatePurchaseOrderInput,
} from '../purchaseOrdersService';

// Mock dependencies
vi.mock('../apiClient', () => ({
  graphql: vi.fn(),
}));

vi.mock('../../utils/frontendLogger', () => ({
  logError: vi.fn(),
}));

import { graphql } from '../apiClient';
import { logError } from '../../utils/frontendLogger';

describe('purchaseOrdersService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('fetchPurchaseOrders', () => {
    const mockOrders: PurchaseOrder[] = [
      {
        id: 1,
        poNumber: 'PO-2024-001',
        supplierId: 1,
        supplier: { id: 1, name: 'ABC Supplier' },
        status: 'pending',
        priority: 'high',
        totalAmount: 15000,
        currency: 'USD',
        orderDate: '2024-01-15T00:00:00Z',
        expectedDeliveryDate: '2024-02-01T00:00:00Z',
        items: [{ id: 1 }, { id: 2 }, { id: 3 }, { id: 4 }, { id: 5 }],
      },
      {
        id: 2,
        poNumber: 'PO-2024-002',
        supplierId: 2,
        supplier: { id: 2, name: 'XYZ Corp' },
        status: 'approved',
        priority: 'normal',
        totalAmount: 8500,
        currency: 'USD',
        orderDate: '2024-01-16T00:00:00Z',
        items: [{ id: 6 }, { id: 7 }, { id: 8 }],
      },
    ];

    test('fetches purchase orders successfully', async () => {
      vi.mocked(graphql).mockResolvedValue({ purchaseOrders: mockOrders });

      const result = await fetchPurchaseOrders();

      expect(graphql).toHaveBeenCalledWith(
        expect.stringContaining('GetPurchaseOrders')
      );
      expect(result).toEqual(mockOrders);
      expect(result).toHaveLength(2);
    });

    test('returns all purchase order fields', async () => {
      vi.mocked(graphql).mockResolvedValue({ purchaseOrders: [mockOrders[0]] });

      const result = await fetchPurchaseOrders();

      expect(result[0]).toMatchObject({
        id: 1,
        poNumber: 'PO-2024-001',
        supplierName: 'ABC Supplier',
        status: 'pending',
        priority: 'high',
        totalAmount: 15000,
        currency: 'USD',
        orderDate: '2024-01-15T00:00:00Z',
        expectedDeliveryDate: '2024-02-01T00:00:00Z',
        itemCount: 5,
      });
    });

    test('handles missing expectedDeliveryDate', async () => {
      vi.mocked(graphql).mockResolvedValue({ purchaseOrders: [mockOrders[1]] });

      const result = await fetchPurchaseOrders();

      expect(result[0].expectedDeliveryDate).toBeUndefined();
    });

    test('returns empty array on error', async () => {
      vi.mocked(graphql).mockRejectedValue(new Error('Network error'));

      const result = await fetchPurchaseOrders();

      expect(result).toEqual([]);
      expect(logError).toHaveBeenCalledWith(
        expect.any(Error),
        { context: 'fetchPurchaseOrders' }
      );
    });

    test('handles non-Error exceptions', async () => {
      vi.mocked(graphql).mockRejectedValue('String error');

      const result = await fetchPurchaseOrders();

      expect(result).toEqual([]);
      expect(logError).toHaveBeenCalledWith(
        expect.objectContaining({ message: expect.any(String) }),
        { context: 'fetchPurchaseOrders' }
      );
    });

    test('handles empty purchase orders list', async () => {
      vi.mocked(graphql).mockResolvedValue({ purchaseOrders: [] });

      const result = await fetchPurchaseOrders();

      expect(result).toEqual([]);
    });

    test('handles different priority levels', async () => {
      const priorities: Array<'low' | 'normal' | 'high' | 'urgent'> = [
        'low', 'normal', 'high', 'urgent'
      ];

      for (const priority of priorities) {
        vi.mocked(graphql).mockResolvedValue({
          purchaseOrders: [{ ...mockOrders[0], priority }],
        });

        const result = await fetchPurchaseOrders();
        expect(result[0].priority).toBe(priority);
      }
    });

    test('handles different statuses', async () => {
      const statuses = ['pending', 'approved', 'shipped', 'delivered', 'cancelled'];

      for (const status of statuses) {
        vi.mocked(graphql).mockResolvedValue({
          purchaseOrders: [{ ...mockOrders[0], status }],
        });

        const result = await fetchPurchaseOrders();
        expect(result[0].status).toBe(status);
      }
    });
  });

  describe('createPurchaseOrder', () => {
    const mockCreatedOrder: PurchaseOrder = {
      id: 10,
      poNumber: 'PO-2024-010',
      supplierId: 3,
      supplier: { id: 3, name: 'New Supplier' },
      status: 'pending',
      priority: 'urgent',
      totalAmount: 0,
      currency: 'USD',
      orderDate: '2024-01-20T00:00:00Z',
      expectedDeliveryDate: '2024-02-15T00:00:00Z',
      items: [],
    };

    test('creates purchase order successfully', async () => {
      const input: CreatePurchaseOrderInput = {
        supplierId: 3,
        priority: 'urgent',
        expectedDeliveryDate: '2024-02-15',
        items: [{ productId: 1, quantityOrdered: 10, unitPrice: 100 }],
      };

      vi.mocked(graphql).mockResolvedValue({
        createPurchaseOrder: mockCreatedOrder,
      });

      const result = await createPurchaseOrder(input);

      expect(graphql).toHaveBeenCalledWith(
        expect.stringContaining('CreatePurchaseOrder'),
        { input }
      );
      expect(result).toEqual(mockCreatedOrder);
    });

    test('creates purchase order without optional fields', async () => {
      const input: CreatePurchaseOrderInput = {
        supplierId: 3,
        priority: 'normal',
        items: [],
      };

      vi.mocked(graphql).mockResolvedValue({
        createPurchaseOrder: { ...mockCreatedOrder, priority: 'normal' },
      });

      const result = await createPurchaseOrder(input);

      expect(result.priority).toBe('normal');
    });

    test('handles all priority levels', async () => {
      const priorities: Array<'low' | 'normal' | 'high' | 'urgent'> = [
        'low', 'normal', 'high', 'urgent'
      ];

      for (const priority of priorities) {
        const input: CreatePurchaseOrderInput = {
          supplierId: 3,
          priority,
          items: [],
        };

        vi.mocked(graphql).mockResolvedValue({
          createPurchaseOrder: { ...mockCreatedOrder, priority },
        });

        const result = await createPurchaseOrder(input);
        expect(result.priority).toBe(priority);
      }
    });

    test('throws error on GraphQL failure', async () => {
      const input: CreatePurchaseOrderInput = {
        supplierId: 3,
        priority: 'high',
        items: [],
      };

      const error = new Error('GraphQL mutation failed');
      vi.mocked(graphql).mockRejectedValue(error);

      await expect(createPurchaseOrder(input)).rejects.toThrow('GraphQL mutation failed');
      expect(logError).toHaveBeenCalledWith(
        error,
        { context: 'createPurchaseOrder', input }
      );
    });

    test('logs non-Error exceptions correctly', async () => {
      const input: CreatePurchaseOrderInput = {
        supplierId: 3,
        priority: 'normal',
        items: [],
      };

      vi.mocked(graphql).mockRejectedValue('String error');

      await expect(createPurchaseOrder(input)).rejects.toBeDefined();
      expect(logError).toHaveBeenCalledWith(
        expect.objectContaining({ message: expect.any(String) }),
        { context: 'createPurchaseOrder', input }
      );
    });
  });
});
