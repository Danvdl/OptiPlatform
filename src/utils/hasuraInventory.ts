export interface InventoryItem {
  id: number;
  product: {
    id: number;
    name: string;
  };
  quantity: number;
  transaction_type: string;
}

const HASURA_URL = import.meta.env.VITE_HASURA_URL;
const ADMIN_SECRET = import.meta.env.VITE_HASURA_ADMIN_SECRET;

async function graphql<T>(query: string, variables?: Record<string, any>): Promise<T> {
  const res = await fetch(HASURA_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-hasura-admin-secret': ADMIN_SECRET,
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
      inventory_transactions(order_by: {occurred_at: desc}) {
        id
        quantity
        transaction_type
        product {
          id
          name
        }
      }
    }
  `;
  const data = await graphql<{ inventory_transactions: InventoryItem[] }>(query);
  return data.inventory_transactions;
}

export async function addItem(productId: number, quantity: number, transactionType: string) {
  const mutation = `
    mutation InsertTx($productId: Int!, $quantity: Int!, $type: String!) {
      insert_inventory_transactions_one(object: {product_id: $productId, quantity: $quantity, transaction_type: $type}) {
        id
      }
    }
  `;
  await graphql(mutation, { productId, quantity, type: transactionType });
}

export async function updateItem(id: number, quantity: number) {
  const mutation = `
    mutation UpdateTx($id: Int!, $quantity: Int!) {
      update_inventory_transactions_by_pk(pk_columns: {id: $id}, _set: {quantity: $quantity}) {
        id
      }
    }
  `;
  await graphql(mutation, { id, quantity });
}
