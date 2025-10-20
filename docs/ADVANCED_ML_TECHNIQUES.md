# Advanced ML & Analytics Techniques for OptiPlatform

This document outlines advanced machine learning and analytics techniques that can enhance OptiPlatform's inventory management capabilities.

## 🎯 Currently Implemented (Phase 1)

✅ **Product Health Scoring** - 5 weighted metrics  
✅ **Demand Forecasting** - Exponential smoothing  
✅ **Trend Analysis** - Linear regression for velocity  
✅ **Stock Level Classification** - Risk categorization  
✅ **Custom Statistics** - Pure JavaScript implementation

---

## 🚀 Advanced Techniques (Phase 2+)

### 1. Time Series Forecasting - Advanced

#### 1.1 ARIMA (AutoRegressive Integrated Moving Average)
**Use Case**: Seasonal demand prediction with trend analysis

**Implementation**:
```typescript
// ARIMA(p,d,q) model
// p = autoregressive order
// d = differencing order
// q = moving average order

class ARIMAForecaster {
  // Differencing to make series stationary
  difference(data: number[], order: number = 1): number[] {
    let result = [...data];
    for (let i = 0; i < order; i++) {
      result = result.slice(1).map((val, idx) => val - result[idx]);
    }
    return result;
  }

  // Autocorrelation function
  acf(data: number[], lag: number): number {
    const mean = data.reduce((a, b) => a + b) / data.length;
    const variance = data.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0);
    
    let covariance = 0;
    for (let i = 0; i < data.length - lag; i++) {
      covariance += (data[i] - mean) * (data[i + lag] - mean);
    }
    
    return covariance / variance;
  }

  // Forecast next N periods
  forecast(historical: number[], horizon: number, p: number = 2, d: number = 1, q: number = 1): number[] {
    const stationary = this.difference(historical, d);
    const forecast = [];
    
    // AR component
    for (let i = 0; i < horizon; i++) {
      let prediction = 0;
      for (let j = 1; j <= p && j <= stationary.length; j++) {
        prediction += stationary[stationary.length - j] * (1 / j);
      }
      forecast.push(prediction);
      stationary.push(prediction);
    }
    
    return forecast;
  }
}
```

**Benefits**:
- Handles seasonality (holidays, weekends, month-end)
- Better accuracy for complex patterns
- Confidence intervals for predictions

---

### 2. Anomaly Detection

#### 2.1 Z-Score Based Anomaly Detection
**Use Case**: Detect unusual sales spikes/drops, inventory discrepancies

**Implementation**:
```typescript
class AnomalyDetector {
  detectAnomalies(data: { date: Date; value: number }[], threshold: number = 3): {
    anomalies: Array<{ date: Date; value: number; zScore: number; severity: string }>;
    baseline: { mean: number; stdDev: number };
  } {
    const values = data.map(d => d.value);
    const mean = values.reduce((a, b) => a + b) / values.length;
    const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
    const stdDev = Math.sqrt(variance);
    
    const anomalies = data
      .map((item, idx) => ({
        date: item.date,
        value: item.value,
        zScore: (item.value - mean) / stdDev,
        severity: this.getSeverity(Math.abs((item.value - mean) / stdDev))
      }))
      .filter(item => Math.abs(item.zScore) > threshold);
    
    return {
      anomalies,
      baseline: { mean, stdDev }
    };
  }

  private getSeverity(zScore: number): string {
    if (zScore > 3) return 'critical';
    if (zScore > 2) return 'high';
    if (zScore > 1.5) return 'moderate';
    return 'low';
  }

  // Moving window anomaly detection
  detectWithWindow(data: number[], windowSize: number = 7, threshold: number = 2.5): boolean[] {
    const anomalies: boolean[] = [];
    
    for (let i = windowSize; i < data.length; i++) {
      const window = data.slice(i - windowSize, i);
      const mean = window.reduce((a, b) => a + b) / windowSize;
      const variance = window.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / windowSize;
      const stdDev = Math.sqrt(variance);
      const zScore = Math.abs((data[i] - mean) / stdDev);
      
      anomalies.push(zScore > threshold);
    }
    
    return anomalies;
  }
}
```

**API Endpoint**:
```graphql
type AnomalyAlert {
  productId: Int!
  productName: String!
  date: DateTime!
  expectedValue: Float!
  actualValue: Float!
  deviation: Float!
  severity: String!
  recommendation: String!
}

query {
  detectInventoryAnomalies(
    startDate: "2025-09-01"
    endDate: "2025-10-21"
    threshold: 2.5
  )
}
```

