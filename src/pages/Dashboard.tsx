import { useEffect, useState } from 'react';
import { fetchInventorySummary, InventorySummary } from '../utils/inventoryApi';

export default function Dashboard() {
  const [summary, setSummary] = useState<InventorySummary>({
    totalProducts: 0,
    totalCategories: 0,
    recentTransactions: 0,
    lowStockCount: 0,
    lowStockProducts: []
  });
  const [loading, setLoading] = useState(true);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const data = await fetchInventorySummary();
      setSummary(data);
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
    // Refresh dashboard every 30 seconds
    const interval = setInterval(loadDashboardData, 30000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div style={{ padding: '2rem' }}>
        <h1>Dashboard</h1>
        <p>Loading dashboard data...</p>
      </div>
    );
  }

  return (
    <div style={{ padding: '2rem' }}>
      <h1>OptiPlatform Dashboard</h1>
      
      {/* Key Metrics Cards */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
        gap: '1rem', 
        marginBottom: '2rem' 
      }}>
        <div style={cardStyle}>
          <h3>Total Products</h3>
          <p style={metricStyle}>{summary.totalProducts}</p>
        </div>
        <div style={cardStyle}>
          <h3>Categories</h3>
          <p style={metricStyle}>{summary.totalCategories}</p>
        </div>
        <div style={cardStyle}>
          <h3>Low Stock Items</h3>
          <p style={{ ...metricStyle, color: summary.lowStockCount > 0 ? '#ff6b6b' : '#51cf66' }}>
            {summary.lowStockCount}
          </p>
        </div>
        <div style={cardStyle}>
          <h3>Total Transactions</h3>
          <p style={metricStyle}>{summary.recentTransactions}</p>
        </div>
      </div>

      {/* Low Stock Alerts */}
      {summary.lowStockCount > 0 && (
        <div style={{ ...cardStyle, marginBottom: '2rem', backgroundColor: '#fff5f5', borderLeft: '4px solid #ff6b6b' }}>
          <h3 style={{ color: '#c92a2a' }}>⚠️ Low Stock Alert</h3>
          <p>You have {summary.lowStockCount} product(s) running low on stock:</p>
          <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
            {summary.lowStockProducts.map(product => (
              <div key={product.id} style={{ 
                padding: '0.5rem', 
                margin: '0.5rem 0', 
                backgroundColor: '#ffebee', 
                borderRadius: '4px',
                borderLeft: '3px solid #c62828'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <strong style={{ color: '#c92a2a' }}>{product.name}</strong>
                    {product.sku && <span style={{ color: '#666', fontSize: '0.9rem' }}> (SKU: {product.sku})</span>}
                    {product.category && (
                      <span style={{ 
                        backgroundColor: '#e3f2fd', 
                        color: '#1976d2', 
                        padding: '2px 6px', 
                        borderRadius: '3px', 
                        fontSize: '0.8rem',
                        marginLeft: '0.5rem'
                      }}>
                        {product.category.name}
                      </span>
                    )}
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ color: '#c92a2a', fontWeight: 'bold' }}>
                      {product.currentStock} {product.unit || 'units'}
                    </div>
                    <div style={{ fontSize: '0.8rem', color: '#666' }}>
                      Restock at {product.restockThreshold}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Stock Overview */}
      <div style={cardStyle}>
        <h3>Current Stock Overview</h3>
        {summary.totalProducts === 0 ? (
          <div style={{ textAlign: 'center', padding: '2rem' }}>
            <p style={{ color: '#666', marginBottom: '1rem' }}>
              No products in inventory yet.
            </p>
            <button 
              style={buttonStyle}
              onClick={() => window.location.href = '/inventory'}
            >
              Add Your First Product
            </button>
          </div>
        ) : (
          <div>
            <div style={{ marginBottom: '1rem', display: 'flex', gap: '1rem', alignItems: 'center' }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '0.9rem', color: '#666' }}>Stock Status</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginTop: '0.5rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <div style={{ width: '12px', height: '12px', backgroundColor: '#51cf66', borderRadius: '50%' }}></div>
                    <span style={{ fontSize: '0.9rem' }}>In Stock ({summary.totalProducts - summary.lowStockCount})</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <div style={{ width: '12px', height: '12px', backgroundColor: '#ff6b6b', borderRadius: '50%' }}></div>
                    <span style={{ fontSize: '0.9rem' }}>Low Stock ({summary.lowStockCount})</span>
                  </div>
                </div>
              </div>
            </div>
            
            {summary.lowStockCount === 0 && (
              <div style={{ 
                textAlign: 'center', 
                padding: '2rem', 
                backgroundColor: '#e8f5e8', 
                borderRadius: '6px',
                border: '1px solid #c8e6c9'
              }}>
                <div style={{ fontSize: '3rem', marginBottom: '0.5rem' }}>✅</div>
                <h4 style={{ margin: '0 0 0.5rem 0', color: '#2e7d32' }}>All Stock Levels Good!</h4>
                <p style={{ margin: 0, color: '#388e3c' }}>
                  All {summary.totalProducts} products are above their restock thresholds.
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div style={{ marginTop: '2rem' }}>
        <h3>Quick Actions</h3>
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
          <button 
            style={buttonStyle}
            onClick={() => window.location.href = '/inventory'}
          >
            📦 Manage Inventory
          </button>
          <button 
            style={{ ...buttonStyle, backgroundColor: '#28a745' }}
            onClick={() => {
              // TODO: Open add product modal
              window.location.href = '/inventory';
            }}
          >
            ➕ Add Product
          </button>
          <button 
            style={{ ...buttonStyle, backgroundColor: '#ffc107', color: '#000' }}
            onClick={() => {
              // TODO: Open add transaction modal
              window.location.href = '/inventory';
            }}
          >
            📝 Log Transaction
          </button>
          <button 
            style={{ ...buttonStyle, backgroundColor: '#6c757d' }}
            onClick={loadDashboardData}
          >
            🔄 Refresh Data
          </button>
        </div>
      </div>

      {/* Recent Activity Preview */}
      <div style={{ ...cardStyle, marginTop: '2rem' }}>
        <h3>Recent Activity</h3>
        <p style={{ color: '#666' }}>
          {summary.recentTransactions > 0 
            ? `${summary.recentTransactions} transactions logged across all products.`
            : 'No transactions recorded yet.'
          }
        </p>
        {summary.recentTransactions > 0 && (
          <button 
            style={{ ...buttonStyle, backgroundColor: '#17a2b8' }}
            onClick={() => window.location.href = '/inventory'}
          >
            View All Transactions
          </button>
        )}
      </div>
    </div>
  );
}

// Styles
const cardStyle: React.CSSProperties = {
  backgroundColor: 'white',
  padding: '1.5rem',
  borderRadius: '8px',
  boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
  border: '1px solid #e9ecef'
};

const metricStyle: React.CSSProperties = {
  fontSize: '2rem',
  fontWeight: 'bold',
  margin: '0.5rem 0 0 0',
  color: '#495057'
};

const buttonStyle: React.CSSProperties = {
  backgroundColor: '#007bff',
  color: 'white',
  border: 'none',
  padding: '0.75rem 1.5rem',
  borderRadius: '6px',
  cursor: 'pointer',
  fontSize: '0.9rem',
  fontWeight: '500',
  transition: 'background-color 0.2s'
};
