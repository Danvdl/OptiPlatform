# Quick Start: Anomaly Detection Implementation

You now have **Anomaly Detection** implemented in your OptiPlatform! This is a high-value feature that automatically detects unusual patterns in your inventory data.

## 🎯 What It Does

The Anomaly Detection system identifies:
- **Sales Spikes**: Unexpected increases in demand
- **Sales Drops**: Sudden decreases that might indicate problems
- **Velocity Changes**: Products accelerating or decelerating in sales
- **Unusual Patterns**: Any statistical outliers in your data

## 🚀 How to Use

### 1. Test in GraphQL Playground

Start your backend if not running:
```bash
cd server
npm run start:dev
```

Visit: http://localhost:3001/graphql

### 2. Query Examples

#### Detect All Anomalies (Last 30 Days)
```graphql
query {
  detectInventoryAnomalies
}
```

#### Detect Anomalies with Custom Date Range
```graphql
query {
  detectInventoryAnomalies(
    startDate: "2025-09-01"
    endDate: "2025-10-21"
    threshold: 2.5
  )
}
```

#### Detect Anomalies for Specific Product
```graphql
query {
  detectProductAnomalies(
    productId: 1
    threshold: 2.0
  )
}
```

#### Check Velocity Changes
```graphql
query {
  detectVelocityChanges(productId: 1)
}
```

### 3. Understanding the Results

**Response Format**:
```json
{
  "productId": 1,
  "productName": "Premium Laptop",
  "date": "2025-10-15T00:00:00.000Z",
  "expectedValue": 10.5,
  "actualValue": 25,
  "deviation": 138.1,
  "zScore": 3.2,
  "severity": "high",
  "type": "spike",
  "recommendation": "Investigate unusual sales spike for Premium Laptop..."
}
```

**Fields Explained**:
- `zScore`: How many standard deviations from the mean (>2.5 is unusual)
- `severity`: low | moderate | high | critical
- `type`: spike | drop | unusual_pattern
- `deviation`: Percentage difference from expected
- `recommendation`: AI-generated action item

**Threshold Values**:
- `2.0`: More sensitive, catches more anomalies (may include false positives)
- `2.5`: Balanced (recommended default)
- `3.0`: More conservative, only critical anomalies
- `4.0`: Very conservative, only extreme cases

## 📊 Integrate with Frontend

### Create Anomaly Alerts Component

```typescript
// src/services/anomalyService.ts
export async function fetchAnomalies(threshold: number = 2.5) {
  const query = `
    query {
      detectInventoryAnomalies(threshold: ${threshold})
    }
  `;
  
  const response = await graphql(query);
  return JSON.parse(response.detectInventoryAnomalies);
}

// src/components/AnomalyAlerts.tsx
export default function AnomalyAlerts() {
  const [anomalies, setAnomalies] = useState([]);
  
  useEffect(() => {
    fetchAnomalies().then(setAnomalies);
  }, []);
  
  return (
    <div className="anomaly-alerts">
      <h3>🚨 Anomaly Alerts</h3>
      {anomalies.map(alert => (
        <div key={`${alert.productId}-${alert.date}`} 
             className={`alert alert-${alert.severity}`}>
          <strong>{alert.productName}</strong>
          <p>{alert.recommendation}</p>
          <small>Deviation: {alert.deviation.toFixed(1)}%</small>
        </div>
      ))}
    </div>
  );
}
```

## 🎨 Add to Dashboard

Update your `Dashboard.tsx`:

```tsx
import AnomalyAlerts from '../components/AnomalyAlerts';

export default function Dashboard() {
  return (
    <div className="dashboard">
      {/* Existing stats */}
      
      {/* Add anomaly alerts */}
      <AnomalyAlerts />
      
      {/* Rest of dashboard */}
    </div>
  );
}
```

## 📈 Real-World Use Cases

### 1. Prevent Stockouts
"Premium Laptop" shows a **spike** anomaly (z-score: 3.5)
- **Action**: Immediately increase reorder quantity
- **Impact**: Avoid losing sales during high demand

### 2. Identify Problems Early
"USB Cable" shows a **drop** anomaly (z-score: -4.2)
- **Action**: Investigate pricing, competition, or quality issues
- **Impact**: Address problems before they worsen

