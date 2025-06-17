import { getToken } from './authStore';

export interface InventoryItem {
  id: number;
  product: {
    id: number;
    name: string;
  };
  quantity: number;
  transactionType: string;
}

const API_URL = `${import.meta.env.VITE_BACKEND_URL}/graphql`;

async function graphql<T>(query: string, variables?: Record<string, any>): Promise<T> {
  const token = await getToken();
  const res = await fetch(API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({ query, variables }),
  });
  const json = await res.json();
  if (json.errors) {
    throw new Error(json.errors.map((e: any) => e.message).join(', '));
  }
  return json.data;
}

export async function fetchItems(): Promise<InventoryItem[]> {
  const query = `
    query {
      transactions {
        id
        quantity
        transactionType
        product { id name }
      }
    }
  `;
  const data = await graphql<{ transactions: InventoryItem[] }>(query);
  return data.transactions;
}

export async function addItem(productId: number, quantity: number, transactionType: string) {
  const mutation = `
    mutation Add($productId: Int!, $quantity: Int!, $type: String!) {
      createTransaction(data: { productId: $productId, quantity: $quantity, transactionType: $type, locationId: 1 }) {
        id
      }
    }
  `;
  await graphql(mutation, { productId, quantity, type: transactionType });
}

export async function updateItem(id: number, quantity: number) {
  const mutation = `
    mutation Update($id: Int!, $quantity: Int!) {
      updateTransaction(data: { id: $id, quantity: $quantity }) {
        id
      }
    }
  `;
  await graphql(mutation, { id, quantity });
}
