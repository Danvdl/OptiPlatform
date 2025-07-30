import { getToken } from './authStore';

export interface InventoryItem {
  id: number;
  product: {
    id: number;
    name: string;
    description?: string;
    sku?: string;
    unit?: string;
    restockThreshold: number;
    category?: {
      id: number;
      name: string;
      description?: string;
    };
  };
  quantity: number;
  transactionType: string;
  notes?: string;
  occurredAt: string;
}

export interface Product {
  id: number;
  name: string;
  description?: string;
  sku?: string;
  unit?: string;
  restockThreshold: number;
  categoryId?: number;
  category?: Category;
  createdAt: string;
}

export interface Category {
  id: number;
  name: string;
  description?: string;
  createdAt: string;
  products?: Product[];
}

export interface ProductNote {
  id: number;
  productId: number;
  userId?: number;
  note: string;
  createdAt: string;
  product: Product;
}

export interface InventorySummary {
  totalProducts: number;
  totalCategories: number;
  recentTransactions: number;
  lowStockCount: number;
  lowStockProducts: Array<Product & { currentStock: number }>;
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

// Inventory Transactions
export async function fetchItems(): Promise<InventoryItem[]> {
  const query = `
    query {
      transactions {
        id
        quantity
        transactionType
        notes
        occurredAt
        product { 
          id 
          name 
          description
          sku
          unit
          restockThreshold
          category {
            id
            name
            description
          }
        }
      }
    }
  `;
  const data = await graphql<{ transactions: InventoryItem[] }>(query);
  return data.transactions;
}

export async function addItem(productId: number, quantity: number, transactionType: string, notes?: string) {
  const mutation = `
    mutation Add($productId: Int!, $quantity: Int!, $type: String!, $notes: String) {
      createTransaction(data: { 
        productId: $productId, 
        quantity: $quantity, 
        transactionType: $type,
        notes: $notes
      }) {
        id
      }
    }
  `;
  await graphql(mutation, { productId, quantity, type: transactionType, notes });
}export async function updateItem(id: number, quantity: number, notes?: string) {
  const mutation = `
    mutation Update($id: Int!, $quantity: Int!, $notes: String) {
      updateTransaction(data: { id: $id, quantity: $quantity, notes: $notes }) {
        id
      }
    }
  `;
  await graphql(mutation, { id, quantity, notes });
}

// Products
export async function fetchProducts(): Promise<Product[]> {
  const query = `
    query {
      products {
        id
        name
        description
        sku
        unit
        restockThreshold
        categoryId
        createdAt
        category {
          id
          name
          description
        }
      }
    }
  `;
  const data = await graphql<{ products: Product[] }>(query);
  return data.products;
}

export async function createProduct(product: {
  name: string;
  description?: string;
  sku?: string;
  unit?: string;
  categoryId?: number;
  restockThreshold?: number;
}) {
  const mutation = `
    mutation CreateProduct($data: CreateProductInput!) {
      createProduct(data: $data) {
        id
        name
      }
    }
  `;
  await graphql(mutation, { data: product });
}

// Categories
export async function fetchCategories(): Promise<Category[]> {
  const query = `
    query {
      categories {
        id
        name
        description
        createdAt
        products {
          id
          name
          description
          sku
        }
      }
    }
  `;
  const data = await graphql<{ categories: Category[] }>(query);
  return data.categories;
}

export async function createCategory(category: { name: string; description?: string }) {
  const mutation = `
    mutation CreateCategory($data: CreateCategoryInput!) {
      createCategory(data: $data) {
        id
        name
      }
    }
  `;
  await graphql(mutation, { data: category });
}

// Product Notes
export async function fetchProductNotes(productId: number): Promise<ProductNote[]> {
  const query = `
    query ProductNotes($productId: Int!) {
      productNotes(productId: $productId) {
        id
        note
        createdAt
        product {
          id
          name
        }
      }
    }
  `;
  const data = await graphql<{ productNotes: ProductNote[] }>(query);
  return data.productNotes;
}
export async function createProductNote(note: {
  productId: number;
  note: string;
}) {
  const mutation = `
    mutation CreateNote($data: CreateProductNoteInput!) {
      createProductNote(data: $data) {
        id
      }
    }
  `;
  await graphql(mutation, { data: note });
}

// Dashboard specific
export async function fetchInventorySummary(): Promise<InventorySummary> {
  // Note: This would ideally be a single GraphQL query, but we'll simulate it
  const [products, categories, transactions] = await Promise.all([
    fetchProducts(),
    fetchCategories(),
    fetchItems()
  ]);

  // Calculate stock levels per product
  const stockMap = new Map<number, number>();
  transactions.forEach(tx => {
    const current = stockMap.get(tx.product.id) || 0;
    stockMap.set(tx.product.id, current + tx.quantity);
  });

  const lowStockProducts = products
    .map(product => ({
      ...product,
      currentStock: stockMap.get(product.id) || 0
    }))
    .filter(product => product.currentStock < product.restockThreshold);

  return {
    totalProducts: products.length,
    totalCategories: categories.length,
    recentTransactions: transactions.length,
    lowStockCount: lowStockProducts.length,
    lowStockProducts
  };
}
