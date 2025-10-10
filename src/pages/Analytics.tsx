import { useState, useEffect } from 'react';
import { fetchProducts } from '../utils/inventoryApi';
import { fetchBatchHealthScores, ProductHealthScore } from '../services/analyticsService';
import ProductHealthCard from '../components/ProductHealthCard';
import './Analytics.css';

interface Product {
  id: number;
  name: string;
}

export default function Analytics() {
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedProductId, setSelectedProductId] = useState<number | null>(null);
  const [healthScores, setHealthScores] = useState<ProductHealthScore[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<'overview' | 'detail'>('overview');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const productsData = await fetchProducts();
      setProducts(productsData);

      // Load health scores for first 10 products (for overview)
      const topProductIds = productsData.slice(0, 10).map(p => p.id);
      const scores = await fetchBatchHealthScores(topProductIds);
      setHealthScores(scores.sort((a, b) => b.overallScore - a.overallScore));
    } catch (error) {
      console.error('Failed to load analytics data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleProductSelect = (productId: number) => {
    setSelectedProductId(productId);
    setView('detail');
  };

  if (loading) {
    return (
      <div className="analytics-container">
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Loading analytics...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="analytics-container">
      <div className="analytics-header">
        <div>
          <h1>🤖 ML Analytics Dashboard</h1>
          <p>Advanced product insights powered by machine learning</p>
        </div>
        <div className="view-toggle">
          <button
            className={view === 'overview' ? 'active' : ''}
            onClick={() => setView('overview')}
          >
            📊 Overview
          </button>
          <button
            className={view === 'detail' ? 'active' : ''}
            onClick={() => setView('detail')}
          >
            🔍 Detailed View
          </button>
        </div>
      </div>

      {view === 'overview' ? (
        <div className="overview-view">
          {/* Summary Stats */}
          <div className="stats-grid">
            <div className="stat-card excellent">
              <div className="stat-value">
                {healthScores.filter(s => s.healthStatus === 'excellent').length}
              </div>
              <div className="stat-label">Excellent Products</div>
            </div>
            <div className="stat-card good">
              <div className="stat-value">
                {healthScores.filter(s => s.healthStatus === 'good').length}
              </div>
              <div className="stat-label">Good Products</div>
            </div>
            <div className="stat-card warning">
              <div className="stat-value">
                {healthScores.filter(s => s.healthStatus === 'warning').length}
              </div>
              <div className="stat-label">Warning Products</div>
            </div>
            <div className="stat-card critical">
              <div className="stat-value">
                {healthScores.filter(s => s.healthStatus === 'critical').length}
              </div>
              <div className="stat-label">Critical Products</div>
            </div>
          </div>

          {/* Top Performers */}
          <div className="section">
            <h2>🏆 Top Performers</h2>
            <div className="products-grid">
              {healthScores.slice(0, 5).map(score => (
                <div
                  key={score.productId}
                  className="product-card"
                  onClick={() => handleProductSelect(score.productId)}
                >
                  <ProductHealthCard productId={score.productId} compact />
                </div>
              ))}
            </div>
          </div>

          {/* Needs Attention */}
          <div className="section">
            <h2>⚠️ Needs Attention</h2>
            <div className="products-grid">
              {healthScores
                .filter(s => s.healthStatus === 'warning' || s.healthStatus === 'critical')
                .slice(0, 5)
                .map(score => (
                  <div
                    key={score.productId}
                    className="product-card"
                    onClick={() => handleProductSelect(score.productId)}
                  >
                    <ProductHealthCard productId={score.productId} compact />
                  </div>
                ))}
              {healthScores.filter(s => s.healthStatus === 'warning' || s.healthStatus === 'critical').length === 0 && (
                <p className="empty-state">✅ All products are performing well!</p>
              )}
            </div>
          </div>

          {/* All Products Table */}
          <div className="section">
            <h2>📋 All Products</h2>
            <div className="products-table">
              <table>
                <thead>
                  <tr>
                    <th>Product</th>
                    <th>Health Score</th>
                    <th>Status</th>
                    <th>30d Trend</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {healthScores.map(score => (
                    <tr key={score.productId}>
                      <td className="product-name">{score.productName}</td>
                      <td>
                        <div className="score-badge" style={{ 
                          backgroundColor: score.overallScore >= 80 ? '#10b981' :
                                          score.overallScore >= 60 ? '#3b82f6' :
                                          score.overallScore >= 40 ? '#f59e0b' : '#ef4444'
                        }}>
                          {score.overallScore}
                        </div>
                      </td>
                      <td>
                        <span className={`status-pill ${score.healthStatus}`}>
                          {score.healthStatus}
                        </span>
                      </td>
                      <td>
                        <span className={score.trends.last30Days >= 0 ? 'trend-up' : 'trend-down'}>
                          {score.trends.last30Days > 0 ? '↑' : '↓'}
                          {Math.abs(score.trends.last30Days).toFixed(1)}%
                        </span>
                      </td>
                      <td>
                        <button
                          className="view-btn"
                          onClick={() => handleProductSelect(score.productId)}
                        >
                          View Details
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : (
        <div className="detail-view">
          <div className="detail-header">
            <button onClick={() => setView('overview')} className="back-btn">
              ← Back to Overview
            </button>
            <select
              value={selectedProductId || ''}
              onChange={(e) => setSelectedProductId(Number(e.target.value))}
              className="product-select"
            >
              <option value="">Select a product...</option>
              {products.map(p => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>

          {selectedProductId ? (
            <div className="detail-content">
              <ProductHealthCard productId={selectedProductId} />
            </div>
          ) : (
            <div className="empty-state">
              <p>👆 Select a product to view detailed analytics</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
