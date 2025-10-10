import { Resolver, Query, Args, Int } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AdvancedAnalyticsService } from './advanced-analytics.service';

@Resolver()
@UseGuards(JwtAuthGuard)
export class AdvancedAnalyticsResolver {
  constructor(
    private readonly analyticsService: AdvancedAnalyticsService,
  ) {}

  @Query(() => String)
  async productHealthScore(@Args('productId', { type: () => Int }) productId: number) {
    const score = await this.analyticsService.calculateProductHealthScore(productId);
    return JSON.stringify(score);
  }

  @Query(() => String)
  async demandForecast(
    @Args('productId', { type: () => Int }) productId: number,
    @Args('horizon', { type: () => Int, nullable: true }) horizon?: number,
  ) {
    const forecast = await this.analyticsService.forecastDemand(productId, horizon);
    return JSON.stringify(forecast);
  }
}
