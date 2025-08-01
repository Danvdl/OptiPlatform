import { Resolver, Query, Mutation, Args, Int } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { SuppliersService } from './suppliers.service';
import { Supplier } from './entities/supplier.entity';
import { SupplierProduct } from './entities/supplier-product.entity';
import { CreateSupplierInput, UpdateSupplierInput } from './dto/supplier.input';
import { CreateSupplierProductInput, UpdateSupplierProductInput, SupplierPriceComparisonInput } from './dto/supplier-product.input';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { User } from '../user/user.entity';

@Resolver(() => Supplier)
@UseGuards(JwtAuthGuard)
export class SuppliersResolver {
  constructor(private readonly suppliersService: SuppliersService) {}

  // Supplier Queries

  @Query(() => [Supplier])
  async suppliers(): Promise<Supplier[]> {
    return this.suppliersService.findAllSuppliers();
  }

  @Query(() => Supplier)
  async supplier(@Args('id', { type: () => Int }) id: number): Promise<Supplier> {
    return this.suppliersService.findSupplier(id);
  }

  @Query(() => [Supplier])
  async activeSuppliers(): Promise<Supplier[]> {
    return this.suppliersService.findActiveSuppliers();
  }

  // Supplier Mutations

  @Mutation(() => Supplier)
  async createSupplier(
    @Args('input') input: CreateSupplierInput,
    // @CurrentUser() user: User, // Comment out until decorator is available
  ): Promise<Supplier> {
    return this.suppliersService.createSupplier(input);
  }

  @Mutation(() => Supplier)
  async updateSupplier(
    @Args('input') input: UpdateSupplierInput,
    // @CurrentUser() user: User, // Comment out until decorator is available
  ): Promise<Supplier> {
    return this.suppliersService.updateSupplier(input);
  }

  @Mutation(() => Boolean)
  async deleteSupplier(
    @Args('id', { type: () => Int }) id: number,
    // @CurrentUser() user: User, // Comment out until decorator is available
  ): Promise<boolean> {
    return this.suppliersService.deleteSupplier(id);
  }

  // Supplier Product Queries

  @Query(() => [SupplierProduct])
  async supplierProducts(
    @Args('supplierId', { type: () => Int }) supplierId: number,
  ): Promise<SupplierProduct[]> {
    return this.suppliersService.getSupplierProducts(supplierId);
  }

  @Query(() => [SupplierProduct])
  async productSuppliers(
    @Args('productId', { type: () => Int }) productId: number,
  ): Promise<SupplierProduct[]> {
    return this.suppliersService.getProductSuppliers(productId);
  }

  @Query(() => [Object]) // Define proper GraphQL type for price comparison
  async compareSupplierPrices(
    @Args('input') input: SupplierPriceComparisonInput,
  ) {
    return this.suppliersService.compareSupplierPrices(input);
  }

  // Supplier Product Mutations

  @Mutation(() => SupplierProduct)
  async createSupplierProduct(
    @Args('input') input: CreateSupplierProductInput,
    // @CurrentUser() user: User, // Comment out until decorator is available
  ): Promise<SupplierProduct> {
    return this.suppliersService.createSupplierProduct(input);
  }

  @Mutation(() => SupplierProduct)
  async updateSupplierProduct(
    @Args('input') input: UpdateSupplierProductInput,
    // @CurrentUser() user: User, // Comment out until decorator is available
  ): Promise<SupplierProduct> {
    return this.suppliersService.updateSupplierProduct(input);
  }

  // Auto-restock Queries

  @Query(() => [Object]) // Define proper GraphQL type for low stock products
  async lowStockProducts() {
    return this.suppliersService.checkLowStockProducts();
  }

  // Analytics Queries

  @Query(() => Object) // Define proper GraphQL type for supplier performance
  async supplierPerformance(
    @Args('supplierId', { type: () => Int }) supplierId: number,
  ) {
    return this.suppliersService.getSupplierPerformanceMetrics(supplierId);
  }
}
