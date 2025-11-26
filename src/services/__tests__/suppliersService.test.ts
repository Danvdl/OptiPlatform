import { describe, test, expect, vi, beforeEach } from 'vitest';
import {
  fetchSuppliers,
  createSupplier,
  type Supplier,
  type CreateSupplierInput,
} from '../suppliersService';

// Mock dependencies
vi.mock('../apiClient', () => ({
  graphql: vi.fn(),
}));

vi.mock('../../utils/frontendLogger', () => ({
  logError: vi.fn(),
}));

import { graphql } from '../apiClient';
import { logError } from '../../utils/frontendLogger';

describe('suppliersService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('fetchSuppliers', () => {
    const mockSuppliers = [
      {
        id: 1,
        name: 'ABC Manufacturing',
        supplierCode: 'SUP-001',
        type: 'MANUFACTURER',
        status: 'ACTIVE',
        contactPerson: 'John Doe',
        email: 'john@abc.com',
        phone: '+1234567890',
        reliabilityScore: 95.5,
        qualityScore: 92.0,
        onTimeDeliveryRate: 98.5,
      },
      {
        id: 2,
        name: 'XYZ Distributors',
        supplierCode: 'SUP-002',
        type: 'DISTRIBUTOR',
        status: 'INACTIVE',
        reliabilityScore: 85.0,
        qualityScore: 88.0,
        onTimeDeliveryRate: 90.0,
      },
    ];

    test('fetches suppliers successfully', async () => {
      vi.mocked(graphql).mockResolvedValue({ suppliers: mockSuppliers });

      const result = await fetchSuppliers();

      expect(graphql).toHaveBeenCalledWith(
        expect.stringContaining('GetSuppliers')
      );
      expect(result).toHaveLength(2);
    });

    test('normalizes type to lowercase', async () => {
      vi.mocked(graphql).mockResolvedValue({ suppliers: mockSuppliers });

      const result = await fetchSuppliers();

      expect(result[0].type).toBe('manufacturer');
      expect(result[1].type).toBe('distributor');
    });

    test('normalizes status to lowercase', async () => {
      vi.mocked(graphql).mockResolvedValue({ suppliers: mockSuppliers });

      const result = await fetchSuppliers();

      expect(result[0].status).toBe('active');
      expect(result[1].status).toBe('inactive');
    });

    test('handles all supplier types', async () => {
      const types = ['MANUFACTURER', 'DISTRIBUTOR', 'WHOLESALER', 'RETAILER', 'SERVICE_PROVIDER'];

      for (const type of types) {
        vi.mocked(graphql).mockResolvedValue({
          suppliers: [{ ...mockSuppliers[0], type }],
        });

        const result = await fetchSuppliers();
        expect(result[0].type).toBe(type.toLowerCase());
      }
    });

    test('handles all supplier statuses', async () => {
      const statuses = ['ACTIVE', 'INACTIVE', 'SUSPENDED', 'PENDING_APPROVAL'];

      for (const status of statuses) {
        vi.mocked(graphql).mockResolvedValue({
          suppliers: [{ ...mockSuppliers[0], status }],
        });

        const result = await fetchSuppliers();
        expect(result[0].status).toBe(status.toLowerCase());
      }
    });

    test('includes all optional fields', async () => {
      vi.mocked(graphql).mockResolvedValue({ suppliers: [mockSuppliers[0]] });

      const result = await fetchSuppliers();

      expect(result[0]).toMatchObject({
        id: 1,
        name: 'ABC Manufacturing',
        supplierCode: 'SUP-001',
        contactPerson: 'John Doe',
        email: 'john@abc.com',
        phone: '+1234567890',
        reliabilityScore: 95.5,
        qualityScore: 92.0,
        onTimeDeliveryRate: 98.5,
      });
    });

    test('handles missing optional fields', async () => {
      const minimalSupplier = {
        id: 3,
        name: 'Minimal Supplier',
        type: 'WHOLESALER',
        status: 'ACTIVE',
      };

      vi.mocked(graphql).mockResolvedValue({ suppliers: [minimalSupplier] });

      const result = await fetchSuppliers();

      expect(result[0]).toMatchObject({
        id: 3,
        name: 'Minimal Supplier',
        type: 'wholesaler',
        status: 'active',
      });
      expect(result[0].supplierCode).toBeUndefined();
      expect(result[0].contactPerson).toBeUndefined();
    });

    test('returns empty array on error', async () => {
      vi.mocked(graphql).mockRejectedValue(new Error('Network error'));

      const result = await fetchSuppliers();

      expect(result).toEqual([]);
      expect(logError).toHaveBeenCalledWith(
        expect.any(Error),
        { context: 'fetchSuppliers' }
      );
    });

    test('handles non-Error exceptions', async () => {
      vi.mocked(graphql).mockRejectedValue('String error');

      const result = await fetchSuppliers();

      expect(result).toEqual([]);
      expect(logError).toHaveBeenCalledWith(
        expect.objectContaining({ message: expect.any(String) }),
        { context: 'fetchSuppliers' }
      );
    });

    test('handles empty suppliers list', async () => {
      vi.mocked(graphql).mockResolvedValue({ suppliers: [] });

      const result = await fetchSuppliers();

      expect(result).toEqual([]);
    });
  });

  describe('createSupplier', () => {
    const mockCreatedSupplier = {
      id: 10,
      name: 'New Supplier Inc',
      supplierCode: 'SUP-010',
      type: 'DISTRIBUTOR',
      status: 'PENDING_APPROVAL',
      contactPerson: 'Jane Smith',
      email: 'jane@newsupplier.com',
      phone: '+9876543210',
      description: 'A new supplier',
      address: '123 Main St',
      discountPercentage: 5,
      freeShippingThreshold: 1000,
      reliabilityScore: 0,
      qualityScore: 0,
      onTimeDeliveryRate: 0,
    };

    test('creates supplier successfully', async () => {
      const input: CreateSupplierInput = {
        name: 'New Supplier Inc',
        supplierCode: 'SUP-010',
        supplierType: 'distributor',
        contactPerson: 'Jane Smith',
        email: 'jane@newsupplier.com',
        phone: '+9876543210',
        description: 'A new supplier',
        address: '123 Main St',
        discountPercentage: 5,
        freeShippingThreshold: 1000,
      };

      vi.mocked(graphql).mockResolvedValue({
        createSupplier: mockCreatedSupplier,
      });

      const result = await createSupplier(input);

      expect(graphql).toHaveBeenCalledWith(
        expect.stringContaining('CreateSupplier'),
        expect.objectContaining({
          input: expect.objectContaining({
            name: 'New Supplier Inc',
            type: 'DISTRIBUTOR', // Should be uppercase
          }),
        })
      );
      expect(result.type).toBe('distributor'); // Response should be lowercase
    });

    test('converts supplierType to uppercase for GraphQL', async () => {
      const input: CreateSupplierInput = {
        name: 'Test Supplier',
        supplierType: 'manufacturer',
      };

      vi.mocked(graphql).mockResolvedValue({
        createSupplier: { ...mockCreatedSupplier, type: 'MANUFACTURER' },
      });

      await createSupplier(input);

      expect(graphql).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          input: expect.objectContaining({
            type: 'MANUFACTURER',
          }),
        })
      );
    });

    test('normalizes response type to lowercase', async () => {
      const input: CreateSupplierInput = {
        name: 'Test Supplier',
        supplierType: 'wholesaler',
      };

      vi.mocked(graphql).mockResolvedValue({
        createSupplier: { ...mockCreatedSupplier, type: 'WHOLESALER' },
      });

      const result = await createSupplier(input);

      expect(result.type).toBe('wholesaler');
    });

    test('normalizes response status to lowercase', async () => {
      const input: CreateSupplierInput = {
        name: 'Test Supplier',
        supplierType: 'distributor',
      };

      vi.mocked(graphql).mockResolvedValue({
        createSupplier: mockCreatedSupplier,
      });

      const result = await createSupplier(input);

      expect(result.status).toBe('pending_approval');
    });

    test('handles minimal input', async () => {
      const input: CreateSupplierInput = {
        name: 'Minimal Supplier',
        supplierType: 'retailer',
      };

      vi.mocked(graphql).mockResolvedValue({
        createSupplier: {
          id: 11,
          name: 'Minimal Supplier',
          type: 'RETAILER',
          status: 'PENDING_APPROVAL',
        },
      });

      const result = await createSupplier(input);

      expect(result).toMatchObject({
        id: 11,
        name: 'Minimal Supplier',
        type: 'retailer',
        status: 'pending_approval',
      });
    });

    test('includes all optional fields in request', async () => {
      const input: CreateSupplierInput = {
        name: 'Full Supplier',
        supplierType: 'service_provider',
        supplierCode: 'SUP-999',
        contactPerson: 'Bob Johnson',
        email: 'bob@example.com',
        phone: '+1111111111',
        description: 'Full description',
        address: '456 Elm St',
        discountPercentage: 10,
        freeShippingThreshold: 500,
      };

      vi.mocked(graphql).mockResolvedValue({
        createSupplier: { ...mockCreatedSupplier, type: 'SERVICE_PROVIDER' },
      });

      await createSupplier(input);

      expect(graphql).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          input: expect.objectContaining({
            name: 'Full Supplier',
            supplierCode: 'SUP-999',
            contactPerson: 'Bob Johnson',
            email: 'bob@example.com',
            phone: '+1111111111',
            description: 'Full description',
            address: '456 Elm St',
            discountPercentage: 10,
            freeShippingThreshold: 500,
          }),
        })
      );
    });

    test('throws error on GraphQL failure', async () => {
      const input: CreateSupplierInput = {
        name: 'Failed Supplier',
        supplierType: 'distributor',
      };

      const error = new Error('GraphQL mutation failed');
      vi.mocked(graphql).mockRejectedValue(error);

      await expect(createSupplier(input)).rejects.toThrow('GraphQL mutation failed');
      expect(logError).toHaveBeenCalledWith(
        error,
        { context: 'createSupplier', input }
      );
    });

    test('handles non-Error exceptions', async () => {
      const input: CreateSupplierInput = {
        name: 'Test',
        supplierType: 'manufacturer',
      };

      vi.mocked(graphql).mockRejectedValue('String error');

      await expect(createSupplier(input)).rejects.toBeDefined();
      expect(logError).toHaveBeenCalledWith(
        expect.objectContaining({ message: expect.any(String) }),
        { context: 'createSupplier', input }
      );
    });
  });
});
