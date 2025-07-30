import { Resolver, Query, Mutation, Args, Int } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { InventoryService } from './inventory.service';
import { Category } from './entities/category.entity';
import { CreateCategoryInput } from './dto/create-category.input';
import { UpdateCategoryInput } from './dto/update-category.input';

@Resolver(() => Category)
export class CategoryResolver {
  constructor(private readonly service: InventoryService) {}

  @Mutation(() => Category)
  @UseGuards(JwtAuthGuard)
  createCategory(@Args('data') data: CreateCategoryInput) {
    return this.service.createCategory(data);
  }

  @Mutation(() => Category)
  @UseGuards(JwtAuthGuard)
  updateCategory(@Args('data') data: UpdateCategoryInput) {
    return this.service.updateCategory(data);
  }

  @Mutation(() => Boolean)
  @UseGuards(JwtAuthGuard)
  removeCategory(@Args('id', { type: () => Int }) id: number) {
    return this.service.removeCategory(id).then(() => true);
  }

  @Query(() => [Category])
  @UseGuards(JwtAuthGuard)
  categories() {
    return this.service.findAllCategories();
  }

  @Query(() => Category, { nullable: true })
  @UseGuards(JwtAuthGuard)
  category(@Args('id', { type: () => Int }) id: number) {
    return this.service.findCategory(id);
  }
}
