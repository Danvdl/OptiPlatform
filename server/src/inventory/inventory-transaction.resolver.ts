import { Resolver, Query, Mutation, Args, Int } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { InventoryService } from './inventory.service';
import { InventoryTransaction, TransactionType } from './entities/inventory-transaction.entity';
import { CreateInventoryTransactionInput } from './dto/create-inventory-transaction.input';
import { UpdateInventoryTransactionInput } from './dto/update-inventory-transaction.input';
import { 
  CreateAdjustmentInput, 
  CreateTransferInput, 
  CreateReturnInput, 
  CreateWasteInput, 
  CreateReservationInput,
  ReleaseReservationInput 
} from './dto/advanced-transaction.input';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Context } from '@nestjs/graphql';

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

  // Advanced Transaction Mutations

  @Mutation(() => InventoryTransaction)
  @UseGuards(JwtAuthGuard)
  createAdjustment(
    @Args('data') data: CreateAdjustmentInput,
    @Context() ctx: any,
  ) {
    return this.service.createAdjustment({ ...data, userId: ctx.req.user.userId });
  }

  @Mutation(() => InventoryTransaction)
  @UseGuards(JwtAuthGuard)
  createTransfer(
    @Args('data') data: CreateTransferInput,
    @Context() ctx: any,
  ) {
    return this.service.createTransfer({ ...data, userId: ctx.req.user.userId });
  }

  @Mutation(() => InventoryTransaction)
  @UseGuards(JwtAuthGuard)
  createReturn(
    @Args('data') data: CreateReturnInput,
    @Context() ctx: any,
  ) {
    return this.service.createReturn({ ...data, userId: ctx.req.user.userId });
  }

  @Mutation(() => InventoryTransaction)
  @UseGuards(JwtAuthGuard)
  createWaste(
    @Args('data') data: CreateWasteInput,
    @Context() ctx: any,
  ) {
    return this.service.createWaste({ ...data, userId: ctx.req.user.userId });
  }

  @Mutation(() => InventoryTransaction)
  @UseGuards(JwtAuthGuard)
  createReservation(
    @Args('data') data: CreateReservationInput,
    @Context() ctx: any,
  ) {
    return this.service.createReservation({ ...data, userId: ctx.req.user.userId });
  }

  @Mutation(() => InventoryTransaction)
  @UseGuards(JwtAuthGuard)
  releaseReservation(
    @Args('data') data: ReleaseReservationInput,
    @Context() ctx: any,
  ) {
    return this.service.releaseReservation({ ...data, userId: ctx.req.user.userId });
  }

  // Advanced Transaction Queries

  @Query(() => [InventoryTransaction])
  @UseGuards(JwtAuthGuard)
  transactionsByType(
    @Args('type', { type: () => TransactionType }) type: TransactionType,
    @Args('limit', { type: () => Int, nullable: true }) limit?: number,
  ) {
    return this.service.getTransactionsByType(type, limit);
  }

  @Query(() => [InventoryTransaction])
  @UseGuards(JwtAuthGuard)
  activeReservations(
    @Args('productId', { type: () => Int, nullable: true }) productId?: number,
  ) {
    return this.service.getActiveReservations(productId);
  }

  @Query(() => [InventoryTransaction])
  @UseGuards(JwtAuthGuard)
  expiredReservations() {
    return this.service.getExpiredReservations();
  }

  @Query(() => Int)
  @UseGuards(JwtAuthGuard)
  reservedStock(
    @Args('productId', { type: () => Int }) productId: number,
  ) {
    return this.service.getReservedStock(productId);
  }

  @Query(() => Int)
  @UseGuards(JwtAuthGuard)
  locationStock(
    @Args('productId', { type: () => Int }) productId: number,
    @Args('locationId', { type: () => Int }) locationId: number,
  ) {
    return this.service.getLocationStock(productId, locationId);
  }
}


