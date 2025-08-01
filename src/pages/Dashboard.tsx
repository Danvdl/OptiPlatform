import { useEffect, useState } from 'react';
import { fetchInventorySummary, InventorySummary, ApiError } from '../utils/inventoryApi';
import { useError } from '../components/ErrorProvider';
import { getErrorMessage, ErrorCode } from '../utils/errorCodes';
import './Dashboard.css';

export default function Dashboard() {
  const [summary, setSummary] = useState<InventorySummary>({
    totalProducts: 0,
    totalCategories: 0,
    recentTransactions: 0,
    lowStockCount: 0,
    lowStockProducts: []
  });
  const [loading, setLoading] = useState(true);
  const [animatedValues, setAnimatedValues] = useState({
    totalProducts: 0,
    totalCategories: 0,
    recentTransactions: 0,
    lowStockCount: 0,
  });
  const { showError } = useError();

  // Animate counter values
  useEffect(() => {
    if (!loading) {
      const duration = 1000; // 1 second
      const steps = 60; // 60fps
      const interval = duration / steps;

      let step = 0;
      const timer = setInterval(() => {
        step++;
        const progress = step / steps;
        
        setAnimatedValues({
          totalProducts: Math.floor(summary.totalProducts * progress),
          totalCategories: Math.floor(summary.totalCategories * progress),
          recentTransactions: Math.floor(summary.recentTransactions * progress),
          lowStockCount: Math.floor(summary.lowStockCount * progress),
        });

        if (step >= steps) {
          clearInterval(timer);
          setAnimatedValues({
            totalProducts: summary.totalProducts,
            totalCategories: summary.totalCategories,
            recentTransactions: summary.recentTransactions,
            lowStockCount: summary.lowStockCount,
          });
        }
      }, interval);

      return () => clearInterval(timer);
    }
  }, [loading, summary]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const data = await fetchInventorySummary();
      setSummary(data);
    } catch (error: any) {
      console.error('Failed to load dashboard data:', error);
      const code = error instanceof ApiError ? error.code : ErrorCode.UNKNOWN;
      showError(getErrorMessage(code));
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
      <div style={styles.container}>
        <div style={styles.loadingContainer}>
          <div style={styles.spinner}></div>
          <h2 style={styles.loadingText}>Loading Dashboard...</h2>
          <p style={styles.loadingSubtext}>Fetching your inventory data</p>
        </div>
      </div>
    );
  }

  const stockHealth = summary.totalProducts > 0 
    ? ((summary.totalProducts - summary.lowStockCount) / summary.totalProducts) * 100 
    : 100;

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>Dashboard Overview</h1>
          <p style={styles.subtitle}>Monitor your inventory performance at a glance</p>
        </div>
        <button onClick={loadDashboardData} style={styles.refreshButton}>
          🔄 Refresh
        </button>
      </div>

      {/* Key Metrics Cards */}
      <div style={styles.metricsGrid}>
        <MetricCard
          title="Total Products"
          value={animatedValues.totalProducts}
          icon="📦"
          color="#3b82f6"
          bgColor="#eff6ff"
        />
        <MetricCard
          title="Categories"
          value={animatedValues.totalCategories}
          icon="📂"
          color="#10b981"
          bgColor="#ecfdf5"
        />
        <MetricCard
          title="Low Stock Items"
          value={animatedValues.lowStockCount}
          icon="⚠️"
          color={summary.lowStockCount > 0 ? "#ef4444" : "#10b981"}
          bgColor={summary.lowStockCount > 0 ? "#fef2f2" : "#ecfdf5"}
          warning={summary.lowStockCount > 0}
        />
        <MetricCard
          title="Total Transactions"
          value={animatedValues.recentTransactions}
          icon="📊"
          color="#8b5cf6"
          bgColor="#f5f3ff"
        />
      </div>

      {/* Stock Health Chart */}
      <div style={styles.chartContainer}>
        <h3 style={styles.chartTitle}>
          <span style={styles.chartIcon}>📈</span>
          Stock Health Overview
        </h3>
        <div style={styles.healthContainer}>
          <div style={styles.healthBar}>
            <div 
              style={{
                ...styles.healthFill,
                width: `${stockHealth}%`,
                backgroundColor: stockHealth >= 80 ? '#10b981' : stockHealth >= 60 ? '#f59e0b' : '#ef4444'
              }}
            ></div>
          </div>
          <div style={styles.healthStats}>
            <div style={styles.healthStat}>
              <span style={styles.healthDot} />
              <span>In Stock: {summary.totalProducts - summary.lowStockCount} items</span>
            </div>
            {summary.lowStockCount > 0 && (
              <div style={styles.healthStat}>
                <span style={{...styles.healthDot, backgroundColor: '#ef4444'}} />
                <span>Low Stock: {summary.lowStockCount} items</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Low Stock Alerts */}
      {summary.lowStockCount > 0 && (
        <div style={styles.alertContainer}>
          <div style={styles.alertHeader}>
            <h3 style={styles.alertTitle}>
              <span style={styles.alertIcon}>🚨</span>
              Low Stock Alert
            </h3>
            <span style={styles.alertBadge}>{summary.lowStockCount}</span>
          </div>
          <div style={styles.alertList}>
            {summary.lowStockProducts.slice(0, 3).map(product => (
              <div key={product.id} style={styles.alertItem}>
                <div style={styles.alertItemContent}>
                  <div>
                    <div style={styles.alertItemName}>{product.name}</div>
                    {product.sku && (
                      <div style={styles.alertItemSku}>SKU: {product.sku}</div>
                    )}
                  </div>
                  <div style={styles.alertItemStock}>
                    <span style={styles.alertItemValue}>
                      {product.currentStock} {product.unit || 'units'}
                    </span>
                    <span style={styles.alertItemThreshold}>
                      Restock at {product.restockThreshold}
                    </span>
                  </div>
                </div>
              </div>
            ))}
            {summary.lowStockProducts.length > 3 && (
              <div style={styles.alertMore}>
                +{summary.lowStockProducts.length - 3} more items need attention
              </div>
            )}
          </div>
        </div>
      )}

      {/* Success State */}
      {summary.lowStockCount === 0 && summary.totalProducts > 0 && (
        <div style={styles.successContainer}>
          <div style={styles.successIcon}>✅</div>
          <div>
            <h3 style={styles.successTitle}>All Stock Levels Good!</h3>
            <p style={styles.successText}>
              All {summary.totalProducts} products are above their restock thresholds.
            </p>
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div style={styles.actionsContainer}>
        <h3 style={styles.actionsTitle}>Quick Actions</h3>
        <div style={styles.actionsGrid}>
          <ActionButton
            icon="📦"
            title="Manage Inventory"
            description="View and edit your products"
            onClick={() => window.location.href = '/inventory'}
            color="#3b82f6"
          />
          <ActionButton
            icon="➕"
            title="Add Product"
            description="Add new items to inventory"
            onClick={() => window.location.href = '/inventory?tab=products&action=add'}
            color="#10b981"
          />
          <ActionButton
            icon="📝"
            title="Log Transaction"
            description="Record inventory movements"
            onClick={() => window.location.href = '/inventory?tab=transactions&action=add'}
            color="#f59e0b"
          />
          <ActionButton
            icon="📊"
            title="View Reports"
            description="Analyze inventory trends"
            onClick={() => window.location.href = '/reports'}
            color="#8b5cf6"
          />
        </div>
      </div>
    </div>
  );
}

// Metric Card Component
function MetricCard({ title, value, icon, color, bgColor, warning = false }: {
  title: string;
  value: number;
  icon: string;
  color: string;
  bgColor: string;
  warning?: boolean;
}) {
  return (
    <div style={{...styles.metricCard, backgroundColor: bgColor}}>
      <div style={styles.metricHeader}>
        <span style={{...styles.metricIcon, color}}>{icon}</span>
        <div style={styles.metricTitle}>{title}</div>
      </div>
      <div style={{...styles.metricValue, color}}>
        {value.toLocaleString()}
      </div>
      {warning && value > 0 && (
        <div style={styles.metricWarning}>Requires attention</div>
      )}
    </div>
  );
}

// Action Button Component
function ActionButton({ icon, title, description, onClick, color }: {
  icon: string;
  title: string;
  description: string;
  onClick: () => void;
  color: string;
}) {
  return (
    <button style={styles.actionButton} onClick={onClick}>
      <div style={{...styles.actionIcon, color}}>{icon}</div>
      <div style={styles.actionContent}>
        <div style={styles.actionTitle}>{title}</div>
        <div style={styles.actionDescription}>{description}</div>
      </div>
    </button>
  );
}

const styles = {
  container: {
    padding: '24px',
    maxWidth: '1200px',
    margin: '0 auto',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    backgroundColor: '#f8fafc',
    minHeight: '100vh',
  },
  loadingContainer: {
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    justifyContent: 'center',
    height: '50vh',
  },
  spinner: {
    width: '40px',
    height: '40px',
    border: '4px solid #e5e7eb',
    borderTopColor: '#3b82f6',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
  },
  loadingText: {
    color: '#1f2937',
    margin: '16px 0 8px 0',
  },
  loadingSubtext: {
    color: '#6b7280',
    margin: 0,
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '32px',
  },
  title: {
    fontSize: '32px',
    fontWeight: 'bold',
    color: '#1f2937',
    margin: '0 0 8px 0',
  },
  subtitle: {
    fontSize: '16px',
    color: '#6b7280',
    margin: 0,
  },
  refreshButton: {
    padding: '12px 20px',
    backgroundColor: '#f3f4f6',
    border: '1px solid #d1d5db',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '500',
    color: '#374151',
    transition: 'all 0.2s',
  },
  metricsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
    gap: '20px',
    marginBottom: '32px',
  },
  metricCard: {
    padding: '24px',
    borderRadius: '12px',
    border: '1px solid #e5e7eb',
    transition: 'transform 0.2s, box-shadow 0.2s',
  },
  metricHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    marginBottom: '16px',
  },
  metricIcon: {
    fontSize: '24px',
  },
  metricTitle: {
    fontSize: '14px',
    fontWeight: '500',
    color: '#6b7280',
  },
  metricValue: {
    fontSize: '36px',
    fontWeight: 'bold',
    marginBottom: '8px',
  },
  metricWarning: {
    fontSize: '12px',
    color: '#ef4444',
    fontWeight: '500',
  },
  chartContainer: {
    backgroundColor: 'white',
    padding: '24px',
    borderRadius: '12px',
    border: '1px solid #e5e7eb',
    marginBottom: '24px',
  },
  chartTitle: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    margin: '0 0 20px 0',
    fontSize: '18px',
    fontWeight: '600',
    color: '#1f2937',
  },
  chartIcon: {
    fontSize: '20px',
  },
  healthContainer: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '16px',
  },
  healthBar: {
    width: '100%',
    height: '12px',
    backgroundColor: '#f3f4f6',
    borderRadius: '6px',
    overflow: 'hidden',
  },
  healthFill: {
    height: '100%',
    transition: 'width 1s ease-in-out',
    borderRadius: '6px',
  },
  healthStats: {
    display: 'flex',
    gap: '24px',
  },
  healthStat: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    fontSize: '14px',
    color: '#374151',
  },
  healthDot: {
    width: '8px',
    height: '8px',
    borderRadius: '50%',
    backgroundColor: '#10b981',
  },
  alertContainer: {
    backgroundColor: '#fef2f2',
    border: '1px solid #fecaca',
    borderRadius: '12px',
    padding: '24px',
    marginBottom: '24px',
  },
  alertHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '16px',
  },
  alertTitle: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    margin: 0,
    fontSize: '18px',
    fontWeight: '600',
    color: '#dc2626',
  },
  alertIcon: {
    fontSize: '20px',
  },
  alertBadge: {
    backgroundColor: '#dc2626',
    color: 'white',
    padding: '4px 8px',
    borderRadius: '6px',
    fontSize: '12px',
    fontWeight: '600',
  },
  alertList: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '12px',
  },
  alertItem: {
    backgroundColor: 'white',
    border: '1px solid #fecaca',
    borderRadius: '8px',
    padding: '16px',
  },
  alertItemContent: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  alertItemName: {
    fontWeight: '500',
    color: '#1f2937',
  },
  alertItemSku: {
    fontSize: '12px',
    color: '#6b7280',
    marginTop: '2px',
  },
  alertItemStock: {
    textAlign: 'right' as const,
  },
  alertItemValue: {
    fontWeight: '600',
    color: '#dc2626',
    display: 'block',
  },
  alertItemThreshold: {
    fontSize: '12px',
    color: '#6b7280',
  },
  alertMore: {
    textAlign: 'center' as const,
    padding: '12px',
    fontSize: '14px',
    color: '#6b7280',
    fontStyle: 'italic',
  },
  successContainer: {
    backgroundColor: '#ecfdf5',
    border: '1px solid #d1fae5',
    borderRadius: '12px',
    padding: '24px',
    marginBottom: '24px',
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
  },
  successIcon: {
    fontSize: '32px',
  },
  successTitle: {
    margin: '0 0 8px 0',
    fontSize: '18px',
    fontWeight: '600',
    color: '#065f46',
  },
  successText: {
    margin: 0,
    color: '#047857',
  },
  actionsContainer: {
    backgroundColor: 'white',
    padding: '24px',
    borderRadius: '12px',
    border: '1px solid #e5e7eb',
  },
  actionsTitle: {
    margin: '0 0 20px 0',
    fontSize: '18px',
    fontWeight: '600',
    color: '#1f2937',
  },
  actionsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '16px',
  },
  actionButton: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '16px',
    backgroundColor: '#f9fafb',
    border: '1px solid #e5e7eb',
    borderRadius: '8px',
    cursor: 'pointer',
    transition: 'all 0.2s',
    textAlign: 'left' as const,
  },
  actionIcon: {
    fontSize: '24px',
  },
  actionContent: {
    flex: 1,
  },
  actionTitle: {
    fontWeight: '500',
    color: '#1f2937',
    marginBottom: '4px',
  },
  actionDescription: {
    fontSize: '12px',
    color: '#6b7280',
  },
};
