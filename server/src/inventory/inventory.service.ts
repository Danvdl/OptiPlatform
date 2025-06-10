import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Product } from './entities/product.entity';
import { InventoryTransaction } from './entities/inventory-transaction.entity';
import { CreateProductInput } from './dto/create-product.input';
import { UpdateProductInput } from './dto/update-product.input';
import { CreateInventoryTransactionInput } from './dto/create-inventory-transaction.input';
import { UpdateInventoryTransactionInput } from './dto/update-inventory-transaction.input';

@Injectable()
export class InventoryService {
  constructor(
    @InjectRepository(Product)
    private products: Repository<Product>,
    @InjectRepository(InventoryTransaction)
    private transactions: Repository<InventoryTransaction>,
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
  createTransaction(data: CreateInventoryTransactionInput) {
    const tx = this.transactions.create({
      ...data,
      productId: data.productId,
    });
    return this.transactions.save(tx);
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
}