---

### 3. Market Basket Analysis

#### 3.1 Apriori Algorithm
**Use Case**: "Customers who bought X also bought Y"

**Implementation**:
```typescript
interface TransactionItem {
  transactionId: number;
  productIds: number[];
}

interface AssociationRule {
  antecedent: number[]; // If customer buys these...
  consequent: number[]; // They likely buy these
  support: number; // How often both appear together
  confidence: number; // Probability of consequent given antecedent
  lift: number; // How much more likely than random
}

class MarketBasketAnalyzer {
  // Find frequent itemsets
  findFrequentItemsets(
    transactions: TransactionItem[],
    minSupport: number = 0.05
  ): Map<string, number> {
    const itemCounts = new Map<string, number>();
    const totalTransactions = transactions.length;
    
    // Count single items
    transactions.forEach(txn => {
      txn.productIds.forEach(productId => {
        const key = String(productId);
        itemCounts.set(key, (itemCounts.get(key) || 0) + 1);
      });
    });
    
    // Count pairs
    transactions.forEach(txn => {
      for (let i = 0; i < txn.productIds.length; i++) {
        for (let j = i + 1; j < txn.productIds.length; j++) {
          const key = [txn.productIds[i], txn.productIds[j]].sort().join(',');
          itemCounts.set(key, (itemCounts.get(key) || 0) + 1);
        }
      }
    });
    
    // Filter by minimum support
    const frequent = new Map<string, number>();
    itemCounts.forEach((count, itemset) => {
      const support = count / totalTransactions;
      if (support >= minSupport) {
        frequent.set(itemset, support);
      }
    });
    
    return frequent;
  }

  // Generate association rules
  generateRules(
    transactions: TransactionItem[],
    minConfidence: number = 0.6
  ): AssociationRule[] {
    const rules: AssociationRule[] = [];
    const frequent = this.findFrequentItemsets(transactions, 0.01);
    
    frequent.forEach((support, itemset) => {
      const items = itemset.split(',').map(Number);
      if (items.length < 2) return;
      
      // For each subset, create a rule
      for (let i = 0; i < items.length; i++) {
        const antecedent = [items[i]];
        const consequent = items.filter((_, idx) => idx !== i);
        
        const antecedentSupport = this.getSupport(transactions, antecedent);
        const confidence = support / antecedentSupport;
        const consequentSupport = this.getSupport(transactions, consequent);
        const lift = support / (antecedentSupport * consequentSupport);
        
        if (confidence >= minConfidence) {
          rules.push({
            antecedent,
            consequent,
            support,
            confidence,
            lift
          });
        }
      }
    });
    
    return rules.sort((a, b) => b.lift - a.lift);
  }

  private getSupport(transactions: TransactionItem[], items: number[]): number {
    const count = transactions.filter(txn =>
      items.every(item => txn.productIds.includes(item))
    ).length;
    return count / transactions.length;
  }
}
```

**GraphQL API**:
```graphql
type ProductRecommendation {
  productId: Int!
  productName: String!
  confidence: Float!
  lift: Float!
  reasoning: String!
}

query {
  getProductRecommendations(
    productId: 1
    minConfidence: 0.6
    limit: 5
  )
}
```

---

### 4. ABC/XYZ Analysis

#### 4.1 Multi-Dimensional Inventory Classification
**Use Case**: Prioritize inventory management efforts

