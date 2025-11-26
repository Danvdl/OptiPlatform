import { graphql } from './apiClient';
import { logError } from '../utils/frontendLogger';

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
    logError(error instanceof Error ? error : new Error('Error creating purchase order'), { context: 'createPurchaseOrder', input });
    throw error;
  }
}
