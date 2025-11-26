import { graphql } from './apiClient';
import { logError } from '../utils/frontendLogger';

export async function fetchDashboardMetrics(periodDays: number): Promise<any> {
  const query = `
    query Dashboard($period: Float!) {
      dashboardMetrics(period: $period)
    }
  `;
  try {
    const data = await graphql<{ dashboardMetrics: string }>(query, { period: periodDays });
    return JSON.parse(data.dashboardMetrics || '{}');
  } catch (error) {
    logError(error instanceof Error ? error : new Error('Error fetching dashboard metrics'), { context: 'fetchDashboardMetrics', periodDays });
    return {};
  }
}
