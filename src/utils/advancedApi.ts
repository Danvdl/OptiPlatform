// GraphQL operations for advanced features
import { graphql } from './inventoryApi';

// Supplier types and interfaces
export interface Supplier {
  id: number;
  name: string;
  // Optional: backend currently doesn't expose this; keep optional for UI display fallback
  supplierCode?: string;
  // Normalized to lowercase for UI convenience (backend returns enum)
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
  supplierCode?: string; // currently unused by backend
  supplierType: 'distributor' | 'manufacturer' | 'retailer' | 'wholesaler' | 'service_provider';
  contactPerson?: string;
  email?: string;
  phone?: string;
  description?: string;
  address?: string;
  discountPercentage?: number;
  freeShippingThreshold?: number;
}

// Purchase Order types and interfaces
export interface PurchaseOrder {
  id: number;
  poNumber: string;
  supplierName: string;
  status: string;
  priority: string;
  totalAmount: number;
  currency: string;
  orderDate: string;
  expectedDeliveryDate?: string;
  itemCount: number;
}

export interface CreatePurchaseOrderInput {
  supplierName: string;
  priority: 'low' | 'normal' | 'high' | 'urgent';
  expectedDeliveryDate?: string;
}

// Pricing types and interfaces
export interface PricingData {
  id: number;
  productName: string;
  costPrice: number;
  sellingPrice: number;
  margin: number;
  inventoryValue: number;
  potentialRevenue: number;
}

// Advanced Transaction types
export interface AdvancedTransaction {
  id: number;
  productName: string;
  type: string;
  quantity: number;
  unitCost?: number;
  totalCost?: number;
  reason?: string;
  status: string;
  occurredAt: string;
  fromLocation?: string;
  toLocation?: string;
  supplierName?: string;
  reference?: string;
}

export interface CreateTransactionInput {
  productName: string;
  type: string;
  quantity: number;
  reason?: string;
  fromLocation?: string;
  toLocation?: string;
}

// Supplier API functions
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
    const data = await graphql<{ suppliers: Array<{
      id: number;
      name: string;
      supplierCode?: string;
      type: string; // GraphQL enum value
      status: string; // GraphQL enum value
      contactPerson?: string;
      email?: string;
      phone?: string;
      reliabilityScore?: number;
      qualityScore?: number;
      onTimeDeliveryRate?: number;
    }> }>(query);
    // Normalize enum values to lowercase strings expected by UI
    return data.suppliers.map(s => ({
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
    console.error('Error fetching suppliers:', error);
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
    // Map UI input to backend schema (GraphQL enums are uppercase)
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
    const data = await graphql<{ createSupplier: {
      id: number; name: string; supplierCode?: string; type: string; status: string; contactPerson?: string; email?: string; phone?: string;
      description?: string; address?: string; discountPercentage?: number; freeShippingThreshold?: number;
      reliabilityScore?: number; qualityScore?: number; onTimeDeliveryRate?: number;
    } }>(mutation, { input: serverInput });
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
      // allow UI to pick up optional new fields if needed
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
    console.error('Error creating supplier:', error);
  throw error;
  }
}

// Purchase Order API functions
export async function fetchPurchaseOrders(): Promise<PurchaseOrder[]> {
  const query = `
    query GetPurchaseOrders {
      purchaseOrders {
        id
        poNumber
        supplierName
        status
        priority
        totalAmount
        currency
        orderDate
        expectedDeliveryDate
        itemCount
      }
    }
  `;
  
  try {
    const data = await graphql<{ purchaseOrders: PurchaseOrder[] }>(query);
    return data.purchaseOrders;
  } catch (error) {
    console.error('Error fetching purchase orders:', error);
  return [];
  }
}

export async function createPurchaseOrder(input: CreatePurchaseOrderInput): Promise<PurchaseOrder> {
  const mutation = `
    mutation CreatePurchaseOrder($input: CreatePurchaseOrderInput!) {
      createPurchaseOrder(input: $input) {
        id
        poNumber
        supplierName
        status
        priority
        totalAmount
        currency
        orderDate
        expectedDeliveryDate
        itemCount
      }
    }
  `;
  
  try {
    const data = await graphql<{ createPurchaseOrder: PurchaseOrder }>(mutation, { input });
    return data.createPurchaseOrder;
  } catch (error) {
    console.error('Error creating purchase order:', error);
  throw error;
  }
}

// Pricing API functions
export async function fetchPricingData(): Promise<PricingData[]> {
  const query = `
    query GetPricingData {
      products {
        id
        name
        costPrice
        sellingPrice
        currentStock
      }
    }
  `;
  
  try {
    const data = await graphql<{ products: Array<{
      id: number;
      name: string;
      costPrice?: number;
      sellingPrice?: number;
      currentStock?: number;
    }> }>(query);
    return data.products.map((product) => ({
      id: product.id,
      productName: product.name,
      costPrice: product.costPrice || 0,
      sellingPrice: product.sellingPrice || 0,
      margin: product.sellingPrice && product.costPrice 
        ? ((product.sellingPrice - product.costPrice) / product.sellingPrice * 100)
        : 0,
      inventoryValue: (product.costPrice || 0) * (product.currentStock || 0),
      potentialRevenue: (product.sellingPrice || 0) * (product.currentStock || 0)
    }));
  } catch (error) {
    console.error('Error fetching pricing data:', error);
  return [];
  }
}

// Advanced Transaction API functions
export async function fetchAdvancedTransactions(): Promise<AdvancedTransaction[]> {
  const query = `
    query GetAdvancedTransactions {
      transactions {
        id
        productName
        type
        quantity
        unitCost
        totalCost
        reason
        status
        occurredAt
        fromLocation
        toLocation
        supplierName
        reference
      }
    }
  `;
  
  try {
    const data = await graphql<{ transactions: AdvancedTransaction[] }>(query);
    return data.transactions;
  } catch (error) {
    console.error('Error fetching transactions:', error);
  return [];
  }
}

export async function createAdvancedTransaction(input: CreateTransactionInput): Promise<AdvancedTransaction> {
  const mutation = `
    mutation CreateAdvancedTransaction($input: CreateTransactionInput!) {
      createAdvancedTransaction(input: $input) {
        id
        productName
        type
        quantity
        reason
        status
        occurredAt
        fromLocation
        toLocation
      }
    }
  `;
  
  try {
    const data = await graphql<{ createAdvancedTransaction: AdvancedTransaction }>(mutation, { input });
    return data.createAdvancedTransaction;
  } catch (error) {
    console.error('Error creating transaction:', error);
    throw error;
  }
}

// Reports API
export async function fetchDashboardMetrics(periodDays: number): Promise<any> {
  const query = `
    query Dashboard($period: Int!) {
      dashboardMetrics(period: $period)
    }
  `;
  try {
    const data = await graphql<{ dashboardMetrics: string }>(query, { period: periodDays });
    return JSON.parse(data.dashboardMetrics || '{}');
  } catch (error) {
    console.error('Error fetching dashboard metrics:', error);
    return {};
  }
}
