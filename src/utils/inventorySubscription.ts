import { createClient } from 'graphql-ws';
import { InventoryItem } from './hasuraInventory';

const client = createClient({
  url: 'ws://localhost:8080/v1/graphql',
  connectionParams: {
    headers: {
      'x-hasura-admin-secret': 'secretKey',
    },
  },
});

export function subscribeInventory(onData: (item: InventoryItem) => void) {
  const query = `
    subscription LatestTx {
      inventory_transactions(order_by: {occurred_at: desc}, limit: 1) {
        id
        quantity
        transaction_type
        product { id name }
      }
    }
  `;

  return client.subscribe({ query }, {
    next: (val) => {
      const item = val.data?.inventory_transactions?.[0];
      if (item) onData(item as InventoryItem);
    },
    error: (err) => console.error('subscription error', err),
    complete: () => {},
  });
}
