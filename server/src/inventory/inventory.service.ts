import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Product } from './entities/product.entity';
import { Category } from './entities/category.entity';
import { ProductNote } from './entities/product-note.entity';
import { InventoryTransaction, TransactionType, TransactionStatus } from './entities/inventory-transaction.entity';
import { CreateProductInput } from './dto/create-product.input';
import { UpdateProductInput } from './dto/update-product.input';
import { CreateCategoryInput } from './dto/create-category.input';
import { UpdateCategoryInput } from './dto/update-category.input';
import { CreateProductNoteInput } from './dto/create-product-note.input';
import { CreateInventoryTransactionInput } from './dto/create-inventory-transaction.input';
import { UpdateInventoryTransactionInput } from './dto/update-inventory-transaction.input';
import { 
  CreateAdjustmentInput, 
  CreateTransferInput, 
  CreateReturnInput, 
  CreateWasteInput, 
  CreateReservationInput,
  ReleaseReservationInput 
} from './dto/advanced-transaction.input';
import { NotificationsService } from '../notifications/notifications.service';
import { PriceHistoryService } from './price-history.service';
import { AppError, ErrorCode } from '../errors/error-codes';
import { DatabaseErrorHandler, HandleDatabaseErrors } from '../errors/database-error-handler';

@Injectable()
export class InventoryService {
  constructor(
    @InjectRepository(Product)
    private products: Repository<Product>,
    @InjectRepository(Category)
    private categories: Repository<Category>,
    @InjectRepository(ProductNote)
    private productNotes: Repository<ProductNote>,
    @InjectRepository(InventoryTransaction)
    private transactions: Repository<InventoryTransaction>,
    private notifications: NotificationsService,
    private priceHistoryService: PriceHistoryService,
  ) {}

  // Product operations
  @HandleDatabaseErrors()
  async createProduct(data: CreateProductInput, userId?: number) {
    // Validate required fields
    DatabaseErrorHandler.validateEntity(data, ['name', 'sku']);
    
    const product = this.products.create({
      ...data,
      restockThreshold: data.restockThreshold || 5
    });
    const savedProduct = await this.products.save(product);

    // Track initial pricing if provided
    if (data.purchasePrice !== undefined && data.purchasePrice > 0) {
      await this.priceHistoryService.trackPriceChange(
        savedProduct.id,
        'purchase',
        0,
        data.purchasePrice,
        userId,
        'Initial product creation',
        data.currency || 'USD'
      );
    }

    if (data.salePrice !== undefined && data.salePrice > 0) {
      await this.priceHistoryService.trackPriceChange(
        savedProduct.id,
        'sale',
        0,
        data.salePrice,
        userId,
        'Initial product creation',
        data.currency || 'USD'
      );
    }

    return savedProduct;
  }

  @HandleDatabaseErrors()
  async updateProduct(data: UpdateProductInput, userId?: number) {
    // Get current product to compare prices
    const currentProduct = await this.products.findOneBy({ id: data.id });
    
    if (!currentProduct) {
      throw new AppError(ErrorCode.NOT_FOUND, 'Product not found');
    }

    // Track price changes
    if (data.purchasePrice !== undefined && data.purchasePrice !== currentProduct.purchasePrice) {
      await this.priceHistoryService.trackPriceChange(
        data.id,
        'purchase',
        currentProduct.purchasePrice || 0,
        data.purchasePrice,
        userId,
        'Product price update',
        data.currency || currentProduct.currency || 'USD'
      );
    }

    if (data.salePrice !== undefined && data.salePrice !== currentProduct.salePrice) {
      await this.priceHistoryService.trackPriceChange(
        data.id,
        'sale',
        currentProduct.salePrice || 0,
        data.salePrice,
        userId,
        'Product price update',
        data.currency || currentProduct.currency || 'USD'
      );
    }

    return this.products.save(data);
  }

  removeProduct(id: number) {
    return this.products.delete(id);
  }

  findAllProducts() {
    return this.products.find({ relations: ['category'] });
  }

  findProduct(id: number) {
    return this.products.findOne({ where: { id }, relations: ['category'] });
  }

  findProductsByCategory(categoryId: number) {
    return this.products.find({ 
      where: { categoryId }, 
      relations: ['category'] 
    });
  }

  // Category operations
  createCategory(data: CreateCategoryInput) {
    const category = this.categories.create(data);
    return this.categories.save(category);
  }

  updateCategory(data: UpdateCategoryInput) {
    return this.categories.save(data);
  }

  removeCategory(id: number) {
    return this.categories.delete(id);
  }

