import { graphql } from './apiClient';

export async function fetchDashboardMetrics(periodDays: number): Promise<any> {
  const query = `
    query Dashboard($period: Int!) {
      dashboardMetrics(period: $period)
    }
  `;
  try {
    const data = await graphql<{ dashboardMetrics: string }>(query, { period: periodDays });
    return JSON.parse(data.dashboardMetrics || '{}');
  } catch (error) {
    console.error('Error fetching dashboard metrics:', error);
    return {};
  }
}
