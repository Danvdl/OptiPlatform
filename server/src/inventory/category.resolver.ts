import { Resolver, Query, Mutation, Args, Int } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { TenantId } from '../common/tenant.decorator';
import { InventoryService } from './inventory.service';
import { Category } from './entities/category.entity';
import { CreateCategoryInput } from './dto/create-category.input';
import { UpdateCategoryInput } from './dto/update-category.input';

@Resolver(() => Category)
export class CategoryResolver {
  constructor(private readonly service: InventoryService) {}

  @Mutation(() => Category)
  // Temporary test endpoint without auth for database testing
  testCreateCategory(@Args('name') name: string) {
    // NOTE: This test endpoint uses a hardcoded tenantId - should be removed in production
    return this.service.createCategory({ name, description: 'Test category from API' }, 'test-tenant-id');
  }

  @Query(() => [Category])
  @UseGuards(JwtAuthGuard)
  categories(@TenantId() tenantId: string) {
    return this.service.findAllCategories(tenantId);
  }

  @Mutation(() => Category)
  @UseGuards(JwtAuthGuard)
  createCategory(@Args('data') data: CreateCategoryInput, @TenantId() tenantId: string) {
    return this.service.createCategory(data, tenantId);
  }

  @Mutation(() => Category)
  @UseGuards(JwtAuthGuard)
  updateCategory(@Args('data') data: UpdateCategoryInput, @TenantId() tenantId: string) {
    return this.service.updateCategory(data, tenantId);
  }

  @Mutation(() => Boolean)
  @UseGuards(JwtAuthGuard)
  removeCategory(@Args('id', { type: () => Int }) id: number, @TenantId() tenantId: string) {
    return this.service.removeCategory(id, tenantId).then(() => true);
  }

  @Query(() => Category, { nullable: true })
  @UseGuards(JwtAuthGuard)
  category(@Args('id', { type: () => Int }) id: number, @TenantId() tenantId: string) {
    return this.service.findCategory(id, tenantId);
  }
}
