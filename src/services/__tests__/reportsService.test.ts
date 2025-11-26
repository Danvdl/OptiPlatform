import { describe, test, expect, vi, beforeEach } from 'vitest';
import { fetchDashboardMetrics } from '../reportsService';

// Mock dependencies
vi.mock('../apiClient', () => ({
  graphql: vi.fn(),
}));

vi.mock('../../utils/frontendLogger', () => ({
  logError: vi.fn(),
}));

import { graphql } from '../apiClient';
import { logError } from '../../utils/frontendLogger';

describe('reportsService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('fetchDashboardMetrics', () => {
    const mockMetrics = {
      totalRevenue: 125000,
      totalOrders: 342,
      averageOrderValue: 365.5,
      topProducts: [
        { id: 1, name: 'Product A', revenue: 45000 },
        { id: 2, name: 'Product B', revenue: 32000 },
      ],
      recentTransactions: 156,
      lowStockItems: 12,
      pendingOrders: 23,
    };

    test('fetches dashboard metrics successfully', async () => {
      vi.mocked(graphql).mockResolvedValue({
        dashboardMetrics: JSON.stringify(mockMetrics),
      });

      const result = await fetchDashboardMetrics(30);

      expect(graphql).toHaveBeenCalledWith(
        expect.stringContaining('Dashboard'),
        { period: 30 }
      );
      expect(result).toEqual(mockMetrics);
    });

    test('parses JSON response correctly', async () => {
      vi.mocked(graphql).mockResolvedValue({
        dashboardMetrics: JSON.stringify(mockMetrics),
      });

      const result = await fetchDashboardMetrics(7);

      expect(result.totalRevenue).toBe(125000);
      expect(result.topProducts).toHaveLength(2);
    });

    test('handles different period values', async () => {
      vi.mocked(graphql).mockResolvedValue({
        dashboardMetrics: JSON.stringify(mockMetrics),
      });

      await fetchDashboardMetrics(7);
      expect(graphql).toHaveBeenCalledWith(expect.any(String), { period: 7 });

      await fetchDashboardMetrics(30);
      expect(graphql).toHaveBeenCalledWith(expect.any(String), { period: 30 });

      await fetchDashboardMetrics(90);
      expect(graphql).toHaveBeenCalledWith(expect.any(String), { period: 90 });
    });

    test('returns empty object on error', async () => {
      const error = new Error('Network error');
      vi.mocked(graphql).mockRejectedValue(error);

      const result = await fetchDashboardMetrics(30);

      expect(result).toEqual({});
      expect(logError).toHaveBeenCalledWith(error, {
        context: 'fetchDashboardMetrics',
        periodDays: 30,
      });
    });

    test('handles non-Error exceptions', async () => {
      vi.mocked(graphql).mockRejectedValue('String error');

      const result = await fetchDashboardMetrics(30);

      expect(result).toEqual({});
      expect(logError).toHaveBeenCalledWith(
        expect.any(Error),
        expect.objectContaining({ context: 'fetchDashboardMetrics' })
      );
    });

    test('handles empty response', async () => {
      vi.mocked(graphql).mockResolvedValue({
        dashboardMetrics: '',
      });

      const result = await fetchDashboardMetrics(30);

      expect(result).toEqual({});
    });

    test('handles null response', async () => {
      vi.mocked(graphql).mockResolvedValue({
        dashboardMetrics: null,
      });

      const result = await fetchDashboardMetrics(30);

      expect(result).toEqual({});
    });

    test('handles malformed JSON gracefully', async () => {
      vi.mocked(graphql).mockResolvedValue({
        dashboardMetrics: 'not valid json',
      });

      const result = await fetchDashboardMetrics(30);

      expect(result).toEqual({});
      expect(logError).toHaveBeenCalled();
    });

    test('handles complex nested metrics', async () => {
      const complexMetrics = {
        ...mockMetrics,
        trends: {
          daily: [100, 120, 115, 130],
          weekly: { current: 500, previous: 480 },
          monthly: { sales: 2000, growth: 5.2 },
        },
      };

      vi.mocked(graphql).mockResolvedValue({
        dashboardMetrics: JSON.stringify(complexMetrics),
      });

      const result = await fetchDashboardMetrics(30);

      expect(result.trends.daily).toEqual([100, 120, 115, 130]);
      expect(result.trends.monthly.growth).toBe(5.2);
    });
  });
});
