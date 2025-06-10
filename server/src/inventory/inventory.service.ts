import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Product } from './entities/product.entity';
import { InventoryTransaction } from './entities/inventory-transaction.entity';
import { CreateProductInput } from './dto/create-product.input';
import { UpdateProductInput } from './dto/update-product.input';
import { CreateInventoryTransactionInput } from './dto/create-inventory-transaction.input';
import { UpdateInventoryTransactionInput } from './dto/update-inventory-transaction.input';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class InventoryService {
  constructor(
    @InjectRepository(Product)
    private products: Repository<Product>,
    @InjectRepository(InventoryTransaction)
    private transactions: Repository<InventoryTransaction>,
    private notifications: NotificationsService,
  ) {}

  // Product operations
  createProduct(data: CreateProductInput) {
    const product = this.products.create(data);
    return this.products.save(product);
  }

  updateProduct(data: UpdateProductInput) {
    return this.products.save(data);
  }

  removeProduct(id: number) {
    return this.products.delete(id);
  }

  findAllProducts() {
    return this.products.find();
  }

  findProduct(id: number) {
    return this.products.findOneBy({ id });
  }

  // Inventory Transaction operations
  async createTransaction(data: CreateInventoryTransactionInput) {
    const tx = this.transactions.create({
      ...data,
      productId: data.productId,
      locationId: data.locationId,
      userId: data.userId,
    });
    const saved = await this.transactions.save(tx);
    const stock = await this.getCurrentStock(data.productId);
    if (stock < 5) {
      const product = await this.products.findOneBy({ id: data.productId });
      if (product) {
        await this.notifications.sendLowStockAlert(product.name, stock);
      }
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
    return this.transactions.find({ relations: ['product'] });
  }

  findTransaction(id: number) {
    return this.transactions.findOne({ where: { id }, relations: ['product'] });
  }

  private async getCurrentStock(productId: number): Promise<number> {
    const res = await this.transactions
      .createQueryBuilder('t')
      .select('SUM(t.quantity)', 'sum')
      .where('t.productId = :id', { id: productId })
      .getRawOne();
    return parseInt(res.sum) || 0;
  }
}
