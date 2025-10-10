# 🚀 ML Analytics Implementation Guide

## Phase 1: Installation & Setup

### Step 1: Install Dependencies

**Good News!** ✅ No external dependencies required for Phase 1!

The analytics service uses built-in JavaScript math functions for:
- Statistical calculations (mean, standard deviation)
- Linear regression
- Forecasting algorithms

**Optional (for future phases):**
```bash
cd server
# Only install if you need advanced ML features later
# npm install @tensorflow/tfjs  # Browser-compatible, no build tools needed
```

> **Note:** We're **NOT** using `@tensorflow/tfjs-node` because it requires Visual Studio C++ build tools on Windows. The current implementation uses pure JavaScript statistics which works great for Phase 1!

### Step 2: Register Analytics Module

Add to `server/src/app.module.ts`:

```typescript
import { AdvancedAnalyticsModule } from './analytics/advanced-analytics.module';

@Module({
  imports: [
    // ... existing imports
    AdvancedAnalyticsModule,
  ],
  // ...
})
export class AppModule {}
```

### Step 3: Test the Analytics APIs

#### GraphQL Queries:

```graphql
# Get Product Health Score
query {
  productHealthScore(productId: 1)
}

# Get Demand Forecast
query {
  demandForecast(productId: 1, horizon: 30)
}
```

---

## Frontend Integration

### Step 1: Create Analytics Service

Create `src/services/analyticsService.ts`:

```typescript
import { graphql } from '../utils/inventoryApi';

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

export async function fetchProductHealthScore(productId: number): Promise<ProductHealthScore> {
  const query = `
    query GetProductHealthScore($productId: Int!) {
      productHealthScore(productId: $productId)
    }
  `;

  const response = await graphql<{ productHealthScore: string }>(query, { productId });
  return JSON.parse(response.productHealthScore);
}

export async function fetchDemandForecast(productId: number, horizon: number = 30) {
  const query = `
    query GetDemandForecast($productId: Int!, $horizon: Int) {
      demandForecast(productId: $productId, horizon: $horizon)
    }
  `;

  const response = await graphql<{ demandForecast: string }>(query, { productId, horizon });
  return JSON.parse(response.demandForecast);
}
```

### Step 2: Install Frontend Dependencies

```bash
npm install recharts d3 @types/d3
```

### Step 3: Create Health Score Card Component

Create `src/components/ProductHealthCard.tsx`:

```typescript
import { useEffect, useState } from 'react';
import { fetchProductHealthScore, ProductHealthScore } from '../services/analyticsService';

interface Props {
  productId: number;
}

export default function ProductHealthCard({ productId }: Props) {
  const [score, setScore] = useState<ProductHealthScore | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadScore();
  }, [productId]);

  const loadScore = async () => {
    setLoading(true);
    try {
      const data = await fetchProductHealthScore(productId);
      setScore(data);
    } catch (error) {
      console.error('Failed to load health score:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div>Loading health score...</div>;
  if (!score) return <div>No data available</div>;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'excellent': return '#10b981';
      case 'good': return '#3b82f6';
      case 'warning': return '#f59e0b';
      case 'critical': return '#ef4444';
      default: return '#6b7280';
    }
  };

  return (
    <div style={{ padding: '20px', border: '1px solid #e5e7eb', borderRadius: '8px' }}>
      <h3>{score.productName} - Health Score</h3>
      
      {/* Overall Score */}
      <div style={{ textAlign: 'center', margin: '20px 0' }}>
        <div
          style={{
            fontSize: '48px',
            fontWeight: 'bold',
            color: getStatusColor(score.healthStatus),
          }}
        >
          {score.overallScore}
        </div>
        <div style={{ fontSize: '14px', color: '#6b7280', textTransform: 'uppercase' }}>
          {score.healthStatus}
        </div>
      </div>

      {/* Score Breakdown */}
      <div style={{ marginBottom: '20px' }}>
        <h4>Score Breakdown</h4>
        {Object.entries(score.scoreBreakdown).map(([key, value]) => (
          <div key={key} style={{ marginBottom: '10px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
              <span style={{ textTransform: 'capitalize' }}>
                {key.replace(/([A-Z])/g, ' $1').trim()}
              </span>
              <span>{value}</span>
            </div>
            <div style={{ backgroundColor: '#e5e7eb', height: '8px', borderRadius: '4px' }}>
              <div
                style={{
                  width: `${value}%`,
                  height: '100%',
                  backgroundColor: getStatusColor(
                    value >= 80 ? 'excellent' : value >= 60 ? 'good' : value >= 40 ? 'warning' : 'critical'
                  ),
                  borderRadius: '4px',
                  transition: 'width 0.3s ease',
                }}
              />
            </div>
          </div>
        ))}
      </div>

      {/* Trends */}
      <div style={{ marginBottom: '20px' }}>
        <h4>Trends</h4>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
          <div style={{ textAlign: 'center', padding: '10px', backgroundColor: '#f9fafb', borderRadius: '4px' }}>
            <div style={{ fontSize: '12px', color: '#6b7280' }}>Last 30 Days</div>
            <div style={{ fontSize: '20px', fontWeight: 'bold', color: score.trends.last30Days >= 0 ? '#10b981' : '#ef4444' }}>
              {score.trends.last30Days > 0 ? '+' : ''}{score.trends.last30Days.toFixed(1)}%
            </div>
          </div>
          <div style={{ textAlign: 'center', padding: '10px', backgroundColor: '#f9fafb', borderRadius: '4px' }}>
            <div style={{ fontSize: '12px', color: '#6b7280' }}>Last 90 Days</div>
            <div style={{ fontSize: '20px', fontWeight: 'bold', color: score.trends.last90Days >= 0 ? '#10b981' : '#ef4444' }}>
              {score.trends.last90Days > 0 ? '+' : ''}{score.trends.last90Days.toFixed(1)}%
            </div>
          </div>
          <div style={{ textAlign: 'center', padding: '10px', backgroundColor: '#f9fafb', borderRadius: '4px' }}>
            <div style={{ fontSize: '12px', color: '#6b7280' }}>Year over Year</div>
            <div style={{ fontSize: '20px', fontWeight: 'bold', color: score.trends.yearOverYear >= 0 ? '#10b981' : '#ef4444' }}>
              {score.trends.yearOverYear > 0 ? '+' : ''}{score.trends.yearOverYear.toFixed(1)}%
            </div>
          </div>
        </div>
      </div>

      {/* Insights */}
      {score.insights.length > 0 && (
        <div style={{ marginBottom: '20px' }}>
          <h4>💡 Insights</h4>
          <ul style={{ margin: 0, paddingLeft: '20px' }}>
            {score.insights.map((insight, i) => (
              <li key={i} style={{ marginBottom: '5px', fontSize: '14px' }}>
                {insight}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Action Items */}
      {score.actionItems.length > 0 && (
        <div>
          <h4>🎯 Recommended Actions</h4>
          {score.actionItems.map((item, i) => (
            <div
              key={i}
              style={{
                padding: '10px',
                marginBottom: '10px',
                backgroundColor: '#f9fafb',
                borderLeft: `4px solid ${
                  item.priority === 'high' ? '#ef4444' : item.priority === 'medium' ? '#f59e0b' : '#3b82f6'
                }`,
                borderRadius: '4px',
              }}
            >
              <div style={{ fontWeight: 'bold', marginBottom: '5px' }}>
                {item.action}
              </div>
              <div style={{ fontSize: '12px', color: '#6b7280' }}>
                Impact: {item.impact}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
```

