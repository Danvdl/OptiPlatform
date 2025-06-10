import { Resolver, Query, Mutation, Args, Int } from '@nestjs/graphql';
import { InventoryService } from './inventory.service';
import { InventoryTransaction } from './entities/inventory-transaction.entity';
import { CreateInventoryTransactionInput } from './dto/create-inventory-transaction.input';
import { UpdateInventoryTransactionInput } from './dto/update-inventory-transaction.input';

@Resolver(() => InventoryTransaction)
export class InventoryTransactionResolver {
  constructor(private readonly service: InventoryService) {}

  @Mutation(() => InventoryTransaction)
  createTransaction(@Args('data') data: CreateInventoryTransactionInput) {
    return this.service.createTransaction(data);
  }

  @Mutation(() => InventoryTransaction)
  updateTransaction(@Args('data') data: UpdateInventoryTransactionInput) {
    return this.service.updateTransaction(data);
  }

  @Mutation(() => Boolean)
  removeTransaction(@Args('id', { type: () => Int }) id: number) {
    return this.service.removeTransaction(id).then(() => true);
  }

  @Query(() => [InventoryTransaction])
  transactions() {
    return this.service.findAllTransactions();
  }

  @Query(() => InventoryTransaction, { nullable: true })
  transaction(@Args('id', { type: () => Int }) id: number) {
    return this.service.findTransaction(id);
  }
}
