import { Resolver, Query, Mutation, Args, Int } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { PurchaseOrdersService } from './purchase-orders.service';
import { PurchaseOrder, PurchaseOrderStatus } from './entities/purchase-order.entity';
import { PurchaseOrderItem } from './entities/purchase-order-item.entity';
import { CreatePurchaseOrderInput, UpdatePurchaseOrderInput, ReceivePurchaseOrderItemInput, CreatePurchaseOrderItemInput } from './dto/purchase-order.input';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { User } from '../user/user.entity';

@Resolver(() => PurchaseOrder)
@UseGuards(JwtAuthGuard)
export class PurchaseOrdersResolver {
  constructor(private readonly purchaseOrdersService: PurchaseOrdersService) {}

  // Purchase Order Queries

  @Query(() => [PurchaseOrder])
  async purchaseOrders(): Promise<PurchaseOrder[]> {
    return this.purchaseOrdersService.findAll();
  }

  @Query(() => PurchaseOrder)
  async purchaseOrder(@Args('id', { type: () => Int }) id: number): Promise<PurchaseOrder> {
    return this.purchaseOrdersService.findOne(id);
  }

  @Query(() => [PurchaseOrder])
  async purchaseOrdersByStatus(
    @Args('status') status: PurchaseOrderStatus,
  ): Promise<PurchaseOrder[]> {
    return this.purchaseOrdersService.findByStatus(status);
  }

  @Query(() => [PurchaseOrder])
  async purchaseOrdersBySupplier(
    @Args('supplierId', { type: () => Int }) supplierId: number,
  ): Promise<PurchaseOrder[]> {
    return this.purchaseOrdersService.findBySupplier(supplierId);
  }

  @Query(() => [PurchaseOrder])
  async pendingApprovalPurchaseOrders(): Promise<PurchaseOrder[]> {
    return this.purchaseOrdersService.findPendingApproval();
  }

  @Query(() => [PurchaseOrder])
  async overduePurchaseOrders(): Promise<PurchaseOrder[]> {
    return this.purchaseOrdersService.findOverdue();
  }

  // Purchase Order Mutations

  @Mutation(() => PurchaseOrder)
  async createPurchaseOrder(
    @Args('input') input: CreatePurchaseOrderInput,
    // @CurrentUser() user: User, // Comment out until decorator is available
  ): Promise<PurchaseOrder> {
    const userId = 1; // Temporary hardcoded user ID
    return this.purchaseOrdersService.create(input, userId);
  }

  @Mutation(() => PurchaseOrder)
  async updatePurchaseOrder(
    @Args('input') input: UpdatePurchaseOrderInput,
  ): Promise<PurchaseOrder> {
    return this.purchaseOrdersService.update(input);
  }

  @Mutation(() => PurchaseOrder)
  async approvePurchaseOrder(
    @Args('id', { type: () => Int }) id: number,
    @Args('notes', { nullable: true }) notes?: string,
    // @CurrentUser() user: User, // Comment out until decorator is available
  ): Promise<PurchaseOrder> {
    const userId = 1; // Temporary hardcoded user ID
    return this.purchaseOrdersService.approve(id, userId, notes);
  }

  @Mutation(() => PurchaseOrder)
  async rejectPurchaseOrder(
    @Args('id', { type: () => Int }) id: number,
    @Args('reason') reason: string,
    // @CurrentUser() user: User, // Comment out until decorator is available
  ): Promise<PurchaseOrder> {
    const userId = 1; // Temporary hardcoded user ID
    return this.purchaseOrdersService.reject(id, userId, reason);
  }

  @Mutation(() => PurchaseOrder)
  async cancelPurchaseOrder(
    @Args('id', { type: () => Int }) id: number,
    @Args('reason') reason: string,
  ): Promise<PurchaseOrder> {
    return this.purchaseOrdersService.cancel(id, reason);
  }

  // Purchase Order Item Mutations

  @Mutation(() => PurchaseOrderItem)
  async addPurchaseOrderItem(
    @Args('purchaseOrderId', { type: () => Int }) purchaseOrderId: number,
    @Args('input') input: CreatePurchaseOrderItemInput,
  ): Promise<PurchaseOrderItem> {
    return this.purchaseOrdersService.addItem(purchaseOrderId, input);
  }

  @Mutation(() => PurchaseOrderItem)
  async updatePurchaseOrderItem(
    @Args('id', { type: () => Int }) id: number,
    @Args('input') input: Partial<CreatePurchaseOrderItemInput>,
  ): Promise<PurchaseOrderItem> {
    return this.purchaseOrdersService.updateItem(id, input);
  }

  @Mutation(() => Boolean)
  async removePurchaseOrderItem(
    @Args('id', { type: () => Int }) id: number,
  ): Promise<boolean> {
    return this.purchaseOrdersService.removeItem(id);
  }

  @Mutation(() => PurchaseOrderItem)
  async receivePurchaseOrderItem(
    @Args('input') input: ReceivePurchaseOrderItemInput,
    // @CurrentUser() user: User, // Comment out until decorator is available
  ): Promise<PurchaseOrderItem> {
    const userId = 1; // Temporary hardcoded user ID
    return this.purchaseOrdersService.receiveItem(input, userId);
  }

  // Analytics Queries

  @Query(() => Object) // Define proper GraphQL type for analytics
  async purchaseOrderAnalytics(
    @Args('supplierId', { type: () => Int, nullable: true }) supplierId?: number,
    @Args('startDate', { nullable: true }) startDate?: Date,
    @Args('endDate', { nullable: true }) endDate?: Date,
  ) {
    return this.purchaseOrdersService.getPurchaseOrderAnalytics(supplierId, startDate, endDate);
  }
}
