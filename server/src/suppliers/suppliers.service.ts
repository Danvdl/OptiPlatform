import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, EntityManager } from 'typeorm';
import { Supplier, SupplierStatus } from './entities/supplier.entity';
import { SupplierProduct } from './entities/supplier-product.entity';
import { PurchaseOrder, PurchaseOrderStatus } from './entities/purchase-order.entity';
import { PurchaseOrderItem, PurchaseOrderItemStatus } from './entities/purchase-order-item.entity';
import { Product } from '../inventory/entities/product.entity';
import { InventoryTransaction } from '../inventory/entities/inventory-transaction.entity';
import { CreateSupplierInput, UpdateSupplierInput } from './dto/supplier.input';
import { CreateSupplierProductInput, UpdateSupplierProductInput, SupplierPriceComparisonInput } from './dto/supplier-product.input';
import { CreatePurchaseOrderInput, UpdatePurchaseOrderInput, ReceivePurchaseOrderItemInput, AutoRestockSettingsInput } from './dto/purchase-order.input';
import { AppError, ErrorCode } from '../errors/error-codes';
import { DatabaseErrorHandler, HandleDatabaseErrors } from '../errors/database-error-handler';

@Injectable()
export class SuppliersService {
  constructor(
    @InjectRepository(Supplier)
    private suppliers: Repository<Supplier>,
    @InjectRepository(SupplierProduct)
    private supplierProducts: Repository<SupplierProduct>,
    @InjectRepository(PurchaseOrder)
    private purchaseOrders: Repository<PurchaseOrder>,
    @InjectRepository(PurchaseOrderItem)
    private purchaseOrderItems: Repository<PurchaseOrderItem>,
    @InjectRepository(Product)
    private products: Repository<Product>,
    @InjectRepository(InventoryTransaction)
    private inventoryTransactions: Repository<InventoryTransaction>,
  ) {}

  // Supplier Management

  @HandleDatabaseErrors()
  async createSupplier(data: CreateSupplierInput): Promise<Supplier> {
    DatabaseErrorHandler.validateEntity(data, ['name']);
    
    const supplier = this.suppliers.create(data);
    return await this.suppliers.save(supplier);
  }

  @HandleDatabaseErrors()
  async updateSupplier(data: UpdateSupplierInput): Promise<Supplier> {
    const supplier = await this.suppliers.findOneBy({ id: data.id });
    if (!supplier) {
      throw new AppError(ErrorCode.NOT_FOUND, 'Supplier not found');
    }

    Object.assign(supplier, data);
    supplier.updatedAt = new Date();
    
    return await this.suppliers.save(supplier);
  }

  async findAllSuppliers(): Promise<Supplier[]> {
    return await this.suppliers.find({
      relations: ['supplierProducts', 'purchaseOrders'],
      order: { name: 'ASC' }
    });
  }

  async findSupplier(id: number): Promise<Supplier> {
    const supplier = await this.suppliers.findOne({
      where: { id },
      relations: ['supplierProducts', 'supplierProducts.product', 'purchaseOrders']
    });

    if (!supplier) {
      throw new AppError(ErrorCode.NOT_FOUND, 'Supplier not found');
    }

    return supplier;
  }

  async findActiveSuppliers(): Promise<Supplier[]> {
    return await this.suppliers.find({
      where: { status: SupplierStatus.ACTIVE },
      relations: ['supplierProducts'],
      order: { name: 'ASC' }
    });
  }

  @HandleDatabaseErrors()
  async deleteSupplier(id: number): Promise<boolean> {
    // Check if supplier has active purchase orders
    const activePOs = await this.purchaseOrders.count({
      where: { 
        supplierId: id, 
        status: ['pending_approval', 'approved', 'sent', 'acknowledged', 'partially_received'] as any
      }
    });

    if (activePOs > 0) {
      throw new AppError(
        ErrorCode.VALIDATION, 
        'Cannot delete supplier with active purchase orders'
      );
    }

    const result = await this.suppliers.delete(id);
    return result.affected > 0;
  }

  // Supplier Product Management

