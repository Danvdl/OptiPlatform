import { Resolver, Query, Mutation, Args, Int } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { InventoryService } from './inventory.service';
import { InventoryTransaction } from './entities/inventory-transaction.entity';
import { CreateInventoryTransactionInput } from './dto/create-inventory-transaction.input';
import { UpdateInventoryTransactionInput } from './dto/update-inventory-transaction.input';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Resolver(() => InventoryTransaction)
export class InventoryTransactionResolver {
  constructor(private readonly service: InventoryService) {}

  @Mutation(() => InventoryTransaction)
  @UseGuards(JwtAuthGuard)
  createTransaction(
    @Args('data') data: CreateInventoryTransactionInput,
    @Context() ctx: any,
  ) {
    return this.service.createTransaction({ ...data, userId: ctx.req.user.userId });
  }

  @Mutation(() => InventoryTransaction)
  @UseGuards(JwtAuthGuard)
  updateTransaction(@Args('data') data: UpdateInventoryTransactionInput) {
    return this.service.updateTransaction(data);
  }

  @Mutation(() => Boolean)
  @UseGuards(JwtAuthGuard)
  removeTransaction(@Args('id', { type: () => Int }) id: number) {
    return this.service.removeTransaction(id).then(() => true);
  }

  @Query(() => [InventoryTransaction])
  @UseGuards(JwtAuthGuard)
  transactions() {
    return this.service.findAllTransactions();
  }

  @Query(() => InventoryTransaction, { nullable: true })
  @UseGuards(JwtAuthGuard)
  transaction(@Args('id', { type: () => Int }) id: number) {
    return this.service.findTransaction(id);
  }
}
