import { useState, useEffect } from 'react';
import './Suppliers.css';
import { fetchSuppliers, createSupplier, type Supplier, type CreateSupplierInput } from '../utils/advancedApi';

export default function Suppliers() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newSupplier, setNewSupplier] = useState({
    name: '',
    supplierCode: '',
    supplierType: 'distributor' as 'distributor' | 'manufacturer' | 'retailer',
    contactPerson: '',
    email: '',
    phone: ''
  });

  useEffect(() => {
    // Fetch suppliers from GraphQL backend
    const loadSuppliers = async () => {
      try {
        const data = await fetchSuppliers();
        setSuppliers(data);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching suppliers:', error);
        setLoading(false);
      }
    };

    loadSuppliers();
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
        Loading suppliers...
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
            🏢 Suppliers
          </h1>
          <p style={{
            color: '#6b7280',
            margin: 0
          }}>
            Manage your supplier relationships and performance
          </p>
        </div>
        <button
          onClick={() => setShowAddForm(true)}
          style={{
            background: 'linear-gradient(135deg, #3b82f6, #1d4ed8)',
            color: 'white',
            border: 'none',
            borderRadius: '0.75rem',
            padding: '0.75rem 1.5rem',
            fontSize: '1rem',
            fontWeight: '600',
            cursor: 'pointer',
            boxShadow: '0 4px 12px rgba(59, 130, 246, 0.4)',
            transition: 'all 0.2s ease'
          }}
          onMouseOver={(e) => {
            e.currentTarget.style.transform = 'translateY(-2px)';
            e.currentTarget.style.boxShadow = '0 8px 25px rgba(59, 130, 246, 0.4)';
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = '0 4px 12px rgba(59, 130, 246, 0.4)';
          }}
        >
          + Add Supplier
        </button>
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
            {suppliers.filter(s => s.status === 'active').length}
          </div>
          <div style={{ color: '#6b7280', fontSize: '0.875rem' }}>Active Suppliers</div>
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
            {Math.round(suppliers.reduce((acc, s) => acc + (s.onTimeDeliveryRate || 0), 0) / suppliers.length)}%
          </div>
          <div style={{ color: '#6b7280', fontSize: '0.875rem' }}>Avg On-Time Delivery</div>
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
            {(suppliers.reduce((acc, s) => acc + (s.qualityScore || 0), 0) / suppliers.length).toFixed(1)}
          </div>
          <div style={{ color: '#6b7280', fontSize: '0.875rem' }}>Avg Quality Score</div>
        </div>
      </div>

      {/* Suppliers Table */}
      <div style={{
        background: 'white',
        borderRadius: '1rem',
        overflow: 'hidden',
        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.05)',
        border: '1px solid #e5e7eb'
      }}>
        <div style={{
          padding: '1.5rem',
          borderBottom: '1px solid #e5e7eb',
          background: '#f9fafb'
        }}>
          <h3 style={{
            margin: 0,
            fontSize: '1.125rem',
            fontWeight: '600',
            color: '#1f2937'
          }}>
            All Suppliers
          </h3>
        </div>
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
                  Supplier
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
                  Status
                </th>
                <th style={{ 
                  padding: '1rem', 
                  textAlign: 'left', 
                  fontWeight: '600', 
                  color: '#374151',
                  borderBottom: '1px solid #e5e7eb'
                }}>
                  Contact
                </th>
                <th style={{ 
                  padding: '1rem', 
                  textAlign: 'left', 
                  fontWeight: '600', 
                  color: '#374151',
                  borderBottom: '1px solid #e5e7eb'
                }}>
                  Performance
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
              {suppliers.map((supplier) => (
                <tr key={supplier.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                  <td style={{ padding: '1rem' }}>
                    <div>
                      <div style={{ 
                        fontWeight: '600', 
                        color: '#1f2937',
                        marginBottom: '0.25rem'
                      }}>
                        {supplier.name}
                      </div>
                      <div style={{ 
                        fontSize: '0.875rem', 
                        color: '#6b7280'
                      }}>
                        Code: {supplier.supplierCode}
                      </div>
                    </div>
                  </td>
                  <td style={{ padding: '1rem' }}>
                    <span style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      fontSize: '0.875rem',
                      color: '#374151'
                    }}>
                      {getTypeIcon(supplier.supplierType)}
                      {supplier.supplierType}
                    </span>
                  </td>
                  <td style={{ padding: '1rem' }}>
                    <span style={{
                      display: 'inline-block',
                      padding: '0.25rem 0.75rem',
                      borderRadius: '9999px',
                      fontSize: '0.75rem',
                      fontWeight: '600',
                      background: getStatusColor(supplier.status) + '20',
                      color: getStatusColor(supplier.status)
                    }}>
                      {supplier.status}
                    </span>
                  </td>
                  <td style={{ padding: '1rem' }}>
                    <div>
                      <div style={{ 
                        fontSize: '0.875rem', 
                        color: '#1f2937',
                        marginBottom: '0.25rem'
                      }}>
                        {supplier.contactPerson}
                      </div>
                      <div style={{ 
                        fontSize: '0.75rem', 
                        color: '#6b7280'
                      }}>
                        {supplier.email}
                      </div>
                    </div>
                  </td>
                  <td style={{ padding: '1rem' }}>
                    <div style={{ fontSize: '0.875rem' }}>
                      <div style={{ marginBottom: '0.25rem' }}>
                        Quality: <span style={{ fontWeight: '600', color: '#10b981' }}>
                          {supplier.qualityScore}/5
                        </span>
                      </div>
                      <div>
                        On-time: <span style={{ fontWeight: '600', color: '#3b82f6' }}>
                          {supplier.onTimeDeliveryRate}%
                        </span>
                      </div>
                    </div>
                  </td>
                  <td style={{ padding: '1rem' }}>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button style={{
                        padding: '0.5rem',
                        background: '#f3f4f6',
                        border: 'none',
                        borderRadius: '0.5rem',
                        cursor: 'pointer',
                        fontSize: '0.875rem'
                      }}>
                        Edit
                      </button>
                      <button style={{
                        padding: '0.5rem',
                        background: '#3b82f6',
                        color: 'white',
                        border: 'none',
                        borderRadius: '0.5rem',
                        cursor: 'pointer',
                        fontSize: '0.875rem'
                      }}>
                        View
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Supplier Modal */}
      {showAddForm && (
        <div className="suppliers-modal-overlay">
          <div className="suppliers-modal-content">
            <h3 className="suppliers-modal-title">Add New Supplier</h3>
            <form onSubmit={async (e) => {
              e.preventDefault();
              try {
                const newSupplierData = await createSupplier(newSupplier);
                setSuppliers(prev => [...prev, newSupplierData]);
                setShowAddForm(false);
                setNewSupplier({
                  name: '',
                  supplierCode: '',
                  supplierType: 'distributor',
                  contactPerson: '',
                  email: '',
                  phone: ''
                });
              } catch (error) {
                console.error('Error creating supplier:', error);
              }
            }}>
              <div style={{ display: 'grid', gap: '1rem', marginBottom: '1.5rem' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600', color: '#374151' }}>
                      Supplier Name *
                    </label>
                    <input
                      type="text"
                      value={newSupplier.name}
                      onChange={(e) => setNewSupplier({ ...newSupplier, name: e.target.value })}
                      required
                      style={{
                        width: '100%',
                        padding: '0.75rem',
                        border: '2px solid #e5e7eb',
                        borderRadius: '0.5rem',
                        fontSize: '1rem'
                      }}
                      placeholder="Enter supplier name"
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600', color: '#374151' }}>
                      Supplier Code *
                    </label>
                    <input
                      type="text"
                      value={newSupplier.supplierCode}
                      onChange={(e) => setNewSupplier({ ...newSupplier, supplierCode: e.target.value })}
                      required
                      style={{
                        width: '100%',
                        padding: '0.75rem',
                        border: '2px solid #e5e7eb',
                        borderRadius: '0.5rem',
                        fontSize: '1rem'
                      }}
                      placeholder="e.g., SUP001"
                    />
                  </div>
                </div>
                
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600', color: '#374151' }}>
                      Supplier Type
                    </label>
                    <select
                      value={newSupplier.supplierType}
                      onChange={(e) => setNewSupplier({ ...newSupplier, supplierType: e.target.value as any })}
                      style={{
                        width: '100%',
                        padding: '0.75rem',
                        border: '2px solid #e5e7eb',
                        borderRadius: '0.5rem',
                        fontSize: '1rem'
                      }}
                    >
                      <option value="distributor">Distributor</option>
                      <option value="manufacturer">Manufacturer</option>
                      <option value="retailer">Retailer</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600', color: '#374151' }}>
                      Contact Person
                    </label>
                    <input
                      type="text"
                      value={newSupplier.contactPerson}
                      onChange={(e) => setNewSupplier({ ...newSupplier, contactPerson: e.target.value })}
                      style={{
                        width: '100%',
                        padding: '0.75rem',
                        border: '2px solid #e5e7eb',
                        borderRadius: '0.5rem',
                        fontSize: '1rem'
                      }}
                      placeholder="Contact person name"
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600', color: '#374151' }}>
                      Email
                    </label>
                    <input
                      type="email"
                      value={newSupplier.email}
                      onChange={(e) => setNewSupplier({ ...newSupplier, email: e.target.value })}
                      style={{
                        width: '100%',
                        padding: '0.75rem',
                        border: '2px solid #e5e7eb',
                        borderRadius: '0.5rem',
                        fontSize: '1rem'
                      }}
                      placeholder="supplier@company.com"
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600', color: '#374151' }}>
                      Phone
                    </label>
                    <input
                      type="tel"
                      value={newSupplier.phone}
                      onChange={(e) => setNewSupplier({ ...newSupplier, phone: e.target.value })}
                      style={{
                        width: '100%',
                        padding: '0.75rem',
                        border: '2px solid #e5e7eb',
                        borderRadius: '0.5rem',
                        fontSize: '1rem'
                      }}
                      placeholder="+1-555-0123"
                    />
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="suppliers-btn-close"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{
                    background: '#10b981',
                    color: 'white',
                    border: 'none',
                    borderRadius: '0.5rem',
                    padding: '0.75rem 1.5rem',
                    cursor: 'pointer',
                    fontWeight: '600'
                  }}
                >
                  Add Supplier
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