  @HandleDatabaseErrors()
  async createSupplierProduct(data: CreateSupplierProductInput): Promise<SupplierProduct> {
    DatabaseErrorHandler.validateEntity(data, ['supplierId', 'productId', 'unitPrice']);

    // Validate supplier and product exist
    const supplier = await this.suppliers.findOneBy({ id: data.supplierId });
    if (!supplier) {
      throw new AppError(ErrorCode.NOT_FOUND, 'Supplier not found');
    }

    const product = await this.products.findOneBy({ id: data.productId });
    if (!product) {
      throw new AppError(ErrorCode.NOT_FOUND, 'Product not found');
    }

    // Check if supplier product already exists
    const existing = await this.supplierProducts.findOne({
      where: { supplierId: data.supplierId, productId: data.productId }
    });

    if (existing) {
      throw new AppError(
        ErrorCode.VALIDATION, 
        'Supplier product relationship already exists'
      );
    }

    const supplierProduct = this.supplierProducts.create({
      ...data,
      lastPriceUpdate: new Date()
    });

    return await this.supplierProducts.save(supplierProduct);
  }

  @HandleDatabaseErrors()
  async updateSupplierProduct(data: UpdateSupplierProductInput): Promise<SupplierProduct> {
    const supplierProduct = await this.supplierProducts.findOneBy({ id: data.id });
    if (!supplierProduct) {
      throw new AppError(ErrorCode.NOT_FOUND, 'Supplier product not found');
    }

    const oldPrice = supplierProduct.unitPrice;
    Object.assign(supplierProduct, data);
    
    // Update price change date if price changed
    if (data.unitPrice && data.unitPrice !== oldPrice) {
      supplierProduct.lastPriceUpdate = new Date();
    }
    
    supplierProduct.updatedAt = new Date();
    
    return await this.supplierProducts.save(supplierProduct);
  }

  async getSupplierProducts(supplierId: number): Promise<SupplierProduct[]> {
    return await this.supplierProducts.find({
      where: { supplierId },
      relations: ['product'],
      order: { isPreferred: 'DESC', unitPrice: 'ASC' }
    });
  }

  async getProductSuppliers(productId: number): Promise<SupplierProduct[]> {
    return await this.supplierProducts.find({
      where: { productId, isActive: true },
      relations: ['supplier'],
      order: { isPreferred: 'DESC', unitPrice: 'ASC' }
    });
  }

  // Supplier Price Comparison

  async compareSupplierPrices(data: SupplierPriceComparisonInput) {
    const queryBuilder = this.supplierProducts
      .createQueryBuilder('sp')
      .innerJoin('sp.supplier', 's')
      .innerJoin('sp.product', 'p')
      .where('sp.productId = :productId', { productId: data.productId });

    if (!data.includeInactive) {
      queryBuilder.andWhere('sp.isActive = true AND s.status = :status', { status: 'active' });
    }

    const supplierProducts = await queryBuilder
      .orderBy('sp.isPreferred', 'DESC')
      .addOrderBy('sp.unitPrice', 'ASC')
      .getMany();

    const quantity = data.quantity || 1;
    
    return supplierProducts.map(sp => {
      const basePrice = sp.unitPrice * quantity;
      const discountAmount = sp.discountPercentage ? (basePrice * sp.discountPercentage / 100) : 0;
      const finalPrice = basePrice - discountAmount;
      
      return {
        supplierId: sp.supplierId,
        supplierName: sp.supplier.name,
        supplierSku: sp.supplierSku,
        unitPrice: sp.unitPrice,
        quantity,
        basePrice,
        discountPercentage: sp.discountPercentage || 0,
        discountAmount,
        finalPrice,
        leadTimeDays: sp.leadTimeDays || sp.supplier.leadTimeDays,
        minimumOrderQuantity: sp.minimumOrderQuantity,
        isPreferred: sp.isPreferred,
        reliabilityScore: sp.supplier.reliabilityScore,
        qualityScore: sp.supplier.qualityScore,
        onTimeDeliveryRate: sp.supplier.onTimeDeliveryRate
      };
    });
  }

