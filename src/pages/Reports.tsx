import { useState, useEffect } from 'react';
import { fetchDashboardMetrics } from '../utils/advancedApi';

interface ReportData {
  [key: string]: any;
}

export default function Reports() {
  const [activeReport, setActiveReport] = useState<string>('dashboard');
  const [loading, setLoading] = useState(false);
  const [reportData, setReportData] = useState<ReportData>({});
  const [dateRange, setDateRange] = useState({
    startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 30 days ago
    endDate: new Date().toISOString().split('T')[0] // today
  });

  const reportTypes = [
    { id: 'dashboard', name: '📊 Dashboard Overview', description: 'Key metrics and performance indicators' },
    { id: 'inventory-turnover', name: '🔄 Inventory Turnover', description: 'Sales velocity and restocking efficiency' },
    { id: 'stock-movement', name: '📈 Stock Movement', description: 'Inventory flow patterns and velocity' },
    { id: 'low-stock', name: '⚠️ Low Stock Analysis', description: 'Stockout predictions and reorder alerts' },
    { id: 'category-performance', name: '📋 Category Performance', description: 'Performance comparison across categories' },
    { id: 'cost-analysis', name: '💰 Cost Analysis', description: 'Cost trends and profitability metrics' }
  ];

  const loadReportData = async (reportType: string) => {
    setLoading(true);
    try {
      if (reportType === 'dashboard') {
        const metrics = await fetchDashboardMetrics(30);
        // Normalize to expected shape used in DashboardReport
        const normalized = {
          totalRevenue: metrics?.summary?.totalRevenue ?? 0,
          totalProfit: metrics?.summary?.grossProfit ?? 0,
          inventoryValue: metrics?.summary?.totalCost ?? 0,
          turnoverRatio: metrics?.summary?.averageTurnover ?? 0,
          lowStockItems: metrics?.summary?.lowStockItems ?? 0,
        };
        setReportData({ dashboard: normalized });
      } else {
        setReportData({ [reportType]: {} });
      }
    } catch (error) {
      console.error('Failed to load report:', error);
      setReportData({ [reportType]: {} });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReportData(activeReport);
  }, [activeReport, dateRange]);

  const exportReport = (format: 'csv' | 'excel' | 'pdf') => {
    const baseUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001';
    const params = new URLSearchParams({
      format,
      startDate: dateRange.startDate,
      endDate: dateRange.endDate
    });

    let endpoint = '';
    switch (activeReport) {
      case 'dashboard':
        endpoint = '/reports/export/dashboard';
        break;
      case 'inventory-turnover':
        endpoint = '/reports/export/inventory-turnover';
        break;
      case 'stock-movement':
        endpoint = '/reports/export/stock-movement';
        break;
      case 'low-stock':
        endpoint = '/reports/export/low-stock-trends';
        break;
      case 'category-performance':
        endpoint = '/reports/export/category-performance';
        break;
      case 'cost-analysis':
        endpoint = '/reports/export/cost-analysis';
        break;
    }

    const url = `${baseUrl}${endpoint}?${params.toString()}`;
    window.open(url, '_blank');
  };

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>📊 Reports & Analytics</h1>
          <p style={styles.subtitle}>Comprehensive business intelligence and inventory insights</p>
        </div>
        
        <div style={styles.dateRangeContainer}>
          <label style={styles.dateLabel}>Date Range:</label>
          <input
            type="date"
            value={dateRange.startDate}
            onChange={(e) => setDateRange(prev => ({ ...prev, startDate: e.target.value }))}
            style={styles.dateInput}
          />
          <span style={styles.dateSeparator}>to</span>
          <input
            type="date"
            value={dateRange.endDate}
            onChange={(e) => setDateRange(prev => ({ ...prev, endDate: e.target.value }))}
            style={styles.dateInput}
          />
        </div>
      </div>

      <div style={styles.content}>
        {/* Report Type Selector */}
        <div style={styles.sidebar}>
          <h3 style={styles.sidebarTitle}>Report Types</h3>
          <div style={styles.reportList}>
            {reportTypes.map((report) => (
              <button
                key={report.id}
                onClick={() => setActiveReport(report.id)}
                style={{
                  ...styles.reportButton,
                  ...(activeReport === report.id ? styles.reportButtonActive : {})
                }}
              >
                <div style={styles.reportButtonContent}>
                  <div style={styles.reportButtonTitle}>{report.name}</div>
                  <div style={styles.reportButtonDesc}>{report.description}</div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Report Content */}
        <div style={styles.mainContent}>
          <div style={styles.reportHeader}>
            <h2 style={styles.reportTitle}>
              {reportTypes.find(r => r.id === activeReport)?.name}
            </h2>
            
            {/* Export Buttons */}
            <div style={styles.exportButtons}>
              <button
                onClick={() => exportReport('csv')}
                style={{ ...styles.exportButton, backgroundColor: '#10b981' }}
              >
                📄 Export CSV
              </button>
              <button
                onClick={() => exportReport('excel')}
                style={{ ...styles.exportButton, backgroundColor: '#3b82f6' }}
              >
                📊 Export Excel
              </button>
              <button
                onClick={() => exportReport('pdf')}
                style={{ ...styles.exportButton, backgroundColor: '#ef4444' }}
              >
                📋 Export PDF
              </button>
            </div>
          </div>

          {/* Report Content Area */}
          <div style={styles.reportContent}>
            {loading ? (
              <div style={styles.loadingContainer}>
                <div style={styles.spinner}></div>
                <p>Loading report data...</p>
              </div>
            ) : (
              <ReportContent activeReport={activeReport} data={reportData[activeReport]} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function ReportContent({ activeReport, data }: { activeReport: string; data: any }) {
  switch (activeReport) {
    case 'dashboard':
      return <DashboardReport data={data} />;
    default:
      return <ComingSoonReport reportType={activeReport} />;
  }
}

function DashboardReport({ data }: { data: any }) {
  if (!data) return <div>No data available</div>;

  return (
    <div style={styles.dashboardGrid}>
      <div style={styles.metricCard}>
        <div style={styles.metricIcon}>💰</div>
        <div>
          <div style={styles.metricLabel}>Total Revenue</div>
          <div style={styles.metricValue}>${data.totalRevenue?.toLocaleString() || '0'}</div>
        </div>
      </div>
      
      <div style={styles.metricCard}>
        <div style={styles.metricIcon}>📈</div>
        <div>
          <div style={styles.metricLabel}>Gross Profit</div>
          <div style={styles.metricValue}>${data.totalProfit?.toLocaleString() || '0'}</div>
        </div>
      </div>
      
      <div style={styles.metricCard}>
        <div style={styles.metricIcon}>📦</div>
        <div>
          <div style={styles.metricLabel}>Inventory Value</div>
          <div style={styles.metricValue}>${data.inventoryValue?.toLocaleString() || '0'}</div>
        </div>
      </div>
      
      <div style={styles.metricCard}>
        <div style={styles.metricIcon}>🔄</div>
        <div>
          <div style={styles.metricLabel}>Turnover Ratio</div>
          <div style={styles.metricValue}>{data.turnoverRatio || '0'}x</div>
        </div>
      </div>
      
      <div style={styles.metricCard}>
        <div style={styles.metricIcon}>⚠️</div>
        <div>
          <div style={styles.metricLabel}>Low Stock Items</div>
          <div style={styles.metricValue}>{data.lowStockItems || '0'}</div>
        </div>
      </div>
    </div>
  );
}

function ComingSoonReport({ reportType }: { reportType: string }) {
  return (
    <div style={styles.comingSoonContainer}>
      <div style={styles.comingSoonIcon}>🚧</div>
      <h3 style={styles.comingSoonTitle}>Report Under Development</h3>
      <p style={styles.comingSoonText}>
        The {reportType.replace('-', ' ')} report is currently being developed. 
        The backend analytics engine is ready, and we're working on the interactive frontend visualization.
      </p>
      <div style={styles.featuresContainer}>
        <h4 style={styles.featuresTitle}>Coming Soon:</h4>
        <ul style={styles.featuresList}>
          <li>📊 Interactive charts and graphs</li>
          <li>🎯 Detailed metrics and KPIs</li>
          <li>📱 Mobile-responsive design</li>
          <li>🔄 Real-time data updates</li>
          <li>📧 Scheduled report delivery</li>
        </ul>
      </div>
      
      <div style={styles.exportNote}>
        <p><strong>Note:</strong> You can still export raw data using the export buttons above!</p>
      </div>
    </div>
  );
}

const styles = {
  container: {
    minHeight: '100vh',
    backgroundColor: '#f8fafc',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  },
  header: {
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    color: 'white',
    padding: '2rem',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap' as const,
    gap: '1rem',
  },
  title: {
    margin: 0,
    fontSize: '2rem',
    fontWeight: 'bold',
  },
  subtitle: {
    margin: '0.5rem 0 0 0',
    opacity: 0.9,
    fontSize: '1.1rem',
  },
  dateRangeContainer: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    padding: '0.75rem',
    borderRadius: '8px',
    backdropFilter: 'blur(10px)',
  },
  dateLabel: {
    fontWeight: 'bold',
  },
  dateInput: {
    padding: '0.5rem',
    border: 'none',
    borderRadius: '4px',
    fontSize: '0.9rem',
  },
  dateSeparator: {
    margin: '0 0.5rem',
  },
  content: {
    display: 'flex',
    minHeight: 'calc(100vh - 120px)',
  },
  sidebar: {
    width: '320px',
    backgroundColor: 'white',
    borderRight: '1px solid #e2e8f0',
    padding: '1.5rem',
  },
  sidebarTitle: {
    margin: '0 0 1rem 0',
    color: '#1e293b',
    fontSize: '1.1rem',
    fontWeight: 'bold',
  },
  reportList: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '0.5rem',
  },
  reportButton: {
    background: 'none',
    border: '1px solid #e2e8f0',
    padding: '1rem',
    borderRadius: '8px',
    cursor: 'pointer',
    textAlign: 'left' as const,
    transition: 'all 0.2s ease',
  },
  reportButtonActive: {
    backgroundColor: '#eff6ff',
    borderColor: '#3b82f6',
  },
  reportButtonContent: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '0.25rem',
  },
  reportButtonTitle: {
    fontWeight: 'bold',
    color: '#1e293b',
  },
  reportButtonDesc: {
    fontSize: '0.85rem',
    color: '#64748b',
  },
  mainContent: {
    flex: 1,
    padding: '1.5rem',
  },
  reportHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '1.5rem',
    flexWrap: 'wrap' as const,
    gap: '1rem',
  },
  reportTitle: {
    margin: 0,
    color: '#1e293b',
    fontSize: '1.5rem',
  },
  exportButtons: {
    display: 'flex',
    gap: '0.5rem',
  },
  exportButton: {
    padding: '0.5rem 1rem',
    border: 'none',
    borderRadius: '6px',
    color: 'white',
    fontWeight: 'bold',
    cursor: 'pointer',
    fontSize: '0.9rem',
    transition: 'all 0.2s ease',
  },
  reportContent: {
    backgroundColor: 'white',
    borderRadius: '8px',
    padding: '1.5rem',
    minHeight: '500px',
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
  },
  loadingContainer: {
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    justifyContent: 'center',
    height: '400px',
    gap: '1rem',
  },
  spinner: {
    width: '40px',
    height: '40px',
    border: '4px solid #e2e8f0',
    borderTop: '4px solid #3b82f6',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
  },
  dashboardGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '1rem',
  },
  metricCard: {
    display: 'flex',
    alignItems: 'center',
    gap: '1rem',
    padding: '1.5rem',
    backgroundColor: '#f8fafc',
    borderRadius: '8px',
    border: '1px solid #e2e8f0',
  },
  metricIcon: {
    fontSize: '2rem',
  },
  metricLabel: {
    fontSize: '0.9rem',
    color: '#64748b',
    marginBottom: '0.25rem',
  },
  metricValue: {
    fontSize: '1.5rem',
    fontWeight: 'bold',
    color: '#1e293b',
  },
  comingSoonContainer: {
    textAlign: 'center' as const,
    padding: '3rem',
    maxWidth: '600px',
    margin: '0 auto',
  },
  comingSoonIcon: {
    fontSize: '4rem',
    marginBottom: '1rem',
  },
  comingSoonTitle: {
    color: '#1e293b',
    marginBottom: '1rem',
  },
  comingSoonText: {
    color: '#64748b',
    lineHeight: 1.6,
    marginBottom: '2rem',
  },
  featuresContainer: {
    backgroundColor: '#f8fafc',
    padding: '1.5rem',
    borderRadius: '8px',
    marginBottom: '1.5rem',
  },
  featuresTitle: {
    color: '#1e293b',
    marginBottom: '1rem',
  },
  featuresList: {
    textAlign: 'left' as const,
    color: '#64748b',
    lineHeight: 1.6,
  },
  exportNote: {
    backgroundColor: '#eff6ff',
    padding: '1rem',
    borderRadius: '6px',
    color: '#1e40af',
  },
};

// Add CSS animation for spinner
const styleSheet = document.createElement('style');
styleSheet.innerText = `
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`;
document.head.appendChild(styleSheet);