  findAllCategories() {
    return this.categories.find({ relations: ['products'] });
  }

  findCategory(id: number) {
    return this.categories.findOne({ where: { id }, relations: ['products'] });
  }

  // Product Notes operations
  createProductNote(data: CreateProductNoteInput) {
    const note = this.productNotes.create(data);
    return this.productNotes.save(note);
  }

  removeProductNote(id: number) {
    return this.productNotes.delete(id);
  }

  findProductNotes(productId: number) {
    return this.productNotes.find({ 
      where: { productId }, 
      relations: ['product', 'user'],
      order: { createdAt: 'DESC' }
    });
  }

  // Inventory Transaction operations
  async createTransaction(data: CreateInventoryTransactionInput) {
    // Calculate total cost if unit cost is provided
    let totalCost = data.totalCost;
    if (!totalCost && data.unitCost && data.quantity) {
      totalCost = data.unitCost * Math.abs(data.quantity);
    }

    const tx = this.transactions.create({
      ...data,
      productId: data.productId,
      userId: data.userId,
      unitCost: data.unitCost,
      totalCost: totalCost,
    });
    const saved = await this.transactions.save(tx);
    
    // Check stock levels and send alerts
    const stock = await this.getCurrentStock(data.productId);
    const product = await this.products.findOneBy({ id: data.productId });
    
    if (product && stock < (product.restockThreshold || 5)) {
      await this.notifications.sendLowStockAlert(product.name, stock);
    }
    
    return saved;
  }

  updateTransaction(data: UpdateInventoryTransactionInput) {
    return this.transactions.save(data);
  }

  removeTransaction(id: number) {
    return this.transactions.delete(id);
  }

  findAllTransactions() {
    return this.transactions.find({ 
      relations: ['product', 'user'],
      order: { occurredAt: 'DESC' }
    });
  }

  findTransaction(id: number) {
    return this.transactions.findOne({ 
      where: { id }, 
      relations: ['product', 'user'] 
    });
  }

  findTransactionsByProduct(productId: number) {
    return this.transactions.find({
      where: { productId },
      relations: ['product', 'user'],
      order: { occurredAt: 'DESC' }
    });
  }

  // Stock calculation methods
  async getCurrentStock(productId: number): Promise<number> {
    const res = await this.transactions
      .createQueryBuilder('t')
      .select('SUM(t.quantity)', 'sum')
      .where('t.productId = :productId', { productId })
      .getRawOne();
    
    return parseInt(res.sum) || 0;
  }

  async getLowStockProducts() {
    const products = await this.products.find();
    const lowStockProducts = [];
    
    for (const product of products) {
      const stock = await this.getCurrentStock(product.id);
      if (stock < product.restockThreshold) {
        lowStockProducts.push({
          ...product,
          currentStock: stock
        });
      }
    }
    
    return lowStockProducts;
  }

  async getInventorySummary() {
    const totalProducts = await this.products.count();
    const totalCategories = await this.categories.count();
    const recentTransactions = await this.transactions.count();
    const lowStockProducts = await this.getLowStockProducts();
    const inventoryValuation = await this.getInventoryValuation();
    
    return {
      totalProducts,
      totalCategories,
      recentTransactions,
      lowStockCount: lowStockProducts.length,
      lowStockProducts,
      inventoryValuation
    };
  }

  // Pricing and valuation methods
  async getInventoryValuation() {
    const products = await this.products.find();
    let totalPurchaseValue = 0;
    let totalSaleValue = 0;
    let totalCostValue = 0;
    
    for (const product of products) {
      const stock = await this.getCurrentStock(product.id);
      if (stock > 0) {
        if (product.purchasePrice) {
          totalPurchaseValue += product.purchasePrice * stock;
        }
        if (product.salePrice) {
          totalSaleValue += product.salePrice * stock;
        }
        
        // Calculate average cost from transactions
        const avgCost = await this.getAverageCostPerUnit(product.id);
        if (avgCost > 0) {
          totalCostValue += avgCost * stock;
        }
      }
    }
    
    return {
      totalPurchaseValue: Math.round(totalPurchaseValue * 100) / 100,
      totalSaleValue: Math.round(totalSaleValue * 100) / 100,
      totalCostValue: Math.round(totalCostValue * 100) / 100,
      potentialProfit: Math.round((totalSaleValue - totalPurchaseValue) * 100) / 100,
      realizedProfit: Math.round((totalSaleValue - totalCostValue) * 100) / 100,
    };
  }

