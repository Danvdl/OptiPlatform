import { Resolver, Query, Mutation, Args, Int } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { TenantId } from '../common/tenant.decorator';
import { InventoryService } from './inventory.service';
import { Product } from './entities/product.entity';
import { CreateProductInput } from './dto/create-product.input';
import { UpdateProductInput } from './dto/update-product.input';

@Resolver(() => Product)
export class ProductResolver {
  constructor(private readonly service: InventoryService) {}

  @Mutation(() => Product)
  @UseGuards(JwtAuthGuard)
  createProduct(@Args('data') data: CreateProductInput, @TenantId() tenantId: string) {
    return this.service.createProduct(data, tenantId);
  }

  @Mutation(() => Product)
  @UseGuards(JwtAuthGuard)
  updateProduct(@Args('data') data: UpdateProductInput, @TenantId() tenantId: string) {
    return this.service.updateProduct(data, tenantId);
  }

  @Mutation(() => Boolean)
  @UseGuards(JwtAuthGuard)
  removeProduct(@Args('id', { type: () => Int }) id: number, @TenantId() tenantId: string) {
    return this.service.removeProduct(id, tenantId).then(() => true);
  }

  @Query(() => [Product])
  @UseGuards(JwtAuthGuard)
  products(@TenantId() tenantId: string) {
    return this.service.findAllProducts(tenantId);
  }

  @Query(() => Product, { nullable: true })
  @UseGuards(JwtAuthGuard)
  product(@Args('id', { type: () => Int }) id: number, @TenantId() tenantId: string) {
    return this.service.findProduct(id, tenantId);
  }

  @Query(() => String, { nullable: true })
  @UseGuards(JwtAuthGuard)
  async productProfitability(@Args('id', { type: () => Int }) id: number, @TenantId() tenantId: string) {
    const profitability = await this.service.getProductProfitability(id, tenantId);
    return JSON.stringify(profitability);
  }

  @Query(() => String)
  @UseGuards(JwtAuthGuard)
  async topProfitableProducts(@Args('limit', { type: () => Int, defaultValue: 10 }) limit: number, @TenantId() tenantId: string) {
    const products = await this.service.getTopProfitableProducts(limit, tenantId);
    return JSON.stringify(products);
  }

  @Query(() => String)
  @UseGuards(JwtAuthGuard)
  async inventoryValuation(@TenantId() tenantId: string) {
    const valuation = await this.service.getInventoryValuation(tenantId);
    return JSON.stringify(valuation);
  }
}
