import { useState, useEffect } from 'react';
import './Transactions.css';

interface Transaction {
  id: number;
  productName: string;
  type: string;
  quantity: number;
  unitCost?: number;
  totalCost?: number;
  reason?: string;
  status: string;
  occurredAt: string;
  fromLocation?: string;
  toLocation?: string;
  supplierName?: string;
  reference?: string;
}

export default function Transactions() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newTransaction, setNewTransaction] = useState({
    productName: '',
    type: 'adjustment' as string,
    quantity: 0,
    reason: '',
    fromLocation: '',
    toLocation: ''
  });
  const [typeFilter, setTypeFilter] = useState('all');

  useEffect(() => {
    // Fetch transactions from GraphQL backend
    const fetchTransactions = async () => {
      try {
        // TODO: Implement actual GraphQL query when ready
        // For now using demo data until GraphQL integration is complete
        setTransactions([
      {
        id: 1,
        productName: 'Wireless Mouse',
        type: 'purchase',
        quantity: 50,
        unitCost: 15.50,
        totalCost: 775.00,
        status: 'completed',
        occurredAt: '2025-08-01T10:30:00Z',
        supplierName: 'Tech Supply Co',
        reference: 'PO250801001'
      },
      {
        id: 2,
        productName: 'USB Cable Type-C',
        type: 'sale',
        quantity: -25,
        unitCost: 8.99,
        totalCost: 224.75,
        status: 'completed',
        occurredAt: '2025-08-01T14:15:00Z',
        reference: 'SALE-2025-001'
      },
      {
        id: 3,
        productName: 'Laptop Stand',
        type: 'adjustment',
        quantity: -2,
        reason: 'Damaged during shipping',
        status: 'completed',
        occurredAt: '2025-07-31T09:00:00Z'
      },
      {
        id: 4,
        productName: 'Wireless Mouse',
        type: 'transfer_out',
        quantity: -10,
        status: 'pending',
        occurredAt: '2025-08-01T16:45:00Z',
        fromLocation: 'Warehouse A',
        toLocation: 'Store Front',
        reference: 'TXF-001'
      },
      {
        id: 5,
        productName: 'USB Cable Type-C',
        type: 'return_to_supplier',
        quantity: -5,
        reason: 'Defective units',
        status: 'completed',
        occurredAt: '2025-07-30T11:20:00Z',
        supplierName: 'Global Electronics'
      }
    ]);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching transactions:', error);
        setLoading(false);
      }
    };

    fetchTransactions();
  }, []);

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'purchase': return '#10b981';
      case 'sale': return '#3b82f6';
      case 'adjustment': return '#f59e0b';
      case 'transfer_in': return '#8b5cf6';
      case 'transfer_out': return '#6366f1';
      case 'return_to_supplier': return '#ef4444';
      case 'return_from_customer': return '#06b6d4';
      case 'waste': return '#dc2626';
      case 'damaged': return '#ea580c';
      case 'reserve': return '#7c3aed';
      case 'unreserve': return '#059669';
      default: return '#6b7280';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'purchase': return '📦';
      case 'sale': return '💰';
      case 'adjustment': return '⚖️';
      case 'transfer_in': return '📥';
      case 'transfer_out': return '📤';
      case 'return_to_supplier': return '↩️';
      case 'return_from_customer': return '↪️';
      case 'waste': return '🗑️';
      case 'damaged': return '🔧';
      case 'reserve': return '🔒';
      case 'unreserve': return '🔓';
      default: return '📋';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return '#10b981';
      case 'pending': return '#f59e0b';
      case 'cancelled': return '#ef4444';
      case 'reversed': return '#6b7280';
      default: return '#6b7280';
    }
  };

  const filteredTransactions = typeFilter === 'all' 
    ? transactions 
    : transactions.filter(t => t.type === typeFilter);

  const transactionTypes = Array.from(new Set(transactions.map(t => t.type)));

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
        Loading transactions...
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
            🔄 Advanced Transactions
          </h1>
          <p style={{
            color: '#6b7280',
            margin: 0
          }}>
            Track all inventory movements and advanced transaction types
          </p>
        </div>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <button
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
          >
            + New Transaction
          </button>
        </div>
      </div>

      {/* Transaction Type Stats */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '1rem',
        marginBottom: '2rem'
      }}>
        {transactionTypes.slice(0, 5).map((type) => {
          const typeTransactions = transactions.filter(t => t.type === type);
          const totalQuantity = typeTransactions.reduce((acc, t) => acc + Math.abs(t.quantity), 0);
          
          return (
            <div key={type} style={{
              background: 'white',
              borderRadius: '1rem',
              padding: '1.5rem',
              boxShadow: '0 4px 6px rgba(0, 0, 0, 0.05)',
              border: '1px solid #e5e7eb'
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                marginBottom: '0.5rem'
              }}>
                <span style={{ fontSize: '1.5rem' }}>{getTypeIcon(type)}</span>
                <span style={{ 
                  fontSize: '0.875rem', 
                  fontWeight: '600',
                  color: getTypeColor(type),
                  textTransform: 'capitalize'
                }}>
                  {type.replace('_', ' ')}
                </span>
              </div>
              <div style={{
                fontSize: '1.5rem',
                fontWeight: '700',
                color: '#1f2937',
                marginBottom: '0.25rem'
              }}>
                {typeTransactions.length}
              </div>
              <div style={{ color: '#6b7280', fontSize: '0.75rem' }}>
                {totalQuantity} units
              </div>
            </div>
          );
        })}
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
          <span style={{ fontWeight: '600', color: '#374151' }}>Filter by type:</span>
          <button
            onClick={() => setTypeFilter('all')}
            style={{
              padding: '0.5rem 1rem',
              borderRadius: '0.5rem',
              border: 'none',
              cursor: 'pointer',
              fontWeight: '500',
              background: typeFilter === 'all' ? '#3b82f6' : '#f3f4f6',
              color: typeFilter === 'all' ? 'white' : '#374151'
            }}
          >
            All
          </button>
          {transactionTypes.map((type) => (
            <button
              key={type}
              onClick={() => setTypeFilter(type)}
              style={{
                padding: '0.5rem 1rem',
                borderRadius: '0.5rem',
                border: 'none',
                cursor: 'pointer',
                fontWeight: '500',
                background: typeFilter === type ? getTypeColor(type) : '#f3f4f6',
                color: typeFilter === type ? 'white' : '#374151',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}
            >
              {getTypeIcon(type)}
              {type.replace('_', ' ')}
            </button>
          ))}
        </div>
      </div>

      {/* Transactions Table */}
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
            Transaction History ({filteredTransactions.length})
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
                  Product & Type
                </th>
                <th style={{ 
                  padding: '1rem', 
                  textAlign: 'left', 
                  fontWeight: '600', 
                  color: '#374151',
                  borderBottom: '1px solid #e5e7eb'
                }}>
                  Quantity & Cost
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
                  Date
                </th>
                <th style={{ 
                  padding: '1rem', 
                  textAlign: 'left', 
                  fontWeight: '600', 
                  color: '#374151',
                  borderBottom: '1px solid #e5e7eb'
                }}>
                  Details
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
              {filteredTransactions.map((transaction) => (
                <tr key={transaction.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                  <td style={{ padding: '1rem' }}>
                    <div>
                      <div style={{ 
                        fontWeight: '600', 
                        color: '#1f2937',
                        marginBottom: '0.25rem'
                      }}>
                        {transaction.productName}
                      </div>
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem'
                      }}>
                        <span style={{ fontSize: '1rem' }}>{getTypeIcon(transaction.type)}</span>
                        <span style={{ 
                          fontSize: '0.875rem', 
                          color: getTypeColor(transaction.type),
                          fontWeight: '500'
                        }}>
                          {transaction.type.replace('_', ' ')}
                        </span>
                      </div>
                    </div>
                  </td>
                  <td style={{ padding: '1rem' }}>
                    <div>
                      <div style={{ 
                        fontWeight: '600',
                        color: transaction.quantity > 0 ? '#10b981' : '#ef4444',
                        marginBottom: '0.25rem'
                      }}>
                        {transaction.quantity > 0 ? '+' : ''}{transaction.quantity} units
                      </div>
                      {transaction.totalCost && (
                        <div style={{ 
                          fontSize: '0.875rem', 
                          color: '#6b7280'
                        }}>
                          ${transaction.totalCost.toLocaleString()}
                          {transaction.unitCost && ` (@$${transaction.unitCost})`}
                        </div>
                      )}
                    </div>
                  </td>
                  <td style={{ padding: '1rem' }}>
                    <span style={{
                      display: 'inline-block',
                      padding: '0.25rem 0.75rem',
                      borderRadius: '9999px',
                      fontSize: '0.75rem',
                      fontWeight: '600',
                      background: getStatusColor(transaction.status) + '20',
                      color: getStatusColor(transaction.status)
                    }}>
                      {transaction.status}
                    </span>
                  </td>
                  <td style={{ padding: '1rem', fontSize: '0.875rem', color: '#6b7280' }}>
                    {new Date(transaction.occurredAt).toLocaleDateString()}
                    <br />
                    {new Date(transaction.occurredAt).toLocaleTimeString([], { 
                      hour: '2-digit', 
                      minute: '2-digit' 
                    })}
                  </td>
                  <td style={{ padding: '1rem', fontSize: '0.875rem' }}>
                    {transaction.supplierName && (
                      <div style={{ marginBottom: '0.25rem' }}>
                        <strong>Supplier:</strong> {transaction.supplierName}
                      </div>
                    )}
                    {transaction.fromLocation && transaction.toLocation && (
                      <div style={{ marginBottom: '0.25rem' }}>
                        <strong>Transfer:</strong> {transaction.fromLocation} → {transaction.toLocation}
                      </div>
                    )}
                    {transaction.reference && (
                      <div style={{ marginBottom: '0.25rem' }}>
                        <strong>Ref:</strong> {transaction.reference}
                      </div>
                    )}
                    {transaction.reason && (
                      <div style={{ color: '#6b7280' }}>
                        {transaction.reason}
                      </div>
                    )}
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
                        View
                      </button>
                      {transaction.status === 'pending' && (
                        <button style={{
                          padding: '0.5rem',
                          background: '#ef4444',
                          color: 'white',
                          border: 'none',
                          borderRadius: '0.5rem',
                          cursor: 'pointer',
                          fontSize: '0.875rem'
                        }}>
                          Cancel
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Transaction Modal (placeholder) */}
      {showCreateForm && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1000
        }}>
          <div style={{
            background: 'white',
            borderRadius: '1rem',
            padding: '2rem',
            maxWidth: '600px',
            width: '90%'
          }}>
            <h3 style={{ margin: '0 0 1rem 0' }}>Create New Transaction</h3>
            <form onSubmit={(e) => {
              e.preventDefault();
              // TODO: Implement GraphQL mutation to create transaction
              console.log('Creating transaction:', newTransaction);
              setShowCreateForm(false);
              setNewTransaction({
                productName: '',
                type: 'adjustment',
                quantity: 0,
                reason: '',
                fromLocation: '',
                toLocation: ''
              });
            }}>
              <div style={{ display: 'grid', gap: '1rem', marginBottom: '1.5rem' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600', color: '#374151' }}>
                      Product *
                    </label>
                    <select
                      value={newTransaction.productName}
                      onChange={(e) => setNewTransaction({ ...newTransaction, productName: e.target.value })}
                      required
                      style={{
                        width: '100%',
                        padding: '0.75rem',
                        border: '2px solid #e5e7eb',
                        borderRadius: '0.5rem',
                        fontSize: '1rem'
                      }}
                    >
                      <option value="">Select a product</option>
                      <option value="Wireless Mouse">Wireless Mouse</option>
                      <option value="USB Cable Type-C">USB Cable Type-C</option>
                      <option value="Laptop Stand">Laptop Stand</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600', color: '#374151' }}>
                      Transaction Type *
                    </label>
                    <select
                      value={newTransaction.type}
                      onChange={(e) => setNewTransaction({ ...newTransaction, type: e.target.value })}
                      required
                      style={{
                        width: '100%',
                        padding: '0.75rem',
                        border: '2px solid #e5e7eb',
                        borderRadius: '0.5rem',
                        fontSize: '1rem'
                      }}
                    >
                      <option value="adjustment">Adjustment</option>
                      <option value="transfer_out">Transfer Out</option>
                      <option value="transfer_in">Transfer In</option>
                      <option value="return_to_supplier">Return to Supplier</option>
                      <option value="return_from_customer">Return from Customer</option>
                      <option value="waste">Waste</option>
                      <option value="damaged">Damaged</option>
                      <option value="reserve">Reserve</option>
                      <option value="unreserve">Unreserve</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600', color: '#374151' }}>
                    Quantity *
                  </label>
                  <input
                    type="number"
                    value={newTransaction.quantity}
                    onChange={(e) => setNewTransaction({ ...newTransaction, quantity: parseInt(e.target.value) || 0 })}
                    required
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: '2px solid #e5e7eb',
                      borderRadius: '0.5rem',
                      fontSize: '1rem'
                    }}
                    placeholder="Enter quantity"
                  />
                </div>

                {(newTransaction.type === 'transfer_out' || newTransaction.type === 'transfer_in') && (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <div>
                      <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600', color: '#374151' }}>
                        From Location
                      </label>
                      <input
                        type="text"
                        value={newTransaction.fromLocation}
                        onChange={(e) => setNewTransaction({ ...newTransaction, fromLocation: e.target.value })}
                        style={{
                          width: '100%',
                          padding: '0.75rem',
                          border: '2px solid #e5e7eb',
                          borderRadius: '0.5rem',
                          fontSize: '1rem'
                        }}
                        placeholder="Source location"
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600', color: '#374151' }}>
                        To Location
                      </label>
                      <input
                        type="text"
                        value={newTransaction.toLocation}
                        onChange={(e) => setNewTransaction({ ...newTransaction, toLocation: e.target.value })}
                        style={{
                          width: '100%',
                          padding: '0.75rem',
                          border: '2px solid #e5e7eb',
                          borderRadius: '0.5rem',
                          fontSize: '1rem'
                        }}
                        placeholder="Destination location"
                      />
                    </div>
                  </div>
                )}

                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600', color: '#374151' }}>
                    Reason/Notes
                  </label>
                  <textarea
                    value={newTransaction.reason}
                    onChange={(e) => setNewTransaction({ ...newTransaction, reason: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: '2px solid #e5e7eb',
                      borderRadius: '0.5rem',
                      fontSize: '1rem',
                      minHeight: '80px',
                      resize: 'vertical'
                    }}
                    placeholder="Enter reason for this transaction..."
                  />
                </div>
              </div>

              <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  onClick={() => setShowCreateForm(false)}
                  style={{
                    background: '#6b7280',
                    color: 'white',
                    border: 'none',
                    borderRadius: '0.5rem',
                    padding: '0.75rem 1.5rem',
                    cursor: 'pointer'
                  }}
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
                  Create Transaction
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
