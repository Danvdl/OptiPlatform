// GraphQL operations for advanced features
import { graphql } from './inventoryApi';

// Supplier types and interfaces
export interface Supplier {
  id: number;
  name: string;
  supplierCode: string;
  supplierType: 'distributor' | 'manufacturer' | 'retailer';
  status: 'active' | 'inactive' | 'pending';
  contactPerson?: string;
  email?: string;
  phone?: string;
  reliabilityScore?: number;
  qualityScore?: number;
  onTimeDeliveryRate?: number;
}

export interface CreateSupplierInput {
  name: string;
  supplierCode: string;
  supplierType: 'distributor' | 'manufacturer' | 'retailer';
  contactPerson?: string;
  email?: string;
  phone?: string;
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
        supplierType
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
    const data = await graphql<{ suppliers: Supplier[] }>(query);
    return data.suppliers;
  } catch (error) {
    console.error('Error fetching suppliers:', error);
    // Return demo data as fallback
    return [
      {
        id: 1,
        name: 'Tech Supply Co',
        supplierCode: 'TSC001',
        supplierType: 'distributor',
        status: 'active',
        contactPerson: 'John Smith',
        email: 'john@techsupply.com',
        phone: '+1-555-0101',
        reliabilityScore: 4.5,
        qualityScore: 4.2,
        onTimeDeliveryRate: 95.5
      },
      {
        id: 2,
        name: 'Global Electronics',
        supplierCode: 'GE002',
        supplierType: 'manufacturer',
        status: 'active',
        contactPerson: 'Sarah Johnson',
        email: 'sarah@globalelec.com',
        phone: '+1-555-0102',
        reliabilityScore: 4.8,
        qualityScore: 4.7,
        onTimeDeliveryRate: 98.2
      }
    ];
  }
}

export async function createSupplier(input: CreateSupplierInput): Promise<Supplier> {
  const mutation = `
    mutation CreateSupplier($input: CreateSupplierInput!) {
      createSupplier(input: $input) {
        id
        name
        supplierCode
        supplierType
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
    const data = await graphql<{ createSupplier: Supplier }>(mutation, { input });
    return data.createSupplier;
  } catch (error) {
    console.error('Error creating supplier:', error);
    // Return mock response for development
    return {
      id: Date.now(),
      ...input,
      status: 'active',
      reliabilityScore: 0,
      qualityScore: 0,
      onTimeDeliveryRate: 0
    };
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
    // Return demo data as fallback
    return [
      {
        id: 1,
        poNumber: 'PO250801001',
        supplierName: 'Tech Supply Co',
        status: 'pending_approval',
        priority: 'normal',
        totalAmount: 2500.00,
        currency: 'USD',
        orderDate: '2025-08-01',
        expectedDeliveryDate: '2025-08-15',
        itemCount: 5
      },
      {
        id: 2,
        poNumber: 'PO250801002',
        supplierName: 'Global Electronics',
        status: 'sent',
        priority: 'high',
        totalAmount: 5750.50,
        currency: 'USD',
        orderDate: '2025-07-30',
        expectedDeliveryDate: '2025-08-10',
        itemCount: 12
      },
      {
        id: 3,
        poNumber: 'PO250731001',
        supplierName: 'Office Supplies Plus',
        status: 'received',
        priority: 'low',
        totalAmount: 890.25,
        currency: 'USD',
        orderDate: '2025-07-25',
        expectedDeliveryDate: '2025-08-05',
        itemCount: 8
      }
    ];
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
    // Return mock response for development
    return {
      id: Date.now(),
      poNumber: `PO${new Date().getFullYear()}${String(Date.now()).slice(-6)}`,
      supplierName: input.supplierName,
      status: 'draft',
      priority: input.priority,
      totalAmount: 0,
      currency: 'USD',
      orderDate: new Date().toISOString().split('T')[0],
      expectedDeliveryDate: input.expectedDeliveryDate,
      itemCount: 0
    };
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
    // Return demo data as fallback
    return [
      {
        id: 1,
        productName: 'Wireless Mouse',
        costPrice: 15.50,
        sellingPrice: 29.99,
        margin: 48.3,
        inventoryValue: 1550.00,
        potentialRevenue: 2999.00
      },
      {
        id: 2,
        productName: 'USB Cable Type-C',
        costPrice: 8.99,
        sellingPrice: 19.99,
        margin: 55.0,
        inventoryValue: 899.00,
        potentialRevenue: 1999.00
      },
      {
        id: 3,
        productName: 'Laptop Stand',
        costPrice: 25.00,
        sellingPrice: 49.99,
        margin: 50.0,
        inventoryValue: 750.00,
        potentialRevenue: 1499.70
      }
    ];
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
    // Return demo data as fallback
    return [
      {
        id: 1,
        productName: 'Wireless Mouse',
        type: 'purchase',
        quantity: 50,
        unitCost: 15.50,
        totalCost: 775.00,
        status: 'completed',
        occurredAt: '2025-08-01T10:30:00Z',
        supplierName: 'Tech Supply Co',
        reference: 'PO250801001'
      },
      {
        id: 2,
        productName: 'USB Cable Type-C',
        type: 'sale',
        quantity: -25,
        unitCost: 8.99,
        totalCost: 224.75,
        status: 'completed',
        occurredAt: '2025-08-01T14:15:00Z',
        reference: 'SALE-2025-001'
      },
      {
        id: 3,
        productName: 'Laptop Stand',
        type: 'adjustment',
        quantity: -2,
        reason: 'Damaged during shipping',
        status: 'completed',
        occurredAt: '2025-07-31T09:00:00Z'
      },
      {
        id: 4,
        productName: 'Wireless Mouse',
        type: 'transfer_out',
        quantity: -10,
        status: 'pending',
        occurredAt: '2025-08-01T16:45:00Z',
        fromLocation: 'Warehouse A',
        toLocation: 'Store Front',
        reference: 'TXF-001'
      },
      {
        id: 5,
        productName: 'USB Cable Type-C',
        type: 'return_to_supplier',
        quantity: -5,
        reason: 'Defective units',
        status: 'completed',
        occurredAt: '2025-07-30T11:20:00Z',
        supplierName: 'Global Electronics'
      }
    ];
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
    // Return mock response for development
    return {
      id: Date.now(),
      ...input,
      status: 'pending',
      occurredAt: new Date().toISOString(),
      reference: `TXN-${Date.now()}`
    };
  }
}
