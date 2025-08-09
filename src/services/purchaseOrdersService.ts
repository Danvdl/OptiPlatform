import { graphql } from './apiClient';

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
