import { Resolver, Query, Mutation, Args, Int } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { InventoryService } from './inventory.service';
import { Product } from './entities/product.entity';
import { CreateProductInput } from './dto/create-product.input';
import { UpdateProductInput } from './dto/update-product.input';

@Resolver(() => Product)
export class ProductResolver {
  constructor(private readonly service: InventoryService) {}

  @Mutation(() => Product)
  @UseGuards(JwtAuthGuard)
  createProduct(@Args('data') data: CreateProductInput) {
    return this.service.createProduct(data);
  }

  @Mutation(() => Product)
  @UseGuards(JwtAuthGuard)
  updateProduct(@Args('data') data: UpdateProductInput) {
    return this.service.updateProduct(data);
  }

  @Mutation(() => Boolean)
  @UseGuards(JwtAuthGuard)
  removeProduct(@Args('id', { type: () => Int }) id: number) {
    return this.service.removeProduct(id).then(() => true);
  }

  @Query(() => [Product])
  @UseGuards(JwtAuthGuard)
  products() {
    return this.service.findAllProducts();
  }

  @Query(() => Product, { nullable: true })
  @UseGuards(JwtAuthGuard)
  product(@Args('id', { type: () => Int }) id: number) {
    return this.service.findProduct(id);
  }

  @Query(() => String, { nullable: true })
  @UseGuards(JwtAuthGuard)
  async productProfitability(@Args('id', { type: () => Int }) id: number) {
    const profitability = await this.service.getProductProfitability(id);
    return JSON.stringify(profitability);
  }

  @Query(() => String)
  @UseGuards(JwtAuthGuard)
  async topProfitableProducts(@Args('limit', { type: () => Int, defaultValue: 10 }) limit: number) {
    const products = await this.service.getTopProfitableProducts(limit);
    return JSON.stringify(products);
  }

  @Query(() => String)
  @UseGuards(JwtAuthGuard)
  async inventoryValuation() {
    const valuation = await this.service.getInventoryValuation();
    return JSON.stringify(valuation);
  }
}