**Implementation**:
```typescript
interface ProductClassification {
  productId: number;
  abcClass: 'A' | 'B' | 'C'; // Revenue importance
  xyzClass: 'X' | 'Y' | 'Z'; // Demand variability
  strategy: string;
  priority: number;
}

class InventoryClassifier {
  classifyProducts(products: Array<{
    id: number;
    revenue: number;
    demandHistory: number[];
  }>): ProductClassification[] {
    // ABC Analysis (by revenue)
    const sortedByRevenue = [...products].sort((a, b) => b.revenue - a.revenue);
    const totalRevenue = products.reduce((sum, p) => sum + p.revenue, 0);
    
    let cumulativeRevenue = 0;
    const abcClasses = new Map<number, 'A' | 'B' | 'C'>();
    
    sortedByRevenue.forEach(product => {
      cumulativeRevenue += product.revenue;
      const percentage = (cumulativeRevenue / totalRevenue) * 100;
      
      if (percentage <= 80) {
        abcClasses.set(product.id, 'A'); // Top 20% products = 80% revenue
      } else if (percentage <= 95) {
        abcClasses.set(product.id, 'B'); // Next 30% = 15% revenue
      } else {
        abcClasses.set(product.id, 'C'); // Bottom 50% = 5% revenue
      }
    });
    
    // XYZ Analysis (by demand variability)
    const xyzClasses = new Map<number, 'X' | 'Y' | 'Z'>();
    
    products.forEach(product => {
      const cv = this.coefficientOfVariation(product.demandHistory);
      
      if (cv < 0.5) {
        xyzClasses.set(product.id, 'X'); // Low variability, predictable
      } else if (cv < 1.0) {
        xyzClasses.set(product.id, 'Y'); // Medium variability
      } else {
        xyzClasses.set(product.id, 'Z'); // High variability, unpredictable
      }
    });
    
    // Combine classifications and assign strategies
    return products.map(product => {
      const abc = abcClasses.get(product.id)!;
      const xyz = xyzClasses.get(product.id)!;
      const strategy = this.getStrategy(abc, xyz);
      const priority = this.getPriority(abc, xyz);
      
      return {
        productId: product.id,
        abcClass: abc,
        xyzClass: xyz,
        strategy,
        priority
      };
    });
  }

  private coefficientOfVariation(data: number[]): number {
    const mean = data.reduce((a, b) => a + b) / data.length;
    const variance = data.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / data.length;
    const stdDev = Math.sqrt(variance);
    return stdDev / mean;
  }

  private getStrategy(abc: string, xyz: string): string {
    const strategies: Record<string, string> = {
      'AX': 'Optimize stock levels, frequent review, automated reordering',
      'AY': 'Safety stock, weekly review, supplier relationship',
      'AZ': 'High safety stock, daily monitoring, multiple suppliers',
      'BX': 'Standard EOQ, monthly review',
      'BY': 'Moderate safety stock, bi-weekly review',
      'BZ': 'Flexible ordering, risk management',
      'CX': 'Low stock, quarterly review, consider dropshipping',
      'CY': 'Minimal safety stock, review as needed',
      'CZ': 'Stock on demand, consider discontinuation'
    };
    return strategies[abc + xyz] || 'Standard management';
  }

  private getPriority(abc: string, xyz: string): number {
    const priorities: Record<string, number> = {
      'AX': 10, 'AY': 9, 'AZ': 8,
      'BX': 7, 'BY': 6, 'BZ': 5,
      'CX': 4, 'CY': 3, 'CZ': 1
    };
    return priorities[abc + xyz] || 5;
  }
}
```

---

### 5. Dynamic Reorder Point Calculation

#### 5.1 ML-Based Safety Stock Optimization
**Use Case**: Calculate optimal reorder points based on lead time variability

**Implementation**:
```typescript
interface ReorderPointResult {
  productId: number;
  currentThreshold: number;
  recommendedThreshold: number;
  safetyStock: number;
  averageDailyDemand: number;
  leadTimeDays: number;
  serviceLevel: number; // 95%, 98%, 99%
  costSavings: number;
}

class ReorderPointOptimizer {
  calculateOptimalReorderPoint(
    productId: number,
    demandHistory: number[],
    leadTimeDays: number,
    serviceLevel: number = 0.95
  ): ReorderPointResult {
    // Calculate demand statistics
    const avgDailyDemand = demandHistory.reduce((a, b) => a + b) / demandHistory.length;
    const demandVariance = demandHistory.reduce(
      (sum, val) => sum + Math.pow(val - avgDailyDemand, 2), 0
    ) / demandHistory.length;
    const demandStdDev = Math.sqrt(demandVariance);
    
    // Z-score for service level
    const zScores: Record<number, number> = {
      0.90: 1.28,
      0.95: 1.65,
      0.98: 2.05,
      0.99: 2.33
    };
    const zScore = zScores[serviceLevel] || 1.65;
    
    // Safety stock calculation
    // SS = Z × σ_demand × √lead_time
    const safetyStock = Math.ceil(zScore * demandStdDev * Math.sqrt(leadTimeDays));
    
    // Reorder point = (Average daily demand × Lead time) + Safety stock
    const recommendedThreshold = Math.ceil((avgDailyDemand * leadTimeDays) + safetyStock);
    
    return {
      productId,
      currentThreshold: 0, // Will be filled from DB
      recommendedThreshold,
      safetyStock,
      averageDailyDemand,
      leadTimeDays,
      serviceLevel,
      costSavings: 0 // Calculate based on holding costs
    };
  }

  // Batch optimize all products
  async optimizeAllProducts(
    products: Array<{ id: number; demandHistory: number[] }>,
    defaultLeadTime: number = 7
  ): Promise<ReorderPointResult[]> {
    return products.map(product =>
      this.calculateOptimalReorderPoint(
        product.id,
        product.demandHistory,
        defaultLeadTime,
        0.95
      )
    );
  }
}
```

