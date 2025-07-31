import { Args, Int, Mutation, Query, Resolver } from '@nestjs/graphql';
import { PriceHistoryService } from './price-history.service';
import { PriceHistory } from './entities/price-history.entity';
import { CreatePriceHistoryInput } from './dto/create-price-history.input';

@Resolver(() => PriceHistory)
export class PriceHistoryResolver {
  constructor(private readonly priceHistoryService: PriceHistoryService) {}

  @Mutation(() => PriceHistory)
  async createPriceHistory(
    @Args('input') input: CreatePriceHistoryInput,
  ): Promise<PriceHistory> {
    return this.priceHistoryService.create(input);
  }

  @Query(() => [PriceHistory])
  async priceHistoryByProduct(
    @Args('productId', { type: () => Int }) productId: number,
  ): Promise<PriceHistory[]> {
    return this.priceHistoryService.findByProduct(productId);
  }

  @Query(() => [PriceHistory])
  async priceHistoryByType(
    @Args('productId', { type: () => Int }) productId: number,
    @Args('priceType') priceType: string,
  ): Promise<PriceHistory[]> {
    return this.priceHistoryService.findByPriceType(productId, priceType);
  }

  @Query(() => PriceHistory, { nullable: true })
  async latestPrice(
    @Args('productId', { type: () => Int }) productId: number,
    @Args('priceType') priceType: string,
  ): Promise<PriceHistory | null> {
    return this.priceHistoryService.getLatestPrice(productId, priceType);
  }

  @Query(() => String, { nullable: true })
  async priceStatistics(
    @Args('productId', { type: () => Int }) productId: number,
    @Args('priceType') priceType: string,
  ) {
    const stats = await this.priceHistoryService.getPriceStatistics(productId, priceType);
    return JSON.stringify(stats);
  }
}
