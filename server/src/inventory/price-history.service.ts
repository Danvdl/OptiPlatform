import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PriceHistory } from './entities/price-history.entity';
import { CreatePriceHistoryInput } from './dto/create-price-history.input';

@Injectable()
export class PriceHistoryService {
  constructor(
    @InjectRepository(PriceHistory)
    private priceHistoryRepository: Repository<PriceHistory>,
  ) {}

  async create(input: CreatePriceHistoryInput): Promise<PriceHistory> {
    const priceHistory = this.priceHistoryRepository.create(input);
    return this.priceHistoryRepository.save(priceHistory);
  }

  async findByProduct(productId: number): Promise<PriceHistory[]> {
    return this.priceHistoryRepository.find({
      where: { productId },
      order: { changedAt: 'DESC' },
      relations: ['product', 'user'],
    });
  }

  async findByPriceType(productId: number, priceType: string): Promise<PriceHistory[]> {
    return this.priceHistoryRepository.find({
      where: { productId, priceType },
      order: { changedAt: 'DESC' },
      relations: ['product', 'user'],
    });
  }

  async getLatestPrice(productId: number, priceType: string): Promise<PriceHistory | null> {
    return this.priceHistoryRepository.findOne({
      where: { productId, priceType },
      order: { changedAt: 'DESC' },
      relations: ['product', 'user'],
    });
  }

  async trackPriceChange(
    productId: number,
    priceType: 'purchase' | 'sale',
    oldPrice: number,
    newPrice: number,
    userId?: number,
    reason?: string,
    currency = 'USD'
  ): Promise<PriceHistory> {
    const priceHistory = this.priceHistoryRepository.create({
      productId,
      userId,
      priceType,
      oldPrice,
      newPrice,
      currency,
      reason,
    });
    
    return this.priceHistoryRepository.save(priceHistory);
  }

  async getPriceStatistics(productId: number, priceType: string) {
    const prices = await this.priceHistoryRepository.find({
      where: { productId, priceType },
      order: { changedAt: 'ASC' },
    });

    if (prices.length === 0) {
      return null;
    }

    const priceValues = prices.map(p => p.newPrice);
    const minPrice = Math.min(...priceValues);
    const maxPrice = Math.max(...priceValues);
    const avgPrice = priceValues.reduce((a, b) => a + b, 0) / priceValues.length;
    const currentPrice = prices[prices.length - 1].newPrice;

    return {
      minPrice,
      maxPrice,
      avgPrice,
      currentPrice,
      totalChanges: prices.length,
      firstRecorded: prices[0].changedAt,
      lastUpdated: prices[prices.length - 1].changedAt,
    };
  }
}
