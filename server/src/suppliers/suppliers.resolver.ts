import { Resolver, Query, Mutation, Args, Int } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { SuppliersService } from './suppliers.service';
import { Supplier } from './entities/supplier.entity';
import { SupplierProduct } from './entities/supplier-product.entity';
import { CreateSupplierInput, UpdateSupplierInput } from './dto/supplier.input';
import { CreateSupplierProductInput, UpdateSupplierProductInput, SupplierPriceComparisonInput } from './dto/supplier-product.input';
import { SupplierPriceComparison, LowStockProduct, SupplierPerformanceMetrics } from './dto/supplier-response.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { TenantId } from '../common/tenant.decorator';
import { User } from '../user/user.entity';

@Resolver(() => Supplier)
@UseGuards(JwtAuthGuard)
export class SuppliersResolver {
  constructor(private readonly suppliersService: SuppliersService) {}

  // Supplier Queries

  @Query(() => [Supplier])
  async suppliers(@TenantId() tenantId: string): Promise<Supplier[]> {
    return this.suppliersService.findAllSuppliers(tenantId);
  }

  @Query(() => Supplier)
  async supplier(@Args('id', { type: () => Int }) id: number, @TenantId() tenantId: string): Promise<Supplier> {
    return this.suppliersService.findSupplier(id, tenantId);
  }

  @Query(() => [Supplier])
  async activeSuppliers(@TenantId() tenantId: string): Promise<Supplier[]> {
    return this.suppliersService.findActiveSuppliers(tenantId);
  }

  // Supplier Mutations

  @Mutation(() => Supplier)
  async createSupplier(
    @Args('input', { type: () => CreateSupplierInput }) input: CreateSupplierInput,
    @TenantId() tenantId: string,
  ): Promise<Supplier> {
    return this.suppliersService.createSupplier(input, tenantId);
  }

  @Mutation(() => Supplier)
  async updateSupplier(
    @Args('input', { type: () => UpdateSupplierInput }) input: UpdateSupplierInput,
    @TenantId() tenantId: string,
  ): Promise<Supplier> {
    return this.suppliersService.updateSupplier(input, tenantId);
  }

  @Mutation(() => Boolean)
  async deleteSupplier(
    @Args('id', { type: () => Int }) id: number,
    @TenantId() tenantId: string,
  ): Promise<boolean> {
    return this.suppliersService.deleteSupplier(id, tenantId);
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

  @Query(() => [SupplierPriceComparison])
  async compareSupplierPrices(
    @Args('input', { type: () => SupplierPriceComparisonInput }) input: SupplierPriceComparisonInput,
  ): Promise<SupplierPriceComparison[]> {
    return this.suppliersService.compareSupplierPrices(input);
  }

  // Supplier Product Mutations

  @Mutation(() => SupplierProduct)
  async createSupplierProduct(
    @Args('input', { type: () => CreateSupplierProductInput }) input: CreateSupplierProductInput,
    // @CurrentUser() user: User, // Comment out until decorator is available
  ): Promise<SupplierProduct> {
    return this.suppliersService.createSupplierProduct(input);
  }

  @Mutation(() => SupplierProduct)
  async updateSupplierProduct(
    @Args('input', { type: () => UpdateSupplierProductInput }) input: UpdateSupplierProductInput,
    // @CurrentUser() user: User, // Comment out until decorator is available
  ): Promise<SupplierProduct> {
    return this.suppliersService.updateSupplierProduct(input);
  }

  // Auto-restock Queries

  @Query(() => [LowStockProduct])
  async lowStockProducts(): Promise<LowStockProduct[]> {
    return this.suppliersService.checkLowStockProducts();
  }

  // Analytics Queries

  @Query(() => SupplierPerformanceMetrics)
  async supplierPerformance(
    @Args('supplierId', { type: () => Int }) supplierId: number,
    @TenantId() tenantId: string,
  ): Promise<SupplierPerformanceMetrics> {
    return this.suppliersService.getSupplierPerformanceMetrics(supplierId, tenantId);
  }
}
