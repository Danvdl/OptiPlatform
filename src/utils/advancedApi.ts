// Compatibility barrel: re-export per-feature services to preserve existing imports while we migrate
export type { Supplier, CreateSupplierInput } from '../services/suppliersService';
export { fetchSuppliers, createSupplier } from '../services/suppliersService';

export type { PurchaseOrder, CreatePurchaseOrderInput } from '../services/purchaseOrdersService';
export { fetchPurchaseOrders, createPurchaseOrder } from '../services/purchaseOrdersService';

export type { PricingData, UpdateProductPricesInput, PriceHistoryEntry } from '../services/pricingService';
export { fetchPricingData, updateProductPrices, fetchPriceHistoryByProduct } from '../services/pricingService';

export type { AdvancedTransaction, CreateTransactionInput } from '../services/transactionsService';
export { fetchAdvancedTransactions, createAdvancedTransaction } from '../services/transactionsService';

// Reports moved to services/reportsService
