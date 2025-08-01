import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, EntityManager } from 'typeorm';
import { PurchaseOrder, PurchaseOrderStatus, PurchaseOrderPriority } from './entities/purchase-order.entity';
import { PurchaseOrderItem, PurchaseOrderItemStatus } from './entities/purchase-order-item.entity';
import { Supplier } from './entities/supplier.entity';
import { Product } from '../inventory/entities/product.entity';
import { InventoryTransaction, TransactionType, TransactionStatus } from '../inventory/entities/inventory-transaction.entity';
import { CreatePurchaseOrderInput, UpdatePurchaseOrderInput, ReceivePurchaseOrderItemInput, CreatePurchaseOrderItemInput, UpdatePurchaseOrderItemInput } from './dto/purchase-order.input';
import { AppError, ErrorCode } from '../errors/error-codes';
import { DatabaseErrorHandler, HandleDatabaseErrors } from '../errors/database-error-handler';

@Injectable()
export class PurchaseOrdersService {
  constructor(
    @InjectRepository(PurchaseOrder)
    private purchaseOrders: Repository<PurchaseOrder>,
    @InjectRepository(PurchaseOrderItem)
    private purchaseOrderItems: Repository<PurchaseOrderItem>,
    @InjectRepository(Supplier)
    private suppliers: Repository<Supplier>,
    @InjectRepository(Product)
    private products: Repository<Product>,
    @InjectRepository(InventoryTransaction)
    private inventoryTransactions: Repository<InventoryTransaction>,
  ) {}

  // Purchase Order CRUD Operations

