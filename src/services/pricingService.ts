import { graphql } from './apiClient';
import { fetchItems, type InventoryItem } from '../utils/inventoryApi';

export interface PricingData {
  id: number;
  productName: string;
  costPrice: number;
  sellingPrice: number;
  margin: number;
  inventoryValue: number;
  potentialRevenue: number;
}

export interface UpdateProductPricesInput {
  id: number;
  purchasePrice?: number;
  salePrice?: number;
  currency?: string;
}

export async function fetchPricingData(): Promise<PricingData[]> {
  const productsQuery = `
    query GetPricingData {
      products { id name purchasePrice salePrice }
    }
  `;

  const isAdditionType = (type: string) => {
    const t = String(type || '').toLowerCase();
    return t === 'add' || t === 'purchase' || t === 'transfer_in' || t === 'unreserve' || t === 'return_from_customer';
  };

  const prodData = await graphql<{ products: Array<{ id: number; name: string; purchasePrice?: number; salePrice?: number }> }>(productsQuery);
  const txs: InventoryItem[] = await fetchItems();
  const stockByProduct = new Map<number, number>();
  for (const t of txs) {
    const pid = t.product.id;
    const delta = (isAdditionType(t.transactionType) ? 1 : -1) * Math.abs(t.quantity);
    stockByProduct.set(pid, (stockByProduct.get(pid) || 0) + delta);
  }

  return prodData.products.map((p) => {
    const costPrice = p.purchasePrice || 0;
    const sellingPrice = p.salePrice || 0;
    const currentStock = Math.max(0, stockByProduct.get(p.id) || 0);
    const inventoryValue = costPrice * currentStock;
    const potentialRevenue = sellingPrice * currentStock;
    const margin = sellingPrice && costPrice ? ((sellingPrice - costPrice) / sellingPrice) * 100 : 0;
    return { id: p.id, productName: p.name, costPrice, sellingPrice, margin, inventoryValue, potentialRevenue };
  });
}

export async function updateProductPrices(input: UpdateProductPricesInput) {
  const mutation = `
    mutation UpdateProduct($data: UpdateProductInput!) {
      updateProduct(data: $data) { id name purchasePrice salePrice currency }
    }
  `;
  return graphql<{ updateProduct: { id: number } }>(mutation, { data: input }).then(r => r.updateProduct);
}

export interface PriceHistoryEntry {
  id: number;
  productName: string;
  priceType: 'purchase' | 'sale';
  oldPrice: number;
  newPrice: number;
  currency?: string;
  changedAt: string;
  reason?: string;
}

export async function fetchPriceHistoryByProduct(productId: number): Promise<PriceHistoryEntry[]> {
  const query = `
    query PriceHistoryByProduct($productId: Int!) {
      priceHistoryByProduct(productId: $productId) {
        id
        product { name }
        priceType
        oldPrice
        newPrice
        currency
        reason
        changedAt
      }
    }
  `;
  const data = await graphql<{ priceHistoryByProduct: Array<{ id: number; product: { name: string }; priceType: string; oldPrice: number; newPrice: number; currency?: string; reason?: string; changedAt: string; }> }>(query, { productId });
  return data.priceHistoryByProduct.map(h => ({
    id: h.id,
    productName: h.product?.name || '',
    priceType: (h.priceType === 'sale' ? 'sale' : 'purchase'),
    oldPrice: h.oldPrice,
    newPrice: h.newPrice,
    currency: h.currency,
    reason: h.reason,
    changedAt: h.changedAt,
  }));
}
