import { graphql } from '../utils/inventoryApi';
import { logError } from '../utils/frontendLogger';

// Type definitions
export interface ProductHealthScore {
  productId: number;
  productName: string;
  overallScore: number;
  scoreBreakdown: {
    salesVelocity: number;
    turnoverRatio: number;
    profitMargin: number;
    stockAvailability: number;
    demandTrend: number;
  };
  healthStatus: 'excellent' | 'good' | 'warning' | 'critical';
  trends: {
    last30Days: number;
    last90Days: number;
    yearOverYear: number;
  };
  insights: string[];
  actionItems: Array<{
    priority: 'high' | 'medium' | 'low';
    action: string;
    impact: string;
  }>;
}

export interface DemandForecast {
  productId: number;
  productName: string;
  forecastPeriod: 'daily' | 'weekly' | 'monthly';
  predictions: Array<{
    date: Date;
    expectedDemand: number;
    confidenceInterval: { lower: number; upper: number };
    confidence: number;
  }>;
  accuracy: number;
  seasonalityFactors: {
    weekly: number[];
    monthly: number[];
    yearly: number;
  };
  recommendations: string[];
}

// API Functions
export async function fetchProductHealthScore(productId: number): Promise<ProductHealthScore> {
  const query = `
    query GetProductHealthScore($productId: Int!) {
      productHealthScore(productId: $productId)
    }
  `;

  try {
    const response = await graphql<{ productHealthScore: string }>(query, { productId });
    return JSON.parse(response.productHealthScore);
  } catch (error) {
    logError(error instanceof Error ? error : new Error('Failed to fetch product health score'), { context: 'fetchProductHealthScore', productId });
    throw error;
  }
}

export async function fetchDemandForecast(
  productId: number,
  horizon: number = 30
): Promise<DemandForecast> {
  const query = `
    query GetDemandForecast($productId: Int!, $horizon: Int) {
      demandForecast(productId: $productId, horizon: $horizon)
    }
  `;

  try {
    const response = await graphql<{ demandForecast: string }>(query, { productId, horizon });
    const forecast = JSON.parse(response.demandForecast);
    
    // Parse date strings back to Date objects
    forecast.predictions = forecast.predictions.map((p: any) => ({
      ...p,
      date: new Date(p.date),
    }));
    
    return forecast;
  } catch (error) {
    logError(error instanceof Error ? error : new Error('Failed to fetch demand forecast'), { context: 'fetchDemandForecast', productId, horizon });
    throw error;
  }
}

// Batch fetch health scores for multiple products
export async function fetchBatchHealthScores(productIds: number[]): Promise<ProductHealthScore[]> {
  const promises = productIds.map(id => fetchProductHealthScore(id));
  return Promise.all(promises);
}
