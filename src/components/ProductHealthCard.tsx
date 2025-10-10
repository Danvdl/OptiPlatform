import { useEffect, useState } from 'react';
import { fetchProductHealthScore, ProductHealthScore } from '../services/analyticsService';
import './ProductHealthCard.css';

interface Props {
  productId: number;
  compact?: boolean;
}

export default function ProductHealthCard({ productId, compact = false }: Props) {
  const [score, setScore] = useState<ProductHealthScore | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadScore();
  }, [productId]);

  const loadScore = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchProductHealthScore(productId);
      setScore(data);
    } catch (err) {
      setError('Failed to load health score');
      console.error('Error loading health score:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="health-card loading">
        <div className="spinner"></div>
        <p>Loading health score...</p>
      </div>
    );
  }

  if (error || !score) {
    return (
      <div className="health-card error">
        <p>⚠️ {error || 'No data available'}</p>
        <button onClick={loadScore}>Retry</button>
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'excellent': return '#10b981';
      case 'good': return '#3b82f6';
      case 'warning': return '#f59e0b';
      case 'critical': return '#ef4444';
      default: return '#6b7280';
    }
  };

  const getScoreColor = (value: number) => {
    if (value >= 80) return '#10b981';
    if (value >= 60) return '#3b82f6';
    if (value >= 40) return '#f59e0b';
    return '#ef4444';
  };

  if (compact) {
    return (
      <div className="health-card compact">
        <div className="compact-score" style={{ backgroundColor: getStatusColor(score.healthStatus) }}>
          {score.overallScore}
        </div>
        <div className="compact-info">
          <div className="compact-status">{score.healthStatus.toUpperCase()}</div>
          <div className="compact-product">{score.productName}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="health-card">
      <div className="health-card-header">
        <h3>{score.productName}</h3>
        <button className="refresh-btn" onClick={loadScore} title="Refresh">
          🔄
        </button>
      </div>

      {/* Overall Score */}
      <div className="overall-score">
        <div
          className="score-circle"
          style={{ borderColor: getStatusColor(score.healthStatus) }}
        >
          <div className="score-value" style={{ color: getStatusColor(score.healthStatus) }}>
            {score.overallScore}
          </div>
          <div className="score-label">/ 100</div>
        </div>
        <div className="status-badge" style={{ backgroundColor: getStatusColor(score.healthStatus) }}>
          {score.healthStatus.toUpperCase()}
        </div>
      </div>

      {/* Score Breakdown */}
      <div className="score-breakdown">
        <h4>📊 Score Breakdown</h4>
        {Object.entries(score.scoreBreakdown).map(([key, value]) => (
          <div key={key} className="breakdown-item">
            <div className="breakdown-header">
              <span className="breakdown-label">
                {key.replace(/([A-Z])/g, ' $1').trim()}
              </span>
              <span className="breakdown-value">{value}</span>
            </div>
            <div className="breakdown-bar">
              <div
                className="breakdown-fill"
                style={{
                  width: `${value}%`,
                  backgroundColor: getScoreColor(value),
                }}
              />
            </div>
          </div>
        ))}
      </div>

      {/* Trends */}
      <div className="trends-section">
        <h4>📈 Trends</h4>
        <div className="trends-grid">
          <div className="trend-card">
            <div className="trend-label">Last 30 Days</div>
            <div
              className="trend-value"
              style={{ color: score.trends.last30Days >= 0 ? '#10b981' : '#ef4444' }}
            >
              {score.trends.last30Days > 0 ? '+' : ''}
              {score.trends.last30Days.toFixed(1)}%
            </div>
          </div>
          <div className="trend-card">
            <div className="trend-label">Last 90 Days</div>
            <div
              className="trend-value"
              style={{ color: score.trends.last90Days >= 0 ? '#10b981' : '#ef4444' }}
            >
              {score.trends.last90Days > 0 ? '+' : ''}
              {score.trends.last90Days.toFixed(1)}%
            </div>
          </div>
          <div className="trend-card">
            <div className="trend-label">Year over Year</div>
            <div
              className="trend-value"
              style={{ color: score.trends.yearOverYear >= 0 ? '#10b981' : '#ef4444' }}
            >
              {score.trends.yearOverYear > 0 ? '+' : ''}
              {score.trends.yearOverYear.toFixed(1)}%
            </div>
          </div>
        </div>
      </div>

      {/* Insights */}
      {score.insights.length > 0 && (
        <div className="insights-section">
          <h4>💡 Insights</h4>
          <ul className="insights-list">
            {score.insights.map((insight, i) => (
              <li key={i}>{insight}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Action Items */}
      {score.actionItems.length > 0 && (
        <div className="actions-section">
          <h4>🎯 Recommended Actions</h4>
          {score.actionItems.map((item, i) => (
            <div
              key={i}
              className={`action-item priority-${item.priority}`}
            >
              <div className="action-header">
                <span className="priority-badge">{item.priority.toUpperCase()}</span>
                <span className="action-text">{item.action}</span>
              </div>
              <div className="action-impact">Impact: {item.impact}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