  async getAverageCostPerUnit(productId: number): Promise<number> {
    const transactions = await this.transactions.find({
      where: { productId, unitCost: { $ne: null } as any },
      select: ['unitCost', 'quantity']
    });
    
    if (transactions.length === 0) return 0;
    
    let totalCost = 0;
    let totalQuantity = 0;
    
    transactions.forEach(tx => {
      if (tx.unitCost && tx.quantity > 0) { // Only consider stock additions
        totalCost += tx.unitCost * tx.quantity;
        totalQuantity += tx.quantity;
      }
    });
    
    return totalQuantity > 0 ? totalCost / totalQuantity : 0;
  }

  async getProductProfitability(productId: number) {
    const product = await this.products.findOneBy({ id: productId });
    if (!product) return null;
    
    const stock = await this.getCurrentStock(productId);
    const avgCost = await this.getAverageCostPerUnit(productId);
    
    return {
      productId,
      productName: product.name,
      currentStock: stock,
      purchasePrice: product.purchasePrice || 0,
      salePrice: product.salePrice || 0,
      averageCost: Math.round(avgCost * 100) / 100,
      profitMargin: product.salePrice && product.purchasePrice 
        ? Math.round(((product.salePrice - product.purchasePrice) / product.salePrice) * 100)
        : 0,
      realizedProfitMargin: product.salePrice && avgCost > 0
        ? Math.round(((product.salePrice - avgCost) / product.salePrice) * 100)
        : 0,
      inventoryValue: stock * (product.purchasePrice || 0),
      potentialRevenue: stock * (product.salePrice || 0),
    };
  }

  async getTopProfitableProducts(limit = 10) {
    const products = await this.products.find();
    const profitabilityData = [];
    
    for (const product of products) {
      const profitability = await this.getProductProfitability(product.id);
      if (profitability && profitability.currentStock > 0) {
        profitabilityData.push(profitability);
      }
    }
    
    return profitabilityData
      .sort((a, b) => b.realizedProfitMargin - a.realizedProfitMargin)
      .slice(0, limit);
  }

  // Advanced Transaction Methods

  @HandleDatabaseErrors()
  async createAdjustment(data: CreateAdjustmentInput): Promise<InventoryTransaction> {
    // Validate the product exists
    const product = await this.products.findOneBy({ id: data.productId });
    if (!product) {
      throw new AppError(ErrorCode.NOT_FOUND, 'Product not found');
    }

    const currentStock = await this.getCurrentStock(data.productId);
    const newStock = currentStock + data.adjustmentQuantity;

    if (newStock < 0) {
      throw new AppError(
        ErrorCode.VALIDATION, 
        `Adjustment would result in negative stock. Current: ${currentStock}, Adjustment: ${data.adjustmentQuantity}`
      );
    }

    const transaction = this.transactions.create({
      productId: data.productId,
      userId: data.userId,
      quantity: Math.abs(data.adjustmentQuantity),
      transactionType: data.adjustmentQuantity > 0 ? TransactionType.ADD : TransactionType.REMOVE,
      status: TransactionStatus.COMPLETED,
      notes: `${data.reason}: ${data.notes || ''}`,
      unitCost: data.unitCost,
      reasonCode: data.reason,
    });

    const savedTransaction = await this.transactions.save(transaction);

    // Check for low stock after adjustment
    if (newStock <= (product.restockThreshold || 5)) {
      await this.notifications.sendLowStockAlert(product.name, newStock);
    }

    return savedTransaction;
  }

  @HandleDatabaseErrors()
  async createTransfer(data: CreateTransferInput): Promise<{ outTransaction: InventoryTransaction; inTransaction: InventoryTransaction }> {
    // Validate the product exists
    const product = await this.products.findOneBy({ id: data.productId });
    if (!product) {
      throw new AppError(ErrorCode.NOT_FOUND, 'Product not found');
    }

    // Check if source location has enough stock
    const sourceStock = await this.getLocationStock(data.productId, data.fromLocationId);
    if (sourceStock < data.quantity) {
      throw new AppError(
        ErrorCode.VALIDATION, 
        `Insufficient stock at source location. Available: ${sourceStock}, Requested: ${data.quantity}`
      );
    }

    // Create transfer out transaction
    const outTransaction = this.transactions.create({
      productId: data.productId,
      userId: data.userId,
      quantity: data.quantity,
      transactionType: TransactionType.TRANSFER_OUT,
      status: TransactionStatus.COMPLETED,
      fromLocationId: data.fromLocationId,
      toLocationId: data.toLocationId,
      notes: data.notes,
      unitCost: data.unitCost,
    });

    const savedOutTransaction = await this.transactions.save(outTransaction);

    // Create transfer in transaction
    const inTransaction = this.transactions.create({
      productId: data.productId,
      userId: data.userId,
      quantity: data.quantity,
      transactionType: TransactionType.TRANSFER_IN,
      status: TransactionStatus.COMPLETED,
      fromLocationId: data.fromLocationId,
      toLocationId: data.toLocationId,
      referenceTransactionId: savedOutTransaction.id,
      notes: data.notes,
      unitCost: data.unitCost,
    });

    const savedInTransaction = await this.transactions.save(inTransaction);

    // Update the out transaction to reference the in transaction
    await this.transactions.update(savedOutTransaction.id, {
      referenceTransactionId: savedInTransaction.id
    });

    return {
      outTransaction: savedOutTransaction,
      inTransaction: savedInTransaction,
    };
  }

