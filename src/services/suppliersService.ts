import { graphql } from './apiClient';

export interface Supplier {
  id: number;
  name: string;
  supplierCode?: string;
  type: 'manufacturer' | 'distributor' | 'wholesaler' | 'retailer' | 'service_provider';
  status: 'active' | 'inactive' | 'suspended' | 'pending_approval';
  contactPerson?: string;
  email?: string;
  phone?: string;
  reliabilityScore?: number;
  qualityScore?: number;
  onTimeDeliveryRate?: number;
}

export interface CreateSupplierInput {
  name: string;
  supplierCode?: string;
  supplierType: 'distributor' | 'manufacturer' | 'retailer' | 'wholesaler' | 'service_provider';
  contactPerson?: string;
  email?: string;
  phone?: string;
  description?: string;
  address?: string;
  discountPercentage?: number;
  freeShippingThreshold?: number;
}

export async function fetchSuppliers(): Promise<Supplier[]> {
  const query = `
    query GetSuppliers {
      suppliers {
        id
        name
        supplierCode
        type
        status
        contactPerson
        email
        phone
        reliabilityScore
        qualityScore
        onTimeDeliveryRate
      }
    }
  `;

  try {
    const data = await graphql<{
      suppliers: Array<{
        id: number;
        name: string;
        supplierCode?: string;
        type: string;
        status: string;
        contactPerson?: string;
        email?: string;
        phone?: string;
        reliabilityScore?: number;
        qualityScore?: number;
        onTimeDeliveryRate?: number;
      }>;
    }>(query);

    return data.suppliers.map((s) => ({
      id: s.id,
      name: s.name,
      supplierCode: s.supplierCode,
      type: s.type?.toLowerCase() as Supplier['type'],
      status: s.status?.toLowerCase() as Supplier['status'],
      contactPerson: s.contactPerson,
      email: s.email,
      phone: s.phone,
      reliabilityScore: s.reliabilityScore,
      qualityScore: s.qualityScore,
      onTimeDeliveryRate: s.onTimeDeliveryRate,
    }));
  } catch (error) {
    logError(error instanceof Error ? error : new Error('Error fetching suppliers'), { context: 'fetchSuppliers' });
    return [];
  }
}

export async function createSupplier(input: CreateSupplierInput): Promise<Supplier> {
  const mutation = `
    mutation CreateSupplier($input: CreateSupplierInput!) {
      createSupplier(input: $input) {
        id
        name
        supplierCode
        type
        status
        contactPerson
        email
        phone
        description
        address
        discountPercentage
        freeShippingThreshold
        reliabilityScore
        qualityScore
        onTimeDeliveryRate
      }
    }
  `;

  try {
    const serverInput: Record<string, any> = {
      name: input.name,
      supplierCode: input.supplierCode,
      type: input.supplierType?.toUpperCase(),
      contactPerson: input.contactPerson,
      email: input.email,
      phone: input.phone,
      description: input.description,
      address: input.address,
      discountPercentage: input.discountPercentage,
      freeShippingThreshold: input.freeShippingThreshold,
    };
    const data = await graphql<{
      createSupplier: {
        id: number;
        name: string;
        supplierCode?: string;
        type: string;
        status: string;
        contactPerson?: string;
        email?: string;
        phone?: string;
        description?: string;
        address?: string;
        discountPercentage?: number;
        freeShippingThreshold?: number;
        reliabilityScore?: number;
        qualityScore?: number;
        onTimeDeliveryRate?: number;
      };
    }>(mutation, { input: serverInput });

    const s = data.createSupplier;
    return {
      id: s.id,
      name: s.name,
      supplierCode: s.supplierCode,
      type: s.type.toLowerCase() as Supplier['type'],
      status: s.status.toLowerCase() as Supplier['status'],
      contactPerson: s.contactPerson,
      email: s.email,
      phone: s.phone,
      // forward optional fields for UI (kept as any-compatible via TS indexers on consumer if needed)
      // @ts-ignore
      description: s.description,
      // @ts-ignore
      address: s.address,
      // @ts-ignore
      discountPercentage: s.discountPercentage,
      // @ts-ignore
      freeShippingThreshold: s.freeShippingThreshold,
      reliabilityScore: s.reliabilityScore,
      qualityScore: s.qualityScore,
      onTimeDeliveryRate: s.onTimeDeliveryRate,
    };
  } catch (error) {
    logError(error instanceof Error ? error : new Error('Error creating supplier'), { context: 'createSupplier', input });
    throw error;
  }
}