  async getBestSupplierForProduct(productId: number, quantity: number = 1) {
    const comparison = await this.compareSupplierPrices({ productId, quantity });
    
    if (comparison.length === 0) {
      return null;
    }

    // Prefer suppliers with preference flag, then by price
    const preferred = comparison.find(c => c.isPreferred);
    if (preferred) {
      return preferred;
    }

    // Otherwise, return cheapest option
    return comparison[0];
  }

  // Purchase Order Management

  @HandleDatabaseErrors()
  async createPurchaseOrder(data: CreatePurchaseOrderInput, userId: number): Promise<PurchaseOrder> {
    return await this.suppliers.manager.transaction(async (manager: EntityManager) => {
      // Validate supplier exists
      const supplier = await manager.findOneBy(Supplier, { id: data.supplierId });
      if (!supplier) {
        throw new AppError(ErrorCode.NOT_FOUND, 'Supplier not found');
      }

      // Generate PO number
      const poNumber = await this.generatePONumber();

      // Calculate totals
      let subtotalAmount = 0;
      const processedItems = [];

      for (const itemData of data.items) {
        const product = await manager.findOneBy(Product, { id: itemData.productId });
        if (!product) {
          throw new AppError(ErrorCode.NOT_FOUND, `Product with ID ${itemData.productId} not found`);
        }

        const lineTotal = itemData.quantityOrdered * itemData.unitPrice;
        const discountAmount = itemData.discountPercentage ? (lineTotal * itemData.discountPercentage / 100) : 0;
        const taxAmount = itemData.taxPercentage ? ((lineTotal - discountAmount) * itemData.taxPercentage / 100) : 0;
        const finalLineTotal = lineTotal - discountAmount + taxAmount;

        processedItems.push({
          ...itemData,
          lineTotal: finalLineTotal,
          discountAmount,
          taxAmount
        });

        subtotalAmount += finalLineTotal;
      }

      const taxAmount = 0; // Can be calculated based on supplier settings
      const shippingAmount = supplier.shippingCost || 0;
      const discountAmount = 0; // Can be calculated based on supplier discount
      const totalAmount = subtotalAmount + taxAmount + shippingAmount - discountAmount;

      // Create purchase order
      const purchaseOrder = manager.create(PurchaseOrder, {
        ...data,
        poNumber,
        createdByUserId: userId,
        subtotalAmount,
        taxAmount,
        shippingAmount,
        discountAmount,
        totalAmount,
        currency: data.currency || supplier.preferredCurrency || 'USD',
        paymentTermsDays: data.paymentTermsDays || supplier.paymentTermsDays,
        orderDate: new Date(),
        status: data.requiresApproval ? PurchaseOrderStatus.PENDING_APPROVAL : PurchaseOrderStatus.DRAFT
      });

      const savedPO = await manager.save(PurchaseOrder, purchaseOrder);

      // Create purchase order items
      for (const itemData of processedItems) {
        const item = manager.create(PurchaseOrderItem, {
          ...itemData,
          purchaseOrderId: savedPO.id
        });
        await manager.save(PurchaseOrderItem, item);
      }

      return await manager.findOne(PurchaseOrder, {
        where: { id: savedPO.id },
        relations: ['supplier', 'items', 'items.product', 'createdBy']
      });
    });
  }

  @HandleDatabaseErrors()
  async updatePurchaseOrder(data: UpdatePurchaseOrderInput): Promise<PurchaseOrder> {
    const purchaseOrder = await this.purchaseOrders.findOneBy({ id: data.id });
    if (!purchaseOrder) {
      throw new AppError(ErrorCode.NOT_FOUND, 'Purchase order not found');
    }

    Object.assign(purchaseOrder, data);
    purchaseOrder.updatedAt = new Date();

    // Set timestamps based on status changes
    if (data.status === PurchaseOrderStatus.SENT && !purchaseOrder.sentAt) {
      purchaseOrder.sentAt = new Date();
    }
    if (data.status === PurchaseOrderStatus.ACKNOWLEDGED && !purchaseOrder.acknowledgedAt) {
      purchaseOrder.acknowledgedAt = new Date();
    }
    if (data.status === PurchaseOrderStatus.APPROVED && !purchaseOrder.approvedAt) {
      purchaseOrder.approvedAt = new Date();
    }

    return await this.purchaseOrders.save(purchaseOrder);
  }