  @HandleDatabaseErrors()
  async createReturn(data: CreateReturnInput): Promise<InventoryTransaction> {
    // Validate the product exists
    const product = await this.products.findOneBy({ id: data.productId });
    if (!product) {
      throw new AppError(ErrorCode.NOT_FOUND, 'Product not found');
    }

    const transactionType = data.returnType === 'to_supplier' 
      ? TransactionType.RETURN_TO_SUPPLIER 
      : TransactionType.RETURN_FROM_CUSTOMER;

    // For returns to supplier, check if we have enough stock
    if (data.returnType === 'to_supplier') {
      const currentStock = await this.getCurrentStock(data.productId);
      if (currentStock < data.quantity) {
        throw new AppError(
          ErrorCode.VALIDATION, 
          `Insufficient stock for return. Available: ${currentStock}, Return quantity: ${data.quantity}`
        );
      }
    }

    const transaction = this.transactions.create({
      productId: data.productId,
      userId: data.userId,
      quantity: data.quantity,
      transactionType,
      status: TransactionStatus.COMPLETED,
      supplierName: data.supplierName,
      supplierReference: data.supplierReference,
      reasonCode: data.reason,
      notes: data.notes,
      unitCost: data.unitCost,
      totalCost: data.refundAmount,
    });

    return await this.transactions.save(transaction);
  }

  @HandleDatabaseErrors()
  async createWaste(data: CreateWasteInput): Promise<InventoryTransaction> {
    // Validate the product exists
    const product = await this.products.findOneBy({ id: data.productId });
    if (!product) {
      throw new AppError(ErrorCode.NOT_FOUND, 'Product not found');
    }

    // Check if we have enough stock
    const currentStock = await this.getCurrentStock(data.productId);
    if (currentStock < data.quantity) {
      throw new AppError(
        ErrorCode.VALIDATION, 
        `Insufficient stock for waste/damage. Available: ${currentStock}, Waste quantity: ${data.quantity}`
      );
    }

    const transactionType = data.wasteType === 'waste' ? TransactionType.WASTE : TransactionType.DAMAGED;

    const transaction = this.transactions.create({
      productId: data.productId,
      userId: data.userId,
      quantity: data.quantity,
      transactionType,
      status: TransactionStatus.COMPLETED,
      reasonCode: data.reasonCode,
      expiryDate: data.expiryDate ? new Date(data.expiryDate) : undefined,
      notes: data.notes,
      unitCost: data.unitCost,
      totalCost: data.lossValue,
    });

    const savedTransaction = await this.transactions.save(transaction);

    // Create notification for significant waste
    const wasteValue = (data.unitCost || product.purchasePrice || 0) * data.quantity;
    if (wasteValue > 100) { // Threshold for significant waste
      // TODO: Implement waste notification
      console.log(`Waste Alert: ${product.name} - ${data.quantity} units wasted/damaged. Value: $${wasteValue.toFixed(2)}. Reason: ${data.reasonCode}`);
    }

    return savedTransaction;
  }

  @HandleDatabaseErrors()
  async createReservation(data: CreateReservationInput): Promise<InventoryTransaction> {
    // Validate the product exists
    const product = await this.products.findOneBy({ id: data.productId });
    if (!product) {
      throw new AppError(ErrorCode.NOT_FOUND, 'Product not found');
    }

    // Check available stock (current stock minus existing reservations)
    const currentStock = await this.getCurrentStock(data.productId);
    const reservedStock = await this.getReservedStock(data.productId);
    const availableStock = currentStock - reservedStock;

    if (availableStock < data.quantity) {
      throw new AppError(
        ErrorCode.VALIDATION, 
        `Insufficient available stock. Available: ${availableStock}, Requested: ${data.quantity}`
      );
    }

    const expiresAt = data.expiresAt ? new Date(data.expiresAt) : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // Default 7 days

    const transaction = this.transactions.create({
      productId: data.productId,
      userId: data.userId,
      quantity: data.quantity,
      transactionType: TransactionType.RESERVE,
      status: TransactionStatus.COMPLETED,
      reservationReference: data.reservationReference,
      reservationExpiresAt: expiresAt,
      notes: `Customer: ${data.customerInfo || 'N/A'}. ${data.notes || ''}`,
    });

    return await this.transactions.save(transaction);
  }

