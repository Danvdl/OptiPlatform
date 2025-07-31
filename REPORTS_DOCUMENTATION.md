# 📈 Advanced Reporting & Analytics System

## Overview
The OptiPlatform now includes a comprehensive reporting and analytics system that provides deep insights into inventory performance, cost analysis, and business metrics.

## 🚀 Features Implemented

### 1. **Inventory Turnover Reports**
- **Purpose**: Analyze how quickly inventory is sold and restocked
- **Metrics**: Turnover ratio, days to sell, revenue, COGS, profit margins
- **GraphQL Query**: `inventoryTurnoverReport(startDate, endDate)`
- **Export**: `/reports/export/inventory-turnover?format=csv|excel|pdf`

### 2. **Stock Movement Analytics**
- **Purpose**: Track inventory flow patterns and velocity
- **Metrics**: Total in/out, net movement, velocity per day, movement trends
- **GraphQL Query**: `stockMovementAnalytics(startDate, endDate)`
- **Export**: `/reports/export/stock-movement?format=csv|excel|pdf`

### 3. **Low Stock Trend Analysis**
- **Purpose**: Predict stockouts and optimize reorder timing
- **Metrics**: Days until stockout, reorder suggestions, risk assessment
- **GraphQL Query**: `lowStockTrendAnalysis`
- **Export**: `/reports/export/low-stock-trends?format=csv|excel|pdf`

### 4. **Category Performance Reports**
- **Purpose**: Compare performance across product categories
- **Metrics**: Revenue, profit, turnover, top performers by category
- **GraphQL Query**: `categoryPerformanceReport(startDate, endDate)`
- **Export**: `/reports/export/category-performance?format=csv|excel|pdf`

### 5. **Cost Analysis Reports**
- **Purpose**: Track and analyze cost trends and efficiency
- **Metrics**: Purchase costs, cost trends, efficiency metrics
- **GraphQL Query**: `costAnalysisReport(startDate, endDate)`
- **Export**: `/reports/export/cost-analysis?format=csv|excel|pdf`

### 6. **Dashboard Metrics**
- **Purpose**: Comprehensive overview with key performance indicators
- **Includes**: Summary metrics, top performers, alerts, trends
- **GraphQL Query**: `dashboardMetrics(period)`
- **Export**: `/reports/export/dashboard?format=pdf&period=30`

## 📊 GraphQL API Usage

### Example Queries

```graphql
# Get inventory turnover for last 30 days
query {
  inventoryTurnoverReport(
    startDate: "2025-07-01"
    endDate: "2025-07-31"
  )
}

# Get dashboard metrics for last 7 days
query {
  dashboardMetrics(period: 7)
}

# Get low stock analysis
query {
  lowStockTrendAnalysis
}
```

### Response Format
All GraphQL queries return JSON strings that can be parsed on the frontend:

```typescript
const response = await apolloClient.query({
  query: INVENTORY_TURNOVER_QUERY,
  variables: { startDate: "2025-07-01", endDate: "2025-07-31" }
});

const data = JSON.parse(response.data.inventoryTurnoverReport);
```

## 📥 Export Functionality

### Supported Formats
- **CSV**: Spreadsheet-compatible format
- **Excel**: Tab-separated format (.xls)
- **PDF**: HTML-based report (printable)

### Export URLs

```bash
# Inventory Turnover (CSV)
GET /reports/export/inventory-turnover?format=csv&startDate=2025-07-01&endDate=2025-07-31

# Stock Movement (Excel)
GET /reports/export/stock-movement?format=excel&startDate=2025-07-01&endDate=2025-07-31

# Low Stock Trends (PDF)
GET /reports/export/low-stock-trends?format=pdf

# Category Performance (CSV)
GET /reports/export/category-performance?format=csv&startDate=2025-07-01&endDate=2025-07-31

# Cost Analysis (Excel)
GET /reports/export/cost-analysis?format=excel&startDate=2025-07-01&endDate=2025-07-31

# Complete Dashboard Report (PDF)
GET /reports/export/dashboard?format=pdf&period=30
```

## 📈 Key Metrics Explained

### **Turnover Ratio**
- Formula: `Total Sold / Average Stock`
- Higher = Better (faster inventory movement)
- Industry benchmark: 4-6 times per year

### **Days to Sell**
- Formula: `365 / Turnover Ratio`
- Lower = Better (faster sales)
- Helps with cash flow planning

### **Velocity Per Day**
- Formula: `Total Units Sold / Days in Period`
- Shows daily movement rate
- Useful for demand forecasting

### **Stockout Risk**
- **High**: < 7 days until stockout
- **Medium**: 7-14 days until stockout
- **Low**: > 14 days until stockout

### **Profit Margin**
- Formula: `(Revenue - Cost) / Revenue * 100`
- Shows profitability percentage
- Helps identify most profitable products

## 🎯 Business Use Cases

### **1. Inventory Optimization**
- Identify slow-moving products
- Optimize stock levels
- Reduce carrying costs

### **2. Financial Analysis**
- Track cost trends
- Analyze profit margins
- Monitor COGS efficiency

### **3. Demand Forecasting**
- Predict stockouts
- Plan reorders
- Seasonal trend analysis

### **4. Performance Monitoring**
- Category comparison
- Product ranking
- KPI tracking

### **5. Strategic Planning**
- Investment decisions
- Product mix optimization
- Market trend analysis

## 🔧 Frontend Integration

### React Hook Example

```typescript
import { useQuery } from '@apollo/client';
import { DASHBOARD_METRICS_QUERY } from './queries';

function DashboardReports() {
  const { data, loading, error } = useQuery(DASHBOARD_METRICS_QUERY, {
    variables: { period: 30 }
  });

  if (loading) return <div>Loading reports...</div>;
  if (error) return <div>Error: {error.message}</div>;

  const metrics = JSON.parse(data.dashboardMetrics);
  
  return (
    <div>
      <h2>Dashboard Metrics</h2>
      <div className="metrics-grid">
        <MetricCard 
          title="Total Revenue" 
          value={metrics.summary.totalRevenue}
          format="currency"
        />
        <MetricCard 
          title="Gross Profit" 
          value={metrics.summary.grossProfit}
          format="currency"
        />
        {/* More metrics... */}
      </div>
      
      <button onClick={() => downloadReport('pdf')}>
        Download PDF Report
      </button>
    </div>
  );
}
```

### Export Function

```typescript
const downloadReport = async (format: 'csv' | 'excel' | 'pdf') => {
  const url = `/reports/export/dashboard?format=${format}&period=30`;
  window.open(url, '_blank');
};
```

## 📋 Implementation Status

✅ **Completed:**
- All 6 report types implemented
- GraphQL API endpoints
- Export functionality (CSV, Excel, PDF)
- Comprehensive metrics calculations
- Error handling and validation

🔄 **Next Steps:**
- Frontend UI components
- Charts and visualizations
- Scheduled reports
- Email delivery
- Advanced filtering options

## 🚀 Getting Started

1. **Apply the database migration** (if not done already)
2. **Restart your server** to load the new modules
3. **Test GraphQL queries** in the playground
4. **Try export endpoints** in your browser
5. **Build frontend components** to display the reports

The reporting system is now fully operational and ready for integration! 📊
