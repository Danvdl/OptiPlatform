import { graphql } from './apiClient';
import { logError } from '../utils/frontendLogger';

export interface PurchaseOrder {
  id: number;
  poNumber: string;
  supplierId: number;
  supplier?: {
    id: number;
    name: string;
  };
  status: string;
  priority: string;
  totalAmount: number;
  currency: string;
  orderDate: string;
  expectedDeliveryDate?: string;
  items: Array<{ id: number }>;
}

export interface CreatePurchaseOrderInput {
  supplierId: number;
  priority: 'low' | 'normal' | 'high' | 'urgent';
  expectedDeliveryDate?: string;
  items: Array<{
    productId: number;
    quantityOrdered: number;
    unitPrice: number;
  }>;
}

export async function fetchPurchaseOrders(): Promise<PurchaseOrder[]> {
  const query = `
    query GetPurchaseOrders {
      purchaseOrders {
        id
        poNumber
        supplierId
        supplier {
          id
          name
        }
        status
        priority
        totalAmount
        currency
        orderDate
        expectedDeliveryDate
        items {
          id
        }
      }
    }
  `;
  try {
    const data = await graphql<{ purchaseOrders: PurchaseOrder[] }>(query);
    return data.purchaseOrders;
  } catch (error) {
    logError(error instanceof Error ? error : new Error('Error fetching purchase orders'), { context: 'fetchPurchaseOrders' });
    return [];
  }
}

export async function createPurchaseOrder(input: CreatePurchaseOrderInput): Promise<PurchaseOrder> {
  const mutation = `
    mutation CreatePurchaseOrder($input: CreatePurchaseOrderInput!) {
      createPurchaseOrder(input: $input) {
        id
        poNumber
        supplierId
        supplier {
          id
          name
        }
        status
        priority
        totalAmount
        currency
        orderDate
        expectedDeliveryDate
        items {
          id
        }
      }
    }
  `;
  try {
    const data = await graphql<{ createPurchaseOrder: PurchaseOrder }>(mutation, { input });
    return data.createPurchaseOrder;
  } catch (error) {
    logError(error instanceof Error ? error : new Error('Error creating purchase order'), { context: 'createPurchaseOrder', input });
    throw error;
  }
}
