import { graphql } from './apiClient';
import { logError } from '../utils/frontendLogger';

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

export async function fetchAdvancedTransactions(): Promise<AdvancedTransaction[]> {
  const query = `
    query GetAdvancedTransactions {
      transactions {
        id
        product { name }
        transactionType
        quantity
        unitCost
        totalCost
        reasonCode
        status
        occurredAt
        fromLocationId
        toLocationId
        supplierName
        referenceTransactionId
      }
    }
  `;
  try {
    const data = await graphql<{
      transactions: Array<{
        id: number;
        product: { name: string };
        transactionType: string;
        quantity: number;
        unitCost?: number;
        totalCost?: number;
        reasonCode?: string;
        status: string;
        occurredAt: string;
        fromLocationId?: number;
        toLocationId?: number;
        supplierName?: string;
        referenceTransactionId?: number;
      }>;
    }>(query);

    return data.transactions.map((t) => ({
      id: t.id,
      productName: t.product?.name || '',
      type: String(t.transactionType || '').toLowerCase(),
      quantity: t.quantity,
      unitCost: t.unitCost,
      totalCost: t.totalCost,
      reason: t.reasonCode,
      status: String(t.status || '').toLowerCase(),
      occurredAt: t.occurredAt,
      fromLocation: t.fromLocationId ? `#${t.fromLocationId}` : undefined,
      toLocation: t.toLocationId ? `#${t.toLocationId}` : undefined,
      supplierName: t.supplierName,
      reference: t.referenceTransactionId ? `#${t.referenceTransactionId}` : undefined,
    }));
  } catch (error) {
    logError(error instanceof Error ? error : new Error('Error fetching transactions'), { context: 'fetchTransactions' });
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
    logError(error instanceof Error ? error : new Error('Error creating transaction'), { context: 'createTransaction', input });
    throw error;
  }
}