  @HandleDatabaseErrors()
  async releaseReservation(data: ReleaseReservationInput): Promise<InventoryTransaction> {
    // Find the original reservation
    const reservation = await this.transactions.findOneBy({ 
      id: data.reservationTransactionId,
      transactionType: TransactionType.RESERVE 
    });

    if (!reservation) {
      throw new AppError(ErrorCode.NOT_FOUND, 'Reservation not found');
    }

    // Check if already released
    const existingRelease = await this.transactions.findOneBy({
      referenceTransactionId: data.reservationTransactionId,
      transactionType: TransactionType.UNRESERVE
    });

    if (existingRelease) {
      throw new AppError(ErrorCode.VALIDATION, 'Reservation already released');
    }

    // Create unreserve transaction
    const unreserveTransaction = this.transactions.create({
      productId: reservation.productId,
      userId: data.userId,
      quantity: reservation.quantity,
      transactionType: TransactionType.UNRESERVE,
      status: TransactionStatus.COMPLETED,
      referenceTransactionId: data.reservationTransactionId,
      reasonCode: data.reason,
      notes: data.notes,
    });

    return await this.transactions.save(unreserveTransaction);
  }

  // Helper methods for advanced transactions

  async getLocationStock(productId: number, locationId: number): Promise<number> {
    const transactions = await this.transactions.find({
      where: [
        { productId, fromLocationId: locationId },
        { productId, toLocationId: locationId }
      ]
    });

    let stock = 0;
    transactions.forEach(tx => {
      if (tx.toLocationId === locationId) {
        stock += tx.quantity; // Stock coming in
      }
      if (tx.fromLocationId === locationId) {
        stock -= tx.quantity; // Stock going out
      }
    });

    return stock;
  }

  async getReservedStock(productId: number): Promise<number> {
    const reservations = await this.transactions.find({
      where: { 
        productId, 
        transactionType: TransactionType.RESERVE,
        status: TransactionStatus.COMPLETED 
      }
    });

    const releases = await this.transactions.find({
      where: { 
        productId, 
        transactionType: TransactionType.UNRESERVE,
        status: TransactionStatus.COMPLETED 
      }
    });

    let reservedStock = 0;
    reservations.forEach(tx => reservedStock += tx.quantity);
    releases.forEach(tx => reservedStock -= tx.quantity);

    return Math.max(0, reservedStock);
  }

  async getTransactionsByType(transactionType: TransactionType, limit = 50): Promise<InventoryTransaction[]> {
    return await this.transactions.find({
      where: { transactionType },
      relations: ['product'],
      order: { occurredAt: 'DESC' },
      take: limit
    });
  }

  async getActiveReservations(productId?: number): Promise<InventoryTransaction[]> {
    const whereCondition: any = {
      transactionType: TransactionType.RESERVE,
      status: TransactionStatus.COMPLETED
    };

    if (productId) {
      whereCondition.productId = productId;
    }

    const reservations = await this.transactions.find({
      where: whereCondition,
      relations: ['product'],
      order: { reservationExpiresAt: 'ASC' }
    });

    // Filter out released reservations
    const activeReservations = [];
    for (const reservation of reservations) {
      const release = await this.transactions.findOneBy({
        referenceTransactionId: reservation.id,
        transactionType: TransactionType.UNRESERVE
      });
      
      if (!release) {
        activeReservations.push(reservation);
      }
    }

    return activeReservations;
  }

  async getExpiredReservations(): Promise<InventoryTransaction[]> {
    const now = new Date();
    return await this.transactions
      .createQueryBuilder('transaction')
      .where('transaction.transactionType = :type', { type: TransactionType.RESERVE })
      .andWhere('transaction.status = :status', { status: TransactionStatus.COMPLETED })
      .andWhere('transaction.reservationExpiresAt < :now', { now })
      .leftJoinAndSelect('transaction.product', 'product')
      .getMany();
  }
}