  @HandleDatabaseErrors()
  async create(data: CreatePurchaseOrderInput, userId: number): Promise<PurchaseOrder> {
    return await this.purchaseOrders.manager.transaction(async (manager: EntityManager) => {
      // Validate supplier exists
      const supplier = await manager.findOneBy(Supplier, { id: data.supplierId });
      if (!supplier) {
        throw new AppError(ErrorCode.NOT_FOUND, 'Supplier not found');
      }

      // Generate PO number
      const poNumber = await this.generatePONumber(manager);

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

      const taxAmount = 0; // Calculate based on supplier or items
      const shippingAmount = supplier.shippingCost || 0;
      const discountAmount = 0; // Calculate based on supplier discount
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
  async update(data: UpdatePurchaseOrderInput): Promise<PurchaseOrder> {
    const purchaseOrder = await this.purchaseOrders.findOneBy({ id: data.id });
    if (!purchaseOrder) {
      throw new AppError(ErrorCode.NOT_FOUND, 'Purchase order not found');
    }

    // Check if PO can be updated based on status
    if ([PurchaseOrderStatus.RECEIVED, PurchaseOrderStatus.CANCELLED].includes(purchaseOrder.status)) {
      throw new AppError(
        ErrorCode.VALIDATION, 
        'Cannot update a purchase order that has been received or cancelled'
      );
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

  async findAll(): Promise<PurchaseOrder[]> {
    return await this.purchaseOrders.find({
      relations: ['supplier', 'items', 'items.product', 'createdBy'],
      order: { createdAt: 'DESC' }
    });
  }

  async findOne(id: number): Promise<PurchaseOrder> {
    const purchaseOrder = await this.purchaseOrders.findOne({
      where: { id },
      relations: ['supplier', 'items', 'items.product', 'createdBy', 'approvedBy', 'rejectedBy']
    });

    if (!purchaseOrder) {
      throw new AppError(ErrorCode.NOT_FOUND, 'Purchase order not found');
    }

    return purchaseOrder;
  }

  async findByStatus(status: PurchaseOrderStatus): Promise<PurchaseOrder[]> {
    return await this.purchaseOrders.find({
      where: { status },
      relations: ['supplier', 'items'],
      order: { createdAt: 'DESC' }
    });
  }

  async findBySupplier(supplierId: number): Promise<PurchaseOrder[]> {
    return await this.purchaseOrders.find({
      where: { supplierId },
      relations: ['items', 'items.product'],
      order: { createdAt: 'DESC' }
    });
  }

  async findPendingApproval(): Promise<PurchaseOrder[]> {
    return await this.findByStatus(PurchaseOrderStatus.PENDING_APPROVAL);
  }

  async findOverdue(): Promise<PurchaseOrder[]> {
    const now = new Date();
    return await this.purchaseOrders
      .createQueryBuilder('po')
      .where('po.expectedDeliveryDate < :now', { now })
      .andWhere('po.status IN (:...statuses)', { 
        statuses: [
          PurchaseOrderStatus.SENT, 
          PurchaseOrderStatus.ACKNOWLEDGED, 
          PurchaseOrderStatus.PARTIALLY_RECEIVED
        ] 
      })
      .leftJoinAndSelect('po.supplier', 'supplier')
      .leftJoinAndSelect('po.items', 'items')
      .orderBy('po.expectedDeliveryDate', 'ASC')
      .getMany();
  }

  // Purchase Order Item Management

  @HandleDatabaseErrors()
  async addItem(purchaseOrderId: number, data: CreatePurchaseOrderItemInput): Promise<PurchaseOrderItem> {
    return await this.purchaseOrderItems.manager.transaction(async (manager: EntityManager) => {
      const purchaseOrder = await manager.findOneBy(PurchaseOrder, { id: purchaseOrderId });
      if (!purchaseOrder) {
        throw new AppError(ErrorCode.NOT_FOUND, 'Purchase order not found');
      }

      if (purchaseOrder.status !== PurchaseOrderStatus.DRAFT) {
        throw new AppError(
          ErrorCode.VALIDATION, 
          'Can only add items to draft purchase orders'
        );
      }

      const product = await manager.findOneBy(Product, { id: data.productId });
      if (!product) {
        throw new AppError(ErrorCode.NOT_FOUND, 'Product not found');
      }

      const lineTotal = data.quantityOrdered * data.unitPrice;
      const discountAmount = data.discountPercentage ? (lineTotal * data.discountPercentage / 100) : 0;
      const taxAmount = data.taxPercentage ? ((lineTotal - discountAmount) * data.taxPercentage / 100) : 0;
      const finalLineTotal = lineTotal - discountAmount + taxAmount;

      const item = manager.create(PurchaseOrderItem, {
        ...data,
        purchaseOrderId,
        lineTotal: finalLineTotal,
        discountAmount,
        taxAmount
      });

      const savedItem = await manager.save(PurchaseOrderItem, item);

      // Recalculate purchase order totals
      await this.recalculatePOTotals(manager, purchaseOrderId);

      return savedItem;
    });
  }

  @HandleDatabaseErrors()
  async updateItem(id: number, data: UpdatePurchaseOrderItemInput): Promise<PurchaseOrderItem> {
    return await this.purchaseOrderItems.manager.transaction(async (manager: EntityManager) => {
      const item = await manager.findOne(PurchaseOrderItem, {
        where: { id },
        relations: ['purchaseOrder']
      });

      if (!item) {
        throw new AppError(ErrorCode.NOT_FOUND, 'Purchase order item not found');
      }

      if (item.purchaseOrder.status !== PurchaseOrderStatus.DRAFT) {
        throw new AppError(
          ErrorCode.VALIDATION, 
          'Can only update items in draft purchase orders'
        );
      }

      Object.assign(item, data);

      if (data.quantityOrdered || data.unitPrice || data.discountPercentage || data.taxPercentage) {
        const lineTotal = item.quantityOrdered * item.unitPrice;
        const discountAmount = item.discountPercentage ? (lineTotal * item.discountPercentage / 100) : 0;
        const taxAmount = item.taxPercentage ? ((lineTotal - discountAmount) * item.taxPercentage / 100) : 0;
        
        item.lineTotal = lineTotal - discountAmount + taxAmount;
        item.discountAmount = discountAmount;
        item.taxAmount = taxAmount;
      }

      const savedItem = await manager.save(PurchaseOrderItem, item);

      // Recalculate purchase order totals
      await this.recalculatePOTotals(manager, item.purchaseOrderId);

      return savedItem;
    });
  }

  @HandleDatabaseErrors()
  async removeItem(id: number): Promise<boolean> {
    return await this.purchaseOrderItems.manager.transaction(async (manager: EntityManager) => {
      const item = await manager.findOne(PurchaseOrderItem, {
        where: { id },
        relations: ['purchaseOrder']
      });

      if (!item) {
        throw new AppError(ErrorCode.NOT_FOUND, 'Purchase order item not found');
      }

      if (item.purchaseOrder.status !== PurchaseOrderStatus.DRAFT) {
        throw new AppError(
          ErrorCode.VALIDATION, 
          'Can only remove items from draft purchase orders'
        );
      }

      const purchaseOrderId = item.purchaseOrderId;
      const result = await manager.delete(PurchaseOrderItem, id);

      // Recalculate purchase order totals
      await this.recalculatePOTotals(manager, purchaseOrderId);

      return result.affected > 0;
    });
  }

  // Purchase Order Receiving

  @HandleDatabaseErrors()
  async receiveItem(data: ReceivePurchaseOrderItemInput, userId: number): Promise<PurchaseOrderItem> {
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

      // Create inventory transaction for received items
      if (data.qualityApproved !== false) { // Only add to inventory if quality approved or not specified
        const inventoryTransaction = manager.create(InventoryTransaction, {
          productId: item.productId,
          transactionType: TransactionType.PURCHASE,
          quantity: data.quantityReceived,
          unitCost: item.unitPrice,
          totalCost: item.unitPrice * data.quantityReceived,
          notes: `Received from PO ${item.purchaseOrder.poNumber}`,
          userId,
          supplierReference: item.purchaseOrder.poNumber,
          status: TransactionStatus.COMPLETED
        });

        await manager.save(InventoryTransaction, inventoryTransaction);
      }

      // Update purchase order status
      const allItems = await manager.find(PurchaseOrderItem, {
        where: { purchaseOrderId: item.purchaseOrderId }
      });

      const allReceived = allItems.every(i => i.status === PurchaseOrderItemStatus.RECEIVED);
      const anyReceived = allItems.some(i => i.quantityReceived > 0);

      const purchaseOrder = item.purchaseOrder;
      if (allReceived) {
        purchaseOrder.status = PurchaseOrderStatus.RECEIVED;
        purchaseOrder.receivedAt = new Date();
      } else if (anyReceived) {
        purchaseOrder.status = PurchaseOrderStatus.PARTIALLY_RECEIVED;
      }

      await manager.save(PurchaseOrder, purchaseOrder);

      return item;
    });
  }

  // Purchase Order Approval Workflow

  @HandleDatabaseErrors()
  async approve(id: number, userId: number, notes?: string): Promise<PurchaseOrder> {
    const purchaseOrder = await this.purchaseOrders.findOneBy({ id });
    if (!purchaseOrder) {
      throw new AppError(ErrorCode.NOT_FOUND, 'Purchase order not found');
    }

    if (purchaseOrder.status !== PurchaseOrderStatus.PENDING_APPROVAL) {
      throw new AppError(
        ErrorCode.VALIDATION, 
        'Purchase order is not pending approval'
      );
    }

    purchaseOrder.status = PurchaseOrderStatus.APPROVED;
    purchaseOrder.approvedAt = new Date();
    purchaseOrder.approvedByUserId = userId;
    if (notes) purchaseOrder.approvalNotes = notes;

    return await this.purchaseOrders.save(purchaseOrder);
  }

  @HandleDatabaseErrors()
  async reject(id: number, userId: number, reason: string): Promise<PurchaseOrder> {
    const purchaseOrder = await this.purchaseOrders.findOneBy({ id });
    if (!purchaseOrder) {
      throw new AppError(ErrorCode.NOT_FOUND, 'Purchase order not found');
    }

    if (purchaseOrder.status !== PurchaseOrderStatus.PENDING_APPROVAL) {
      throw new AppError(
        ErrorCode.VALIDATION, 
        'Purchase order is not pending approval'
      );
    }

    purchaseOrder.status = PurchaseOrderStatus.DRAFT;
    purchaseOrder.rejectedAt = new Date();
    purchaseOrder.rejectedByUserId = userId;
    purchaseOrder.rejectionReason = reason;

    return await this.purchaseOrders.save(purchaseOrder);
  }

  @HandleDatabaseErrors()
  async cancel(id: number, reason: string): Promise<PurchaseOrder> {
    const purchaseOrder = await this.purchaseOrders.findOneBy({ id });
    if (!purchaseOrder) {
      throw new AppError(ErrorCode.NOT_FOUND, 'Purchase order not found');
    }

    if ([PurchaseOrderStatus.RECEIVED, PurchaseOrderStatus.CANCELLED].includes(purchaseOrder.status)) {
      throw new AppError(
        ErrorCode.VALIDATION, 
        'Cannot cancel a purchase order that has been received or is already cancelled'
      );
    }

    purchaseOrder.status = PurchaseOrderStatus.CANCELLED;
    purchaseOrder.cancelledAt = new Date();
    purchaseOrder.cancellationReason = reason;

    return await this.purchaseOrders.save(purchaseOrder);
  }

  // Utility Methods

  private async generatePONumber(manager?: EntityManager): Promise<string> {
    const repo = manager ? manager.getRepository(PurchaseOrder) : this.purchaseOrders;
    const now = new Date();
    const year = now.getFullYear().toString().slice(-2);
    const month = (now.getMonth() + 1).toString().padStart(2, '0');
    
    const count = await repo.count({
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

  private async recalculatePOTotals(manager: EntityManager, purchaseOrderId: number): Promise<void> {
    const items = await manager.find(PurchaseOrderItem, {
      where: { purchaseOrderId }
    });

    const subtotalAmount = items.reduce((sum, item) => sum + (item.lineTotal || 0), 0);
    
    const purchaseOrder = await manager.findOneBy(PurchaseOrder, { id: purchaseOrderId });
    if (purchaseOrder) {
      purchaseOrder.subtotalAmount = subtotalAmount;
      purchaseOrder.totalAmount = subtotalAmount + (purchaseOrder.taxAmount || 0) + (purchaseOrder.shippingAmount || 0) - (purchaseOrder.discountAmount || 0);
      await manager.save(PurchaseOrder, purchaseOrder);
    }
  }

  // Analytics and Reporting

  async getPurchaseOrderAnalytics(supplierId?: number, startDate?: Date, endDate?: Date) {
    const queryBuilder = this.purchaseOrders
      .createQueryBuilder('po')
      .leftJoin('po.supplier', 's');

    if (supplierId) {
      queryBuilder.andWhere('po.supplierId = :supplierId', { supplierId });
    }

    if (startDate) {
      queryBuilder.andWhere('po.orderDate >= :startDate', { startDate });
    }

    if (endDate) {
      queryBuilder.andWhere('po.orderDate <= :endDate', { endDate });
    }

    const purchaseOrders = await queryBuilder.getMany();

    const totalOrders = purchaseOrders.length;
    const totalValue = purchaseOrders.reduce((sum, po) => sum + po.totalAmount, 0);
    const averageOrderValue = totalOrders > 0 ? totalValue / totalOrders : 0;

    const statusCounts = purchaseOrders.reduce((acc, po) => {
      acc[po.status] = (acc[po.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const onTimeDeliveries = purchaseOrders.filter(po => 
      po.status === PurchaseOrderStatus.RECEIVED && 
      po.receivedAt && 
      po.expectedDeliveryDate && 
      po.receivedAt <= po.expectedDeliveryDate
    ).length;

    const onTimeDeliveryRate = totalOrders > 0 ? (onTimeDeliveries / totalOrders) * 100 : 0;

    return {
      totalOrders,
      totalValue,
      averageOrderValue,
      statusCounts,
      onTimeDeliveryRate
    };
  }
}
