import { useState, useEffect } from 'react';
import './PurchaseOrders.css';
import Modal from '../components/Modal';
import { fetchPurchaseOrders, createPurchaseOrder, type PurchaseOrder, type CreatePurchaseOrderInput } from '../utils/advancedApi';

export default function PurchaseOrders() {
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newPO, setNewPO] = useState({
    supplierName: '',
    priority: 'normal' as 'low' | 'normal' | 'high' | 'urgent',
    expectedDeliveryDate: ''
  });
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    // Fetch purchase orders from GraphQL backend
    const loadPurchaseOrders = async () => {
      try {
        const data = await fetchPurchaseOrders();
        setPurchaseOrders(data);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching purchase orders:', error);
        setLoading(false);
      }
    };

    loadPurchaseOrders();
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft': return '#6b7280';
      case 'pending_approval': return '#f59e0b';
      case 'approved': return '#3b82f6';
      case 'sent': return '#8b5cf6';
      case 'acknowledged': return '#06b6d4';
      case 'partially_received': return '#10b981';
      case 'received': return '#10b981';
      case 'cancelled': return '#ef4444';
      default: return '#6b7280';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return '#ef4444';
      case 'high': return '#f59e0b';
      case 'normal': return '#3b82f6';
      case 'low': return '#6b7280';
      default: return '#6b7280';
    }
  };

  const filteredOrders = statusFilter === 'all' 
    ? purchaseOrders 
    : purchaseOrders.filter(po => po.status === statusFilter);

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
        Loading purchase orders...
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
            🛒 Purchase Orders
          </h1>
          <p style={{
            color: '#6b7280',
            margin: 0
          }}>
            Manage and track your purchase orders
          </p>
        </div>
        <button
          data-testid="po-open"
          onClick={() => setShowCreateForm(true)}
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
          + Create Purchase Order
        </button>
      </div>

      {/* Stats Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
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
            {purchaseOrders.length}
          </div>
          <div style={{ color: '#6b7280', fontSize: '0.875rem' }}>Total Orders</div>
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
            {purchaseOrders.filter(po => po.status === 'pending_approval').length}
          </div>
          <div style={{ color: '#6b7280', fontSize: '0.875rem' }}>Pending Approval</div>
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
            ${purchaseOrders.reduce((acc, po) => acc + po.totalAmount, 0).toLocaleString()}
          </div>
          <div style={{ color: '#6b7280', fontSize: '0.875rem' }}>Total Value</div>
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
            {purchaseOrders.filter(po => po.status === 'sent' || po.status === 'acknowledged').length}
          </div>
          <div style={{ color: '#6b7280', fontSize: '0.875rem' }}>In Transit</div>
        </div>
      </div>

      {/* Filters */}
      <div style={{
        background: 'white',
        borderRadius: '1rem',
        padding: '1.5rem',
        marginBottom: '1.5rem',
        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.05)',
        border: '1px solid #e5e7eb'
      }}>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <span style={{ fontWeight: '600', color: '#374151' }}>Filter by status:</span>
          {['all', 'pending_approval', 'sent', 'received', 'cancelled'].map((status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              style={{
                padding: '0.5rem 1rem',
                borderRadius: '0.5rem',
                border: 'none',
                cursor: 'pointer',
                fontWeight: '500',
                background: statusFilter === status 
                  ? '#3b82f6' 
                  : '#f3f4f6',
                color: statusFilter === status 
                  ? 'white' 
                  : '#374151'
              }}
            >
              {status.replace('_', ' ')}
            </button>
          ))}
        </div>
      </div>

      {/* Purchase Orders Table */}
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
            Purchase Orders ({filteredOrders.length})
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
                  PO Number
                </th>
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
                  Status
                </th>
                <th style={{ 
                  padding: '1rem', 
                  textAlign: 'left', 
                  fontWeight: '600', 
                  color: '#374151',
                  borderBottom: '1px solid #e5e7eb'
                }}>
                  Priority
                </th>
                <th style={{ 
                  padding: '1rem', 
                  textAlign: 'left', 
                  fontWeight: '600', 
                  color: '#374151',
                  borderBottom: '1px solid #e5e7eb'
                }}>
                  Total Amount
                </th>
                <th style={{ 
                  padding: '1rem', 
                  textAlign: 'left', 
                  fontWeight: '600', 
                  color: '#374151',
                  borderBottom: '1px solid #e5e7eb'
                }}>
                  Delivery Date
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
              {filteredOrders.map((order) => (
                <tr key={order.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                  <td style={{ padding: '1rem' }}>
                    <div>
                      <div style={{ 
                        fontWeight: '600', 
                        color: '#1f2937',
                        marginBottom: '0.25rem'
                      }}>
                        {order.poNumber}
                      </div>
                      <div style={{ 
                        fontSize: '0.875rem', 
                        color: '#6b7280'
                      }}>
                        {order.itemCount} items
                      </div>
                    </div>
                  </td>
                  <td style={{ padding: '1rem', color: '#374151' }}>
                    {order.supplierName}
                  </td>
                  <td style={{ padding: '1rem' }}>
                    <span style={{
                      display: 'inline-block',
                      padding: '0.25rem 0.75rem',
                      borderRadius: '9999px',
                      fontSize: '0.75rem',
                      fontWeight: '600',
                      background: getStatusColor(order.status) + '20',
                      color: getStatusColor(order.status)
                    }}>
                      {order.status.replace('_', ' ')}
                    </span>
                  </td>
                  <td style={{ padding: '1rem' }}>
                    <span style={{
                      display: 'inline-block',
                      padding: '0.25rem 0.75rem',
                      borderRadius: '9999px',
                      fontSize: '0.75rem',
                      fontWeight: '600',
                      background: getPriorityColor(order.priority) + '20',
                      color: getPriorityColor(order.priority)
                    }}>
                      {order.priority}
                    </span>
                  </td>
                  <td style={{ padding: '1rem' }}>
                    <div style={{ fontWeight: '600', color: '#1f2937' }}>
                      ${order.totalAmount.toLocaleString()} {order.currency}
                    </div>
                  </td>
                  <td style={{ padding: '1rem', fontSize: '0.875rem', color: '#374151' }}>
                    {order.expectedDeliveryDate 
                      ? new Date(order.expectedDeliveryDate).toLocaleDateString()
                      : 'TBD'
                    }
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

      {/* Create PO Modal */}
      <Modal isOpen={showCreateForm} onClose={() => setShowCreateForm(false)} title="🛒 Create Purchase Order">
        <form onSubmit={async (e) => {
          e.preventDefault();
          try {
            const newPurchaseOrder = await createPurchaseOrder(newPO);
            setPurchaseOrders(prev => [...prev, newPurchaseOrder]);
            setShowCreateForm(false);
            setNewPO({ supplierName: '', priority: 'normal', expectedDeliveryDate: '' });
          } catch (error) {
            console.error('Error creating purchase order:', error);
          }
        }}>
          <div style={{ display: 'grid', gap: '1rem', marginBottom: '1.5rem' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600', color: '#374151' }}>
                Supplier *
              </label>
              <select
                data-testid="po-supplier"
                value={newPO.supplierName}
                onChange={(e) => setNewPO({ ...newPO, supplierName: e.target.value })}
                required
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: '2px solid #e5e7eb',
                  borderRadius: '0.5rem',
                  fontSize: '1rem'
                }}
              >
                <option value="">Select a supplier</option>
                <option value="Tech Supply Co">Tech Supply Co</option>
                <option value="Global Electronics">Global Electronics</option>
                <option value="Office Solutions Ltd">Office Solutions Ltd</option>
              </select>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600', color: '#374151' }}>
                  Priority
                </label>
                <select
                  data-testid="po-priority"
                  value={newPO.priority}
                  onChange={(e) => setNewPO({ ...newPO, priority: e.target.value as any })}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '2px solid #e5e7eb',
                    borderRadius: '0.5rem',
                    fontSize: '1rem'
                  }}
                >
                  <option value="low">Low</option>
                  <option value="normal">Normal</option>
                  <option value="high">High</option>
                  <option value="urgent">Urgent</option>
                </select>
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600', color: '#374151' }}>
                  Expected Delivery
                </label>
                <input
                  data-testid="po-expected-delivery"
                  type="date"
                  value={newPO.expectedDeliveryDate}
                  onChange={(e) => setNewPO({ ...newPO, expectedDeliveryDate: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '2px solid #e5e7eb',
                    borderRadius: '0.5rem',
                    fontSize: '1rem'
                  }}
                />
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
            <button
              type="button"
              onClick={() => setShowCreateForm(false)}
              className="btn btn-secondary"
            >
              Cancel
            </button>
            <button
              type="submit"
              data-testid="po-submit"
              className="btn btn-primary"
            >
              Create Purchase Order
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
