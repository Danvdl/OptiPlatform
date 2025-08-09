import { useState, useEffect } from 'react';
import './Suppliers.css';
import { fetchSuppliers, createSupplier, type Supplier, type CreateSupplierInput } from '../services/suppliersService';

export default function Suppliers() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newSupplier, setNewSupplier] = useState<CreateSupplierInput>({
    name: '',
    supplierCode: '',
    supplierType: 'distributor',
    contactPerson: '',
    email: '',
    phone: '',
    description: '',
    address: '',
    discountPercentage: undefined,
    freeShippingThreshold: undefined,
  });

  useEffect(() => {
    const load = async () => {
      try {
        const data = await fetchSuppliers();
        setSuppliers(data);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return '#10b981';
      case 'inactive': return '#6b7280';
      case 'suspended': return '#ef4444';
      default: return '#f59e0b';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'manufacturer': return '🏭';
      case 'distributor': return '📦';
      case 'wholesaler': return '🏪';
      case 'retailer': return '🛒';
      default: return '🏢';
    }
  };

  const resetForm = () => setNewSupplier({
    name: '', supplierCode: '', supplierType: 'distributor', contactPerson: '', email: '', phone: '', description: '', address: '', discountPercentage: undefined, freeShippingThreshold: undefined,
  });

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSupplier.name?.trim()) return;
    try {
      const created = await createSupplier(newSupplier);
      setSuppliers(prev => [created, ...prev]);
      setShowAddForm(false);
      resetForm();
    } catch (err) {
      console.error('Create supplier failed', err);
    }
  };

  if (loading) {
    return <div className="suppliers-loading">Loading suppliers...</div>;
  }

  const activeCount = suppliers.filter(s => s.status === 'active').length;
  const avgOnTime = suppliers.length ? Math.round(suppliers.reduce((acc, s) => acc + (s.onTimeDeliveryRate || 0), 0) / suppliers.length) : 0;
  const avgQuality = suppliers.length ? (suppliers.reduce((acc, s) => acc + (s.qualityScore || 0), 0) / suppliers.length).toFixed(1) : '0.0';

  return (
    <div className="suppliers-container">
      <div className="suppliers-header">
        <div>
          <h1>🏢 Suppliers</h1>
          <p>Manage your supplier relationships and performance</p>
        </div>
        <div className="suppliers-header-actions">
          <button data-testid="add-supplier-btn" onClick={() => setShowAddForm(true)} className="suppliers-btn-primary">+ Add Supplier</button>
        </div>
      </div>

      <div className="suppliers-stats-grid">
        <div className="suppliers-stat-card">
          <div className="suppliers-stat-header">
            <div className="suppliers-stat-icon" style={{ background: '#e0f2fe', color: '#0284c7' }}>📈</div>
            <div className="suppliers-stat-label">Active Suppliers</div>
          </div>
          <div className="suppliers-stat-value">{activeCount}</div>
          <div className="suppliers-stat-change">Currently active in your network</div>
        </div>
        <div className="suppliers-stat-card">
          <div className="suppliers-stat-header">
            <div className="suppliers-stat-icon" style={{ background: '#dcfce7', color: '#16a34a' }}>⏱️</div>
            <div className="suppliers-stat-label">Avg On-Time Delivery</div>
          </div>
          <div className="suppliers-stat-value">{avgOnTime}%</div>
          <div className="suppliers-stat-change">Based on last 12 months</div>
        </div>
        <div className="suppliers-stat-card">
          <div className="suppliers-stat-header">
            <div className="suppliers-stat-icon" style={{ background: '#fef3c7', color: '#f59e0b' }}>⭐</div>
            <div className="suppliers-stat-label">Avg Quality Score</div>
          </div>
          <div className="suppliers-stat-value">{avgQuality}</div>
          <div className="suppliers-stat-change">1–100 aggregate</div>
        </div>
      </div>

      <div className="suppliers-table-container">
        <div className="suppliers-table-header">
          <h3 className="suppliers-table-title">Supplier Directory</h3>
        </div>
        <div className="suppliers-table-scroll">
          <table className="suppliers-table">
            <thead>
              <tr>
                <th>Supplier</th>
                <th>Code</th>
                <th>Type</th>
                <th>Status</th>
                <th>Reliability</th>
                <th>Quality</th>
                <th>On-time</th>
              </tr>
            </thead>
            <tbody>
              {suppliers.map(s => (
                <tr key={s.id}>
                  <td>
                    <div className="suppliers-table-supplier-info">
                      <h3>{s.name}</h3>
                      <div className="suppliers-table-supplier-contact">
                        {s.contactPerson ? `${s.contactPerson} • ` : ''}{s.email || s.phone || 'No contact info'}
                      </div>
                    </div>
                  </td>
                  <td>{s.supplierCode || '-'}</td>
                  <td>
                    <span className="suppliers-table-type-badge" style={{ background: '#eef2ff', color: '#4f46e5' }}>
                      {getTypeIcon(s.type)} {s.type.replace('_', ' ')}
                    </span>
                  </td>
                  <td>
                    <span className="suppliers-table-status-badge" style={{ background: getStatusColor(s.status), color: 'white' }}>
                      {s.status.replace('_', ' ')}
                    </span>
                  </td>
                  <td>
                    <div className="suppliers-table-metric-value">{s.reliabilityScore ?? '-'}</div>
                    <div className="suppliers-table-metric-label">1–100</div>
                  </td>
                  <td>
                    <div className="suppliers-table-metric-value">{s.qualityScore ?? '-'}</div>
                    <div className="suppliers-table-metric-label">1–100</div>
                  </td>
                  <td>
                    <div className="suppliers-table-metric-value">{s.onTimeDeliveryRate ? `${Math.round(s.onTimeDeliveryRate)}%` : '-'}</div>
                    <div className="suppliers-table-metric-label">On-time</div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showAddForm && (
        <div className="suppliers-modal-overlay" data-testid="add-supplier-modal">
          <div className="suppliers-modal-content">
            <h3 className="suppliers-modal-title">Add Supplier</h3>
            <p className="suppliers-modal-description">Provide basic details to register a new supplier.</p>
            <form onSubmit={onSubmit}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, color: '#374151' }}>Name *</label>
                  <input
                    data-testid="supplier-name-input"
                    type="text"
                    value={newSupplier.name}
                    onChange={(e) => setNewSupplier({ ...newSupplier, name: e.target.value })}
                    required
                    style={{ width: '100%', padding: '0.75rem', border: '2px solid #e5e7eb', borderRadius: '0.5rem', fontSize: '1rem' }}
                    placeholder="Enter supplier name"
                  />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, color: '#374151' }}>Supplier Code</label>
                  <input
                    type="text"
                    value={newSupplier.supplierCode || ''}
                    onChange={(e) => setNewSupplier({ ...newSupplier, supplierCode: e.target.value })}
                    style={{ width: '100%', padding: '0.75rem', border: '2px solid #e5e7eb', borderRadius: '0.5rem', fontSize: '1rem' }}
                    placeholder="e.g., SUP001"
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, color: '#374151' }}>Supplier Type</label>
                  <select
                    value={newSupplier.supplierType}
                    onChange={(e) => setNewSupplier({ ...newSupplier, supplierType: e.target.value as CreateSupplierInput['supplierType'] })}
                    style={{ width: '100%', padding: '0.75rem', border: '2px solid #e5e7eb', borderRadius: '0.5rem', fontSize: '1rem' }}
                  >
                    <option value="distributor">Distributor</option>
                    <option value="manufacturer">Manufacturer</option>
                    <option value="wholesaler">Wholesaler</option>
                    <option value="retailer">Retailer</option>
                    <option value="service_provider">Service provider</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, color: '#374151' }}>Contact Person</label>
                  <input
                    type="text"
                    value={newSupplier.contactPerson || ''}
                    onChange={(e) => setNewSupplier({ ...newSupplier, contactPerson: e.target.value })}
                    style={{ width: '100%', padding: '0.75rem', border: '2px solid #e5e7eb', borderRadius: '0.5rem', fontSize: '1rem' }}
                    placeholder="Contact person name"
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, color: '#374151' }}>Email</label>
                  <input
                    type="email"
                    value={newSupplier.email || ''}
                    onChange={(e) => setNewSupplier({ ...newSupplier, email: e.target.value })}
                    style={{ width: '100%', padding: '0.75rem', border: '2px solid #e5e7eb', borderRadius: '0.5rem', fontSize: '1rem' }}
                    placeholder="supplier@company.com"
                  />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, color: '#374151' }}>Phone</label>
                  <input
                    type="tel"
                    value={newSupplier.phone || ''}
                    onChange={(e) => setNewSupplier({ ...newSupplier, phone: e.target.value })}
                    style={{ width: '100%', padding: '0.75rem', border: '2px solid #e5e7eb', borderRadius: '0.5rem', fontSize: '1rem' }}
                    placeholder="+1-555-0123"
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1rem', marginBottom: '1rem' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, color: '#374151' }}>Description</label>
                  <textarea
                    value={newSupplier.description || ''}
                    onChange={(e) => setNewSupplier({ ...newSupplier, description: e.target.value })}
                    style={{ width: '100%', padding: '0.75rem', border: '2px solid #e5e7eb', borderRadius: '0.5rem', fontSize: '1rem' }}
                    placeholder="Short description of the supplier"
                    rows={3}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, color: '#374151' }}>Address</label>
                  <input
                    type="text"
                    value={newSupplier.address || ''}
                    onChange={(e) => setNewSupplier({ ...newSupplier, address: e.target.value })}
                    style={{ width: '100%', padding: '0.75rem', border: '2px solid #e5e7eb', borderRadius: '0.5rem', fontSize: '1rem' }}
                    placeholder="Street, City, Country"
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, color: '#374151' }}>Discount (%)</label>
                  <input
                    type="number"
                    step="0.01"
                    min={0}
                    max={100}
                    value={newSupplier.discountPercentage ?? ''}
                    onChange={(e) => setNewSupplier({ ...newSupplier, discountPercentage: e.target.value === '' ? undefined : Number(e.target.value) })}
                    style={{ width: '100%', padding: '0.75rem', border: '2px solid #e5e7eb', borderRadius: '0.5rem', fontSize: '1rem' }}
                    placeholder="e.g. 5"
                  />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, color: '#374151' }}>Free Shipping Threshold</label>
                  <input
                    type="number"
                    step="0.01"
                    min={0}
                    value={newSupplier.freeShippingThreshold ?? ''}
                    onChange={(e) => setNewSupplier({ ...newSupplier, freeShippingThreshold: e.target.value === '' ? undefined : Number(e.target.value) })}
                    style={{ width: '100%', padding: '0.75rem', border: '2px solid #e5e7eb', borderRadius: '0.5rem', fontSize: '1rem' }}
                    placeholder="e.g. 1000"
                  />
                </div>
              </div>

              <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
                <button type="button" onClick={() => { setShowAddForm(false); }} className="suppliers-btn-close">Cancel</button>
                <button type="submit" className="suppliers-btn-primary">Add Supplier</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
