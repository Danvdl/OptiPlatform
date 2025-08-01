import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Supplier } from './entities/supplier.entity';
import { SupplierProduct } from './entities/supplier-product.entity';
import { PurchaseOrder } from './entities/purchase-order.entity';
import { PurchaseOrderItem } from './entities/purchase-order-item.entity';
import { Product } from '../inventory/entities/product.entity';
import { InventoryTransaction } from '../inventory/entities/inventory-transaction.entity';
import { SuppliersService } from './suppliers.service';
import { PurchaseOrdersService } from './purchase-orders.service';
import { SuppliersResolver } from './suppliers.resolver';
import { PurchaseOrdersResolver } from './purchase-orders.resolver';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Supplier,
      SupplierProduct,
      PurchaseOrder,
      PurchaseOrderItem,
      Product,
      InventoryTransaction,
    ]),
  ],
  providers: [
    SuppliersService,
    PurchaseOrdersService,
    SuppliersResolver,
    PurchaseOrdersResolver,
  ],
  exports: [
    SuppliersService,
    PurchaseOrdersService,
  ],
})
export class SuppliersModule {}