  async findAllPurchaseOrders(): Promise<PurchaseOrder[]> {
    return await this.purchaseOrders.find({
      relations: ['supplier', 'items', 'items.product', 'createdBy'],
      order: { createdAt: 'DESC' }
    });
  }

  async findPurchaseOrder(id: number): Promise<PurchaseOrder> {
    const purchaseOrder = await this.purchaseOrders.findOne({
      where: { id },
      relations: ['supplier', 'items', 'items.product', 'createdBy', 'approvedBy']
    });

    if (!purchaseOrder) {
      throw new AppError(ErrorCode.NOT_FOUND, 'Purchase order not found');
    }

    return purchaseOrder;
  }

  async findPurchaseOrdersByStatus(status: PurchaseOrderStatus): Promise<PurchaseOrder[]> {
    return await this.purchaseOrders.find({
      where: { status },
      relations: ['supplier', 'items'],
      order: { createdAt: 'DESC' }
    });
  }

  async findPurchaseOrdersBySupplier(supplierId: number): Promise<PurchaseOrder[]> {
    return await this.purchaseOrders.find({
      where: { supplierId },
      relations: ['items', 'items.product'],
      order: { createdAt: 'DESC' }
    });
  }

  // Purchase Order Receiving

  @HandleDatabaseErrors()
  async receivePurchaseOrderItem(data: ReceivePurchaseOrderItemInput, userId: number): Promise<PurchaseOrderItem> {
    return await this.purchaseOrderItems.manager.transaction(async (manager: EntityManager) => {
      const item = await manager.findOne(PurchaseOrderItem, {
        where: { id: data.itemId },
        relations: ['purchaseOrder', 'product']
      });

      if (!item) {
        throw new AppError(ErrorCode.NOT_FOUND, 'Purchase order item not found');
      }

      const newTotalReceived = item.quantityReceived + data.quantityReceived;
      if (newTotalReceived > item.quantityOrdered) {
        throw new AppError(
          ErrorCode.VALIDATION, 
          `Cannot receive more than ordered quantity. Ordered: ${item.quantityOrdered}, Already received: ${item.quantityReceived}, Attempting to receive: ${data.quantityReceived}`
        );
      }

      // Update item
      item.quantityReceived = newTotalReceived;
      item.receivedAt = new Date();
      item.actualDeliveryDate = data.actualDeliveryDate ? new Date(data.actualDeliveryDate) : new Date();
      
      if (data.qualityNotes) item.qualityNotes = data.qualityNotes;
      if (data.qualityRating) item.qualityRating = data.qualityRating;
      if (data.qualityApproved !== undefined) item.qualityApproved = data.qualityApproved;
      if (data.notes) item.notes = data.notes;

      // Update item status
      if (newTotalReceived === item.quantityOrdered) {
        item.status = PurchaseOrderItemStatus.RECEIVED;
      } else {
        item.status = PurchaseOrderItemStatus.PARTIALLY_RECEIVED;
      }

      await manager.save(PurchaseOrderItem, item);

      // Update purchase order status
      const allItems = await manager.find(PurchaseOrderItem, {
        where: { purchaseOrderId: item.purchaseOrderId }
      });

      const allReceived = allItems.every(i => i.status === PurchaseOrderItemStatus.RECEIVED);
      const anyReceived = allItems.some(i => i.quantityReceived > 0);

      const purchaseOrder = item.purchaseOrder;
      if (allReceived) {
        purchaseOrder.status = PurchaseOrderStatus.RECEIVED;
      } else if (anyReceived) {
        purchaseOrder.status = PurchaseOrderStatus.PARTIALLY_RECEIVED;
      }

      await manager.save(PurchaseOrder, purchaseOrder);

      // Note: Inventory transaction creation is handled in PurchaseOrdersService.receiveItem()
      // This is here for reference but should use the centralized method

      return item;
    });
  }

