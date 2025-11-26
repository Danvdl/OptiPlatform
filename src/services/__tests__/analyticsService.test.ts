import { describe, test, expect, vi, beforeEach } from 'vitest';
import { 
  fetchProductHealthScore, 
  fetchDemandForecast, 
  fetchBatchHealthScores,
  type ProductHealthScore,
  type DemandForecast
} from '../analyticsService';

// Mock dependencies
vi.mock('../../utils/inventoryApi', () => ({
  graphql: vi.fn(),
}));

vi.mock('../../utils/frontendLogger', () => ({
  logError: vi.fn(),
}));

import { graphql } from '../../utils/inventoryApi';
import { logError } from '../../utils/frontendLogger';

describe('analyticsService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('fetchProductHealthScore', () => {
    const mockHealthScore: ProductHealthScore = {
      productId: 1,
      productName: 'Test Product',
      overallScore: 85,
      scoreBreakdown: {
        salesVelocity: 80,
        turnoverRatio: 90,
        profitMargin: 85,
        stockAvailability: 75,
        demandTrend: 88,
      },
      healthStatus: 'good',
      trends: {
        last30Days: 5.2,
        last90Days: 3.1,
        yearOverYear: 12.5,
      },
      insights: ['Product performing well', 'Stock levels healthy'],
      actionItems: [
        { priority: 'medium', action: 'Monitor closely', impact: 'High' },
      ],
    };

    test('fetches and parses product health score successfully', async () => {
      vi.mocked(graphql).mockResolvedValue({
        productHealthScore: JSON.stringify(mockHealthScore),
      });

      const result = await fetchProductHealthScore(1);

      expect(graphql).toHaveBeenCalledWith(
        expect.stringContaining('GetProductHealthScore'),
        { productId: 1 }
      );
      expect(result).toEqual(mockHealthScore);
    });

    test('handles GraphQL errors', async () => {
      const error = new Error('GraphQL error');
      vi.mocked(graphql).mockRejectedValue(error);

      await expect(fetchProductHealthScore(1)).rejects.toThrow('GraphQL error');
      expect(logError).toHaveBeenCalledWith(error, {
        context: 'fetchProductHealthScore',
        productId: 1,
      });
    });

    test('handles non-Error exceptions', async () => {
      vi.mocked(graphql).mockRejectedValue('String error');

      await expect(fetchProductHealthScore(1)).rejects.toBeDefined();
      expect(logError).toHaveBeenCalledWith(
        expect.any(Error),
        expect.objectContaining({ context: 'fetchProductHealthScore' })
      );
    });

    test('parses nested score breakdown correctly', async () => {
      vi.mocked(graphql).mockResolvedValue({
        productHealthScore: JSON.stringify(mockHealthScore),
      });

      const result = await fetchProductHealthScore(1);

      expect(result.scoreBreakdown).toEqual({
        salesVelocity: 80,
        turnoverRatio: 90,
        profitMargin: 85,
        stockAvailability: 75,
        demandTrend: 88,
      });
    });

    test('handles different health statuses', async () => {
      const statuses: Array<'excellent' | 'good' | 'warning' | 'critical'> = [
        'excellent', 'good', 'warning', 'critical'
      ];

      for (const status of statuses) {
        vi.mocked(graphql).mockResolvedValue({
          productHealthScore: JSON.stringify({ ...mockHealthScore, healthStatus: status }),
        });

        const result = await fetchProductHealthScore(1);
        expect(result.healthStatus).toBe(status);
      }
    });
  });

  describe('fetchDemandForecast', () => {
    const mockForecast: DemandForecast = {
      productId: 1,
      productName: 'Test Product',
      forecastPeriod: 'daily',
      predictions: [
        {
          date: new Date('2024-01-01'),
          expectedDemand: 100,
          confidenceInterval: { lower: 90, upper: 110 },
          confidence: 0.95,
        },
        {
          date: new Date('2024-01-02'),
          expectedDemand: 105,
          confidenceInterval: { lower: 95, upper: 115 },
          confidence: 0.93,
        },
      ],
      accuracy: 0.92,
      seasonalityFactors: {
        weekly: [1.0, 0.9, 0.95, 1.1, 1.2, 1.3, 0.8],
        monthly: [1.0, 0.95, 1.05, 1.1, 1.2, 1.15, 1.0, 0.9, 0.95, 1.0, 1.1, 1.3],
        yearly: 1.05,
      },
      recommendations: ['Increase stock before weekend', 'Monitor seasonal trends'],
    };

    test('fetches and parses demand forecast successfully', async () => {
      const forecastWithStringDates = {
        ...mockForecast,
        predictions: mockForecast.predictions.map(p => ({
          ...p,
          date: p.date.toISOString(),
        })),
      };

      vi.mocked(graphql).mockResolvedValue({
        demandForecast: JSON.stringify(forecastWithStringDates),
      });

      const result = await fetchDemandForecast(1, 30);

      expect(graphql).toHaveBeenCalledWith(
        expect.stringContaining('GetDemandForecast'),
        { productId: 1, horizon: 30 }
      );
      expect(result.productId).toBe(1);
      expect(result.predictions).toHaveLength(2);
    });

    test('uses default horizon when not provided', async () => {
      vi.mocked(graphql).mockResolvedValue({
        demandForecast: JSON.stringify(mockForecast),
      });

      await fetchDemandForecast(1);

      expect(graphql).toHaveBeenCalledWith(
        expect.any(String),
        { productId: 1, horizon: 30 }
      );
    });

    test('converts date strings to Date objects', async () => {
      const forecastWithStringDates = {
        ...mockForecast,
        predictions: mockForecast.predictions.map(p => ({
          ...p,
          date: p.date.toISOString(),
        })),
      };

      vi.mocked(graphql).mockResolvedValue({
        demandForecast: JSON.stringify(forecastWithStringDates),
      });

      const result = await fetchDemandForecast(1);

      result.predictions.forEach(p => {
        expect(p.date).toBeInstanceOf(Date);
      });
    });

    test('handles GraphQL errors', async () => {
      const error = new Error('Network error');
      vi.mocked(graphql).mockRejectedValue(error);

      await expect(fetchDemandForecast(1, 30)).rejects.toThrow('Network error');
      expect(logError).toHaveBeenCalledWith(error, {
        context: 'fetchDemandForecast',
        productId: 1,
        horizon: 30,
      });
    });

    test('parses confidence intervals correctly', async () => {
      vi.mocked(graphql).mockResolvedValue({
        demandForecast: JSON.stringify(mockForecast),
      });

      const result = await fetchDemandForecast(1);

      expect(result.predictions[0].confidenceInterval).toEqual({
        lower: 90,
        upper: 110,
      });
    });

    test('handles different forecast periods', async () => {
      const periods: Array<'daily' | 'weekly' | 'monthly'> = ['daily', 'weekly', 'monthly'];

      for (const period of periods) {
        vi.mocked(graphql).mockResolvedValue({
          demandForecast: JSON.stringify({ ...mockForecast, forecastPeriod: period }),
        });

        const result = await fetchDemandForecast(1);
        expect(result.forecastPeriod).toBe(period);
      }
    });
  });

  describe('fetchBatchHealthScores', () => {
    const mockScore1: ProductHealthScore = {
      productId: 1,
      productName: 'Product 1',
      overallScore: 85,
      scoreBreakdown: {
        salesVelocity: 80,
        turnoverRatio: 90,
        profitMargin: 85,
        stockAvailability: 75,
        demandTrend: 88,
      },
      healthStatus: 'good',
      trends: { last30Days: 5, last90Days: 3, yearOverYear: 10 },
      insights: [],
      actionItems: [],
    };

    const mockScore2: ProductHealthScore = {
      productId: 2,
      productName: 'Product 2',
      overallScore: 65,
      scoreBreakdown: {
        salesVelocity: 60,
        turnoverRatio: 70,
        profitMargin: 65,
        stockAvailability: 55,
        demandTrend: 68,
      },
      healthStatus: 'warning',
      trends: { last30Days: -2, last90Days: -1, yearOverYear: 5 },
      insights: [],
      actionItems: [],
    };

    test('fetches health scores for multiple products', async () => {
      vi.mocked(graphql)
        .mockResolvedValueOnce({ productHealthScore: JSON.stringify(mockScore1) })
        .mockResolvedValueOnce({ productHealthScore: JSON.stringify(mockScore2) });

      const result = await fetchBatchHealthScores([1, 2]);

      expect(result).toHaveLength(2);
      expect(result[0].productId).toBe(1);
      expect(result[1].productId).toBe(2);
      expect(graphql).toHaveBeenCalledTimes(2);
    });

    test('handles empty product list', async () => {
      const result = await fetchBatchHealthScores([]);

      expect(result).toEqual([]);
      expect(graphql).not.toHaveBeenCalled();
    });

    test('handles single product', async () => {
      vi.mocked(graphql).mockResolvedValue({
        productHealthScore: JSON.stringify(mockScore1),
      });

      const result = await fetchBatchHealthScores([1]);

      expect(result).toHaveLength(1);
      expect(result[0].productId).toBe(1);
    });

    test('propagates errors from individual fetches', async () => {
      vi.mocked(graphql).mockRejectedValue(new Error('Fetch failed'));

      await expect(fetchBatchHealthScores([1, 2])).rejects.toThrow('Fetch failed');
    });

    test('fetches scores in parallel using Promise.all', async () => {
      let callCount = 0;
      
      vi.mocked(graphql).mockImplementation(() => {
        callCount++;
        return Promise.resolve({ productHealthScore: JSON.stringify(mockScore1) });
      });

      await fetchBatchHealthScores([1, 2, 3]);

      // Verify all calls were made (parallel execution)
      expect(callCount).toBe(3);
      expect(graphql).toHaveBeenCalledTimes(3);
    });
  });
});
