import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Product } from './entities/product.entity';
import { Category } from './entities/category.entity';
import { ProductNote } from './entities/product-note.entity';
import { InventoryTransaction } from './entities/inventory-transaction.entity';
import { CreateProductInput } from './dto/create-product.input';
import { UpdateProductInput } from './dto/update-product.input';
import { CreateCategoryInput } from './dto/create-category.input';
import { UpdateCategoryInput } from './dto/update-category.input';
import { CreateProductNoteInput } from './dto/create-product-note.input';
import { CreateInventoryTransactionInput } from './dto/create-inventory-transaction.input';
import { UpdateInventoryTransactionInput } from './dto/update-inventory-transaction.input';
import { NotificationsService } from '../notifications/notifications.service';
import { PriceHistoryService } from './price-history.service';
import { AppError, ErrorCode } from '../errors/error-codes';

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
  async createProduct(data: CreateProductInput, userId?: number) {
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
}