---

### 6. Sentiment Analysis for Product Reviews

#### 6.1 Simple Sentiment Scoring
**Use Case**: Analyze customer feedback on products

**Implementation**:
```typescript
class SentimentAnalyzer {
  private positiveWords = new Set([
    'good', 'great', 'excellent', 'amazing', 'love', 'best', 'perfect',
    'awesome', 'fantastic', 'wonderful', 'quality', 'recommend', 'happy'
  ]);

  private negativeWords = new Set([
    'bad', 'poor', 'terrible', 'awful', 'hate', 'worst', 'broken',
    'defective', 'disappointed', 'waste', 'useless', 'cheap', 'unreliable'
  ]);

  analyzeSentiment(text: string): {
    score: number; // -1 to 1
    sentiment: 'positive' | 'negative' | 'neutral';
    confidence: number;
  } {
    const words = text.toLowerCase().split(/\W+/);
    let positiveCount = 0;
    let negativeCount = 0;

    words.forEach(word => {
      if (this.positiveWords.has(word)) positiveCount++;
      if (this.negativeWords.has(word)) negativeCount++;
    });

    const totalSentimentWords = positiveCount + negativeCount;
    const score = totalSentimentWords > 0
      ? (positiveCount - negativeCount) / totalSentimentWords
      : 0;

    let sentiment: 'positive' | 'negative' | 'neutral';
    if (score > 0.2) sentiment = 'positive';
    else if (score < -0.2) sentiment = 'negative';
    else sentiment = 'neutral';

    const confidence = totalSentimentWords / words.length;

    return { score, sentiment, confidence };
  }
}
```

---

## 📊 Recommended Implementation Priority

### Phase 2 (Next Sprint):
1. **Anomaly Detection** - High value, low complexity
2. **ABC/XYZ Classification** - Strategic inventory management
3. **Dynamic Reorder Points** - Cost savings

### Phase 3:
4. **Market Basket Analysis** - Cross-selling opportunities
5. **ARIMA Forecasting** - Better accuracy for seasonal products

### Phase 4:
6. **Sentiment Analysis** - Customer insights
7. **Price Optimization** - Revenue maximization

---

## 🔧 Integration Architecture

```typescript
// server/src/analytics/advanced-analytics.service.ts

@Injectable()
export class AdvancedAnalyticsService {
  // Phase 1 (Current)
  async calculateProductHealthScore(productId: number) { ... }
  async forecastDemand(productId: number, horizon: number) { ... }
  
  // Phase 2 (Next)
  async detectAnomalies(productId: number, threshold: number) { ... }
  async classifyInventory() { ... }
  async optimizeReorderPoints() { ... }
  
  // Phase 3
  async getProductRecommendations(productId: number) { ... }
  async forecastARIMA(productId: number, horizon: number) { ... }
  
  // Phase 4
  async analyzePricingOpportunities() { ... }
  async getCustomerSentiment(productId: number) { ... }
}
```

---

## 📈 Success Metrics

Track these KPIs to measure ML impact:

1. **Forecast Accuracy**: MAPE (Mean Absolute Percentage Error) < 15%
2. **Stockout Reduction**: Decrease by 30%
3. **Inventory Turnover**: Increase by 20%
4. **Holding Costs**: Reduce by 25%
5. **Cross-sell Revenue**: Increase by 15%
6. **Anomaly Detection Rate**: Catch 90% of issues early

---

## 🚀 Next Steps

1. Review Phase 2 techniques with team
2. Prioritize based on business impact
3. Start with Anomaly Detection (quick win)
4. Implement ABC/XYZ for strategic planning
5. A/B test ML recommendations vs. manual decisions

---

## 📚 Additional Resources

- **ARIMA**: "Time Series Analysis" by Box & Jenkins
- **Market Basket**: "Introduction to Data Mining" by Tan et al.
- **Inventory Optimization**: "Inventory Management Explained" by David J. Piasecki
- **ML for Retail**: "Data Science for Supply Chain Forecasting" by Nicolas Vandeput
