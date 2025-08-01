import { useState, useEffect } from 'react';
import './Pricing.css';
import { fetchPricingData, type PricingData } from '../utils/advancedApi';

interface PriceHistory {
  id: number;
  productName: string;
  priceType: 'purchase' | 'sale';
  oldPrice: number;
  newPrice: number;
  currency: string;
  changedAt: string;
  reason?: string;
}

interface Product {
  id: number;
  name: string;
  sku?: string;
  purchasePrice?: number;
  salePrice?: number;
  currency: string;
  currentStock: number;
  inventoryValue: number;
  potentialRevenue: number;
  potentialProfit: number;
}

export default function Pricing() {
  const [products, setProducts] = useState<Product[]>([]);
  const [priceHistory, setPriceHistory] = useState<PriceHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'history' | 'bulk-update'>('overview');

  useEffect(() => {
    // Fetch pricing data from GraphQL backend
    const loadPricingData = async () => {
      try {
        const data = await fetchPricingData();
        // Map the pricing data to the expected format
        const mappedProducts = data.map((item) => ({
          id: item.id,
          name: item.productName,
          sku: `SKU${item.id.toString().padStart(3, '0')}`,
          purchasePrice: item.costPrice,
          salePrice: item.sellingPrice,
          currency: 'USD',
          currentStock: Math.floor(item.inventoryValue / (item.costPrice || 1)),
          inventoryValue: item.inventoryValue,
          potentialRevenue: item.potentialRevenue,
          potentialProfit: item.potentialRevenue - item.inventoryValue
        }));
        setProducts(mappedProducts);

        // Sample price history data - in real implementation, this would come from GraphQL too
        setPriceHistory([
          {
            id: 1,
            productName: 'Wireless Mouse',
            priceType: 'sale',
            oldPrice: 24.99,
            newPrice: 29.99,
            currency: 'USD',
            changedAt: '2025-07-15',
            reason: 'Market price adjustment'
          },
          {
            id: 2,
            productName: 'USB Cable Type-C',
            priceType: 'purchase',
            oldPrice: 3.50,
            newPrice: 3.25,
            currency: 'USD',
            changedAt: '2025-07-10',
            reason: 'Supplier discount negotiated'
          }
        ]);

        setLoading(false);
      } catch (error) {
        console.error('Error fetching pricing data:', error);
        setLoading(false);
      }
    };

    loadPricingData();
  }, []);

  const totalInventoryValue = products.reduce((acc, p) => acc + p.inventoryValue, 0);
  const totalPotentialRevenue = products.reduce((acc, p) => acc + p.potentialRevenue, 0);
  const totalPotentialProfit = products.reduce((acc, p) => acc + p.potentialProfit, 0);

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '400px',
        fontSize: '1.125rem',
        color: '#6b7280'
      }}>
        Loading pricing data...
      </div>
    );
  }

  return (
    <div style={{ padding: '2rem' }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '2rem'
      }}>
        <div>
          <h1 style={{
            fontSize: '2rem',
            fontWeight: '700',
            color: '#1f2937',
            margin: '0 0 0.5rem 0'
          }}>
            💰 Pricing & Cost Management
          </h1>
          <p style={{
            color: '#6b7280',
            margin: 0
          }}>
            Manage product pricing, track costs, and analyze profitability
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
        gap: '1.5rem',
        marginBottom: '2rem'
      }}>
        <div style={{
          background: 'white',
          borderRadius: '1rem',
          padding: '1.5rem',
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.05)',
          border: '1px solid #e5e7eb'
        }}>
          <div style={{
            fontSize: '2rem',
            fontWeight: '700',
            color: '#3b82f6',
            marginBottom: '0.5rem'
          }}>
            ${totalInventoryValue.toLocaleString()}
          </div>
          <div style={{ color: '#6b7280', fontSize: '0.875rem' }}>Total Inventory Value</div>
        </div>
        <div style={{
          background: 'white',
          borderRadius: '1rem',
          padding: '1.5rem',
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.05)',
          border: '1px solid #e5e7eb'
        }}>
          <div style={{
            fontSize: '2rem',
            fontWeight: '700',
            color: '#10b981',
            marginBottom: '0.5rem'
          }}>
            ${totalPotentialRevenue.toLocaleString()}
          </div>
          <div style={{ color: '#6b7280', fontSize: '0.875rem' }}>Potential Revenue</div>
        </div>
        <div style={{
          background: 'white',
          borderRadius: '1rem',
          padding: '1.5rem',
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.05)',
          border: '1px solid #e5e7eb'
        }}>
          <div style={{
            fontSize: '2rem',
            fontWeight: '700',
            color: '#f59e0b',
            marginBottom: '0.5rem'
          }}>
            ${totalPotentialProfit.toLocaleString()}
          </div>
          <div style={{ color: '#6b7280', fontSize: '0.875rem' }}>Potential Profit</div>
        </div>
        <div style={{
          background: 'white',
          borderRadius: '1rem',
          padding: '1.5rem',
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.05)',
          border: '1px solid #e5e7eb'
        }}>
          <div style={{
            fontSize: '2rem',
            fontWeight: '700',
            color: '#8b5cf6',
            marginBottom: '0.5rem'
          }}>
            {totalPotentialProfit > 0 ? ((totalPotentialProfit / totalPotentialRevenue) * 100).toFixed(1) : 0}%
          </div>
          <div style={{ color: '#6b7280', fontSize: '0.875rem' }}>Avg Profit Margin</div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{
        background: 'white',
        borderRadius: '1rem',
        marginBottom: '1.5rem',
        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.05)',
        border: '1px solid #e5e7eb'
      }}>
        <div style={{
          display: 'flex',
          borderBottom: '1px solid #e5e7eb'
        }}>
          {(['overview', 'history', 'bulk-update'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              style={{
                padding: '1rem 1.5rem',
                border: 'none',
                background: activeTab === tab ? '#f9fafb' : 'transparent',
                color: activeTab === tab ? '#3b82f6' : '#6b7280',
                fontWeight: activeTab === tab ? '600' : '500',
                cursor: 'pointer',
                borderBottom: activeTab === tab ? '2px solid #3b82f6' : 'none'
              }}
            >
              {tab.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
            </button>
          ))}
        </div>

        <div style={{ padding: '1.5rem' }}>
          {activeTab === 'overview' && (
            <div>
              <h3 style={{ margin: '0 0 1.5rem 0', fontSize: '1.125rem', fontWeight: '600' }}>
                Product Pricing Overview
              </h3>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ background: '#f9fafb' }}>
                      <th style={{ 
                        padding: '1rem', 
                        textAlign: 'left', 
                        fontWeight: '600', 
                        color: '#374151',
                        borderBottom: '1px solid #e5e7eb'
                      }}>
                        Product
                      </th>
                      <th style={{ 
                        padding: '1rem', 
                        textAlign: 'left', 
                        fontWeight: '600', 
                        color: '#374151',
                        borderBottom: '1px solid #e5e7eb'
                      }}>
                        Purchase Price
                      </th>
                      <th style={{ 
                        padding: '1rem', 
                        textAlign: 'left', 
                        fontWeight: '600', 
                        color: '#374151',
                        borderBottom: '1px solid #e5e7eb'
                      }}>
                        Sale Price
                      </th>
                      <th style={{ 
                        padding: '1rem', 
                        textAlign: 'left', 
                        fontWeight: '600', 
                        color: '#374151',
                        borderBottom: '1px solid #e5e7eb'
                      }}>
                        Margin
                      </th>
                      <th style={{ 
                        padding: '1rem', 
                        textAlign: 'left', 
                        fontWeight: '600', 
                        color: '#374151',
                        borderBottom: '1px solid #e5e7eb'
                      }}>
                        Stock Value
                      </th>
                      <th style={{ 
                        padding: '1rem', 
                        textAlign: 'left', 
                        fontWeight: '600', 
                        color: '#374151',
                        borderBottom: '1px solid #e5e7eb'
                      }}>
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {products.map((product) => {
                      const margin = product.purchasePrice && product.salePrice 
                        ? ((product.salePrice - product.purchasePrice) / product.salePrice * 100)
                        : 0;
                      
                      return (
                        <tr key={product.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                          <td style={{ padding: '1rem' }}>
                            <div>
                              <div style={{ 
                                fontWeight: '600', 
                                color: '#1f2937',
                                marginBottom: '0.25rem'
                              }}>
                                {product.name}
                              </div>
                              <div style={{ 
                                fontSize: '0.875rem', 
                                color: '#6b7280'
                              }}>
                                SKU: {product.sku}
                              </div>
                            </div>
                          </td>
                          <td style={{ padding: '1rem' }}>
                            <span style={{ color: '#ef4444', fontWeight: '600' }}>
                              ${product.purchasePrice?.toFixed(2) || 'N/A'}
                            </span>
                          </td>
                          <td style={{ padding: '1rem' }}>
                            <span style={{ color: '#10b981', fontWeight: '600' }}>
                              ${product.salePrice?.toFixed(2) || 'N/A'}
                            </span>
                          </td>
                          <td style={{ padding: '1rem' }}>
                            <span style={{
                              color: margin > 50 ? '#10b981' : margin > 30 ? '#f59e0b' : '#ef4444',
                              fontWeight: '600'
                            }}>
                              {margin.toFixed(1)}%
                            </span>
                          </td>
                          <td style={{ padding: '1rem' }}>
                            <div>
                              <div style={{ fontWeight: '600', color: '#1f2937' }}>
                                ${product.inventoryValue.toLocaleString()}
                              </div>
                              <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>
                                {product.currentStock} units
                              </div>
                            </div>
                          </td>
                          <td style={{ padding: '1rem' }}>
                            <button style={{
                              padding: '0.5rem 1rem',
                              background: '#3b82f6',
                              color: 'white',
                              border: 'none',
                              borderRadius: '0.5rem',
                              cursor: 'pointer',
                              fontSize: '0.875rem'
                            }}>
                              Update Price
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'history' && (
            <div>
              <h3 style={{ margin: '0 0 1.5rem 0', fontSize: '1.125rem', fontWeight: '600' }}>
                Price Change History
              </h3>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ background: '#f9fafb' }}>
                      <th style={{ 
                        padding: '1rem', 
                        textAlign: 'left', 
                        fontWeight: '600', 
                        color: '#374151',
                        borderBottom: '1px solid #e5e7eb'
                      }}>
                        Product
                      </th>
                      <th style={{ 
                        padding: '1rem', 
                        textAlign: 'left', 
                        fontWeight: '600', 
                        color: '#374151',
                        borderBottom: '1px solid #e5e7eb'
                      }}>
                        Type
                      </th>
                      <th style={{ 
                        padding: '1rem', 
                        textAlign: 'left', 
                        fontWeight: '600', 
                        color: '#374151',
                        borderBottom: '1px solid #e5e7eb'
                      }}>
                        Price Change
                      </th>
                      <th style={{ 
                        padding: '1rem', 
                        textAlign: 'left', 
                        fontWeight: '600', 
                        color: '#374151',
                        borderBottom: '1px solid #e5e7eb'
                      }}>
                        Date
                      </th>
                      <th style={{ 
                        padding: '1rem', 
                        textAlign: 'left', 
                        fontWeight: '600', 
                        color: '#374151',
                        borderBottom: '1px solid #e5e7eb'
                      }}>
                        Reason
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {priceHistory.map((change) => (
                      <tr key={change.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                        <td style={{ padding: '1rem', fontWeight: '600', color: '#1f2937' }}>
                          {change.productName}
                        </td>
                        <td style={{ padding: '1rem' }}>
                          <span style={{
                            display: 'inline-block',
                            padding: '0.25rem 0.75rem',
                            borderRadius: '9999px',
                            fontSize: '0.75rem',
                            fontWeight: '600',
                            background: change.priceType === 'sale' ? '#10b98120' : '#ef444420',
                            color: change.priceType === 'sale' ? '#10b981' : '#ef4444'
                          }}>
                            {change.priceType}
                          </span>
                        </td>
                        <td style={{ padding: '1rem' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <span style={{ color: '#ef4444' }}>${change.oldPrice.toFixed(2)}</span>
                            <span style={{ color: '#6b7280' }}>→</span>
                            <span style={{ color: '#10b981' }}>${change.newPrice.toFixed(2)}</span>
                            <span style={{
                              fontSize: '0.875rem',
                              color: change.newPrice > change.oldPrice ? '#10b981' : '#ef4444'
                            }}>
                              ({change.newPrice > change.oldPrice ? '+' : ''}
                              {((change.newPrice - change.oldPrice) / change.oldPrice * 100).toFixed(1)}%)
                            </span>
                          </div>
                        </td>
                        <td style={{ padding: '1rem', color: '#6b7280', fontSize: '0.875rem' }}>
                          {new Date(change.changedAt).toLocaleDateString()}
                        </td>
                        <td style={{ padding: '1rem', color: '#6b7280', fontSize: '0.875rem' }}>
                          {change.reason || 'No reason provided'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'bulk-update' && (
            <div>
              <h3 style={{ margin: '0 0 1.5rem 0', fontSize: '1.125rem', fontWeight: '600' }}>
                Bulk Price Updates
              </h3>
              <div style={{
                background: '#f9fafb',
                border: '1px solid #e5e7eb',
                borderRadius: '0.75rem',
                padding: '2rem',
                textAlign: 'center'
              }}>
                <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🚧</div>
                <h4 style={{ margin: '0 0 0.5rem 0', color: '#1f2937' }}>Bulk Update Tool</h4>
                <p style={{ color: '#6b7280', margin: 0 }}>
                  Advanced bulk pricing tools will be implemented here, including:
                  <br />
                  • Category-based price adjustments
                  <br />
                  • Percentage-based increases/decreases
                  <br />
                  • CSV import/export functionality
                  <br />
                  • Margin-based pricing rules
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