### 3. Optimize Inventory
"Desk Lamp" shows unusual velocity change (-45%)
- **Action**: Reduce stock levels, consider promotion
- **Impact**: Reduce holding costs

## 🔔 Set Up Automated Alerts

### Option 1: Daily Email Report
```typescript
// server/src/analytics/anomaly-alerts.service.ts
@Cron('0 8 * * *') // Every day at 8 AM
async sendDailyAnomalyReport() {
  const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const anomalies = await this.anomalyService.detectInventoryAnomalies(
    yesterday,
    new Date(),
    2.5
  );
  
  if (anomalies.length > 0) {
    // Send email with anomalies
    await this.emailService.send({
      to: 'manager@company.com',
      subject: `${anomalies.length} Anomalies Detected`,
      body: this.formatAnomalyEmail(anomalies)
    });
  }
}
```

### Option 2: Slack Notifications
```typescript
@Cron('0 */4 * * *') // Every 4 hours
async sendAnomalyAlerts() {
  const anomalies = await this.anomalyService.detectInventoryAnomalies(
    new Date(Date.now() - 4 * 60 * 60 * 1000),
    new Date(),
    3.0 // Only critical anomalies
  );
  
  for (const anomaly of anomalies) {
    if (anomaly.severity === 'critical') {
      await this.slackService.send({
        channel: '#inventory-alerts',
        text: `🚨 ${anomaly.recommendation}`
      });
    }
  }
}
```

## 📊 Analytics Dashboard Integration

Add a dedicated "Anomalies" section to your Analytics page:

```tsx
// src/pages/Analytics.tsx - Add new tab
const [activeView, setActiveView] = useState<'overview' | 'detail' | 'anomalies'>('overview');

{activeView === 'anomalies' && (
  <div className="anomalies-view">
    <div className="filters">
      <select onChange={(e) => setThreshold(Number(e.target.value))}>
        <option value="2.0">Sensitive (2.0)</option>
        <option value="2.5" selected>Balanced (2.5)</option>
        <option value="3.0">Conservative (3.0)</option>
      </select>
    </div>
    
    <div className="anomaly-timeline">
      {/* Chart showing anomalies over time */}
    </div>
    
    <div className="anomaly-list">
      {anomalies.map(a => (
        <AnomalyCard anomaly={a} key={a.productId} />
      ))}
    </div>
  </div>
)}
```

## 🧪 Testing with Seed Data

Your seeded data includes:
- **TECH-001, TECH-002**: Consistent sales (should have few anomalies)
- **TECH-004**: Declining sales (should show drop anomalies)
- **FURN-004**: Slow moving (may show unusual patterns)

Test queries:
```graphql
# Should show declining trend
query {
  detectVelocityChanges(productId: 7) # USB Cable (TECH-004)
}

# Should show anomalies if any spikes in recent data
query {
  detectProductAnomalies(productId: 1, threshold: 2.0)
}
```

## 🎓 Next Steps

1. **Test** the anomaly detection with your seeded data
2. **Integrate** into your frontend Dashboard
3. **Set up** automated alerts (email/Slack)
4. **Monitor** false positives and adjust threshold
5. **Implement** Phase 3 techniques from ADVANCED_ML_TECHNIQUES.md

## 📚 Understanding Z-Scores

**What is a Z-Score?**
- Measures how far a data point is from the average
- Z-score of 0 = exactly average
- Z-score of 2 = 2 standard deviations above average
- Z-score of -3 = 3 standard deviations below average

**In Normal Distribution:**
- 68% of data falls within ±1 standard deviation (z-score: -1 to 1)
- 95% within ±2 (z-score: -2 to 2)
- 99.7% within ±3 (z-score: -3 to 3)

**So if z-score > 2.5:**
- This is in the top/bottom 1% of data
- Highly unusual and worth investigating!

## 🎯 Success Metrics

Track these to measure impact:
- **Early Problem Detection**: Days saved identifying issues
- **Stockout Prevention**: Number of potential stockouts avoided
- **False Positive Rate**: Aim for <10%
- **Action Response Time**: How quickly team responds to alerts
- **ROI**: Cost savings from early detection

---

## Need Help?

- Check `ADVANCED_ML_TECHNIQUES.md` for more features
- Review GraphQL schema at http://localhost:3001/graphql
- Test queries in the playground
- Monitor backend logs for debugging

Happy anomaly hunting! 🔍