---

## Usage Examples

### In Inventory Page

Add health scores to inventory list:

```typescript
import ProductHealthCard from '../components/ProductHealthCard';

// In your inventory component
<ProductHealthCard productId={selectedProduct.id} />
```

### In Dashboard

Show top/bottom products by health score

---

## Testing

### 1. Backend Tests

Create `server/src/analytics/advanced-analytics.service.spec.ts`:

```typescript
import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { AdvancedAnalyticsService } from './advanced-analytics.service';
import { Product } from '../inventory/entities/product.entity';
import { InventoryTransaction } from '../inventory/entities/inventory-transaction.entity';

describe('AdvancedAnalyticsService', () => {
  let service: AdvancedAnalyticsService;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        AdvancedAnalyticsService,
        {
          provide: getRepositoryToken(Product),
          useValue: {
            findOne: jest.fn(),
            find: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(InventoryTransaction),
          useValue: {
            find: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<AdvancedAnalyticsService>(AdvancedAnalyticsService);
  });

  it('should calculate health score', async () => {
    // Add test implementation
    expect(service).toBeDefined();
  });
});
```

### 2. Integration Testing

```bash
# Start backend
cd server
npm run start:dev

# Test GraphQL queries in playground
http://localhost:3001/graphql
```

---

## Performance Optimization

### 1. Caching

```typescript
import { CACHE_MANAGER, Inject } from '@nestjs/common';
import { Cache } from 'cache-manager';

@Injectable()
export class AdvancedAnalyticsService {
  constructor(
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
    // ... other dependencies
  ) {}

  async calculateProductHealthScore(productId: number): Promise<ProductHealthScore> {
    const cacheKey = `health_score_${productId}`;
    const cached = await this.cacheManager.get<ProductHealthScore>(cacheKey);
    
    if (cached) {
      return cached;
    }

    const score = await this.computeHealthScore(productId);
    await this.cacheManager.set(cacheKey, score, 3600); // Cache for 1 hour
    
    return score;
  }
}
```

### 2. Background Jobs

For expensive computations, use Bull queue:

```bash
npm install @nestjs/bull bull
```

---

## Next Steps

1. ✅ Install dependencies
2. ✅ Test health score calculation
3. ✅ Integrate frontend components
4. ⏳ Implement anomaly detection (Phase 2)
5. ⏳ Add inventory optimization (Phase 2)
6. ⏳ Implement advanced forecasting models (Phase 3)

---

## Troubleshooting

### Issue: Type errors with simple-statistics

**Solution:**
```bash
npm install --save-dev @types/simple-statistics
```

If types don't exist, create `server/src/types/simple-statistics.d.ts`:

```typescript
declare module 'simple-statistics' {
  export function mean(values: number[]): number;
  export function standardDeviation(values: number[]): number;
  export function linearRegression(data: Array<{ x: number; y: number }>): { m: number; b: number };
  // Add other functions as needed
}
```

### Issue: GraphQL returns string instead of object

**Solution:** The resolver currently returns JSON string. Update GraphQL schema or parse on frontend.

---

**Last Updated:** October 10, 2025