  // Automatic Restock System

  async getCurrentStock(productId: number): Promise<number> {
    const result = await this.inventoryTransactions
      .createQueryBuilder('it')
      .select('COALESCE(SUM(CASE WHEN it.type IN (\'add\', \'transfer_in\', \'return_from_customer\', \'purchase\') THEN it.quantity ELSE -it.quantity END), 0)', 'currentStock')
      .where('it.productId = :productId', { productId })
      .andWhere('it.status = :status', { status: 'completed' })
      .getRawOne();

    return parseInt(result.currentStock) || 0;
  }

  async checkLowStockProducts(): Promise<Array<Product & { currentStock: number }>> {
    const products = await this.products.find();
    const lowStockProducts = [];

    for (const product of products) {
      const currentStock = await this.getCurrentStock(product.id);
      if (currentStock <= product.restockThreshold) {
        lowStockProducts.push({ ...product, currentStock });
      }
    }

    return lowStockProducts;
  }

  async generateAutoRestockOrders(): Promise<PurchaseOrder[]> {
    const lowStockProducts = await this.checkLowStockProducts();
    const generatedOrders: PurchaseOrder[] = [];

    // Group products by preferred supplier
    const supplierGroups = new Map<number, Array<Product & { currentStock: number }>>();

    for (const product of lowStockProducts) {
      const bestSupplier = await this.getBestSupplierForProduct(product.id, product.restockThreshold * 2);
      
      if (bestSupplier) {
        if (!supplierGroups.has(bestSupplier.supplierId)) {
          supplierGroups.set(bestSupplier.supplierId, []);
        }
        supplierGroups.get(bestSupplier.supplierId).push(product);
      }
    }

    // Create purchase orders for each supplier
    for (const [supplierId, products] of supplierGroups) {
      const items = products.map(product => ({
        productId: product.id,
        quantityOrdered: (product.restockThreshold * 2) - product.currentStock,
        unitPrice: 0, // Will be populated from supplier product
        supplierSku: '',
        productName: product.name
      }));

      // This would need to be called with a system user ID
      const purchaseOrder = await this.createPurchaseOrder({
        supplierId,
        description: 'Auto-generated restock order',
        items,
        priority: 'normal' as any,
        isAutoGenerated: true
      } as any, 1); // System user ID

      generatedOrders.push(purchaseOrder);
    }

    return generatedOrders;
  }

  // Utility Methods

  private async generatePONumber(): Promise<string> {
    const now = new Date();
    const year = now.getFullYear().toString().slice(-2);
    const month = (now.getMonth() + 1).toString().padStart(2, '0');
    
    const count = await this.purchaseOrders.count({
      where: {
        createdAt: {
          $gte: new Date(now.getFullYear(), now.getMonth(), 1),
          $lt: new Date(now.getFullYear(), now.getMonth() + 1, 1)
        } as any
      }
    });

    const sequence = (count + 1).toString().padStart(4, '0');
    return `PO${year}${month}${sequence}`;
  }

  // Analytics and Reporting

  async getSupplierPerformanceMetrics(supplierId: number) {
    const supplier = await this.findSupplier(supplierId);
    
    const purchaseOrders = await this.purchaseOrders.find({
      where: { supplierId },
      relations: ['items']
    });

    const totalOrders = purchaseOrders.length;
    const totalValue = purchaseOrders.reduce((sum, po) => sum + po.totalAmount, 0);
    
    const onTimeDeliveries = purchaseOrders.filter(po => {
      return po.expectedDeliveryDate && 
             po.status === PurchaseOrderStatus.RECEIVED &&
             po.receivedAt &&
             po.receivedAt <= po.expectedDeliveryDate;
    }).length;

    const onTimeDeliveryRate = totalOrders > 0 ? (onTimeDeliveries / totalOrders) * 100 : 0;

    return {
      supplier,
      totalOrders,
      totalValue,
      onTimeDeliveryRate,
      averageOrderValue: totalOrders > 0 ? totalValue / totalOrders : 0,
      activeProducts: supplier.supplierProducts.filter(sp => sp.isActive).length
    };
  }
}
