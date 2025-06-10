import { Resolver, Query, Mutation, Args, Int } from '@nestjs/graphql';
import { InventoryService } from './inventory.service';
import { Product } from './entities/product.entity';
import { CreateProductInput } from './dto/create-product.input';
import { UpdateProductInput } from './dto/update-product.input';

@Resolver(() => Product)
export class ProductResolver {
  constructor(private readonly service: InventoryService) {}

  @Mutation(() => Product)
  createProduct(@Args('data') data: CreateProductInput) {
    return this.service.createProduct(data);
  }

  @Mutation(() => Product)
  updateProduct(@Args('data') data: UpdateProductInput) {
    return this.service.updateProduct(data);
  }

  @Mutation(() => Boolean)
  removeProduct(@Args('id', { type: () => Int }) id: number) {
    return this.service.removeProduct(id).then(() => true);
  }

  @Query(() => [Product])
  products() {
    return this.service.findAllProducts();
  }

  @Query(() => Product, { nullable: true })
  product(@Args('id', { type: () => Int }) id: number) {
    return this.service.findProduct(id);
  }
}
