import { Resolver, Query, Mutation, Args, Int } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { InventoryService } from './inventory.service';
import { ProductNote } from './entities/product-note.entity';
import { CreateProductNoteInput } from './dto/create-product-note.input';
import { Context } from '@nestjs/graphql';

@Resolver(() => ProductNote)
export class ProductNoteResolver {
  constructor(private readonly service: InventoryService) {}

  @Mutation(() => ProductNote)
  @UseGuards(JwtAuthGuard)
  createProductNote(
    @Args('data') data: CreateProductNoteInput,
    @Context() ctx: any,
  ) {
    return this.service.createProductNote({ ...data, userId: ctx.req.user.userId });
  }

  @Mutation(() => Boolean)
  @UseGuards(JwtAuthGuard)
  removeProductNote(@Args('id', { type: () => Int }) id: number) {
    return this.service.removeProductNote(id).then(() => true);
  }

  @Query(() => [ProductNote])
  @UseGuards(JwtAuthGuard)
  productNotes(@Args('productId', { type: () => Int }) productId: number) {
    return this.service.findProductNotes(productId);
  }
}
