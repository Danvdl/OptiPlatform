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
  ) {}

  // Product operations
  createProduct(data: CreateProductInput) {
    const product = this.products.create({
      ...data,
      restockThreshold: data.restockThreshold || 5
    });
    return this.products.save(product);
  }

  updateProduct(data: UpdateProductInput) {
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
    const tx = this.transactions.create({
      ...data,
      productId: data.productId,
      userId: data.userId,
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
    
    return {
      totalProducts,
      totalCategories,
      recentTransactions,
      lowStockCount: lowStockProducts.length,
      lowStockProducts
    };
  }
}
