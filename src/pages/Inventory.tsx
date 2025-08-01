import { useEffect, useState } from 'react';
import { useLocation, useSearchParams } from 'react-router-dom';
import QuickActions from '../components/QuickActions';
import './Inventory.css';
import {
  fetchItems,
  fetchProducts,
  fetchCategories,
  addItem,
  updateItem,
  createProduct,
  createCategory,
  InventoryItem,
  Product,
  Category,
  ApiError
} from '../utils/inventoryApi';
import { useError } from '../components/ErrorProvider';
import { getErrorMessage, ErrorCode } from '../utils/errorCodes';

type TabType = 'overview' | 'transactions' | 'products' | 'categories';

export default function Inventory() {
  const [searchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [transactions, setTransactions] = useState<InventoryItem[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Form states
  const [showAddTransaction, setShowAddTransaction] = useState(false);
  const [showAddProduct, setShowAddProduct] = useState(false);
  const [showAddCategory, setShowAddCategory] = useState(false);
  
  // Transaction form
  const [transactionForm, setTransactionForm] = useState({
    productId: 0,
    quantity: 0,
    transactionType: 'add',
    notes: ''
  });
  
  // Product form
  const [productForm, setProductForm] = useState({
    name: '',
    description: '',
    sku: '',
    unit: '',
    categoryId: 0,
    restockThreshold: 5
  });
  
  // Category form
  const [categoryForm, setCategoryForm] = useState({
    name: '',
    description: ''
  });

  const [editing, setEditing] = useState<{ [id: number]: { quantity: number; notes: string } }>({});
  const { showError } = useError();

  const loadData = async () => {
    try {
      setLoading(true);
      const [txData, productData, categoryData] = await Promise.all([
        fetchItems(),
        fetchProducts(),
        fetchCategories()
      ]);
      
      setTransactions(txData);
      setProducts(productData);
      setCategories(categoryData);
    } catch (error: any) {
      console.error('Failed to load inventory data:', error);
      const code = error instanceof ApiError ? error.code : ErrorCode.UNKNOWN;
      showError(getErrorMessage(code));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    
    // Handle URL parameters for direct actions
    const tab = searchParams.get('tab') as TabType;
    const action = searchParams.get('action');
    
    if (tab && ['overview', 'transactions', 'products', 'categories'].includes(tab)) {
      setActiveTab(tab);
    }
    
    if (action === 'add') {
      if (tab === 'transactions') {
        setShowAddTransaction(true);
      } else if (tab === 'products') {
        setShowAddProduct(true);
      } else if (tab === 'categories') {
        setShowAddCategory(true);
      }
    }
  }, [searchParams]);

  const handleAddTransaction = async () => {
    if (!transactionForm.productId) return;
    try {
      await addItem(
        transactionForm.productId,
        transactionForm.quantity,
        transactionForm.transactionType,
        transactionForm.notes || undefined
      );
      setTransactionForm({ productId: 0, quantity: 0, transactionType: 'add', notes: '' });
      setShowAddTransaction(false);
      await loadData();
    } catch (error: any) {
      console.error('Failed to add transaction:', error);
      const code = error instanceof ApiError ? error.code : ErrorCode.UNKNOWN;
      showError(getErrorMessage(code));
    }
  };

  const handleAddProduct = async () => {
    if (!productForm.name) return;
    try {
      await createProduct({
        ...productForm,
        categoryId: productForm.categoryId || undefined
      });
      setProductForm({ name: '', description: '', sku: '', unit: '', categoryId: 0, restockThreshold: 5 });
      setShowAddProduct(false);
      await loadData();
    } catch (error: any) {
      console.error('Failed to add product:', error);
      const code = error instanceof ApiError ? error.code : ErrorCode.UNKNOWN;
      showError(getErrorMessage(code));
    }
  };

  const handleAddCategory = async () => {
    if (!categoryForm.name) return;
    try {
      await createCategory(categoryForm);
      setCategoryForm({ name: '', description: '' });
      setShowAddCategory(false);
      await loadData();
    } catch (error: any) {
      console.error('Failed to add category:', error);
      const code = error instanceof ApiError ? error.code : ErrorCode.UNKNOWN;
      showError(getErrorMessage(code));
    }
  };

  const handleUpdateTransaction = async (id: number) => {
    const update = editing[id];
    if (!update) return;
    try {
      await updateItem(id, update.quantity, update.notes || undefined);
      setEditing(prev => {
        const newEditing = { ...prev };
        delete newEditing[id];
        return newEditing;
      });
      await loadData();
    } catch (error: any) {
      console.error('Failed to update transaction:', error);
      const code = error instanceof ApiError ? error.code : ErrorCode.UNKNOWN;
      showError(getErrorMessage(code));
    }
  };

  // Calculate inventory metrics
  const totalProducts = products.length;
  const totalTransactions = transactions.length;
  const lowStockProducts = products.filter(p => {
    const currentStock = transactions
      .filter(t => t.product.id === p.id)
      .reduce((sum, t) => sum + (t.transactionType === 'add' ? t.quantity : -t.quantity), 0);
    return currentStock <= p.restockThreshold;
  });
  const totalValue = products.reduce((sum, product) => {
    const stock = transactions
      .filter(t => t.product.id === product.id)
      .reduce((sum, t) => sum + (t.transactionType === 'add' ? t.quantity : -t.quantity), 0);
    return sum + (stock * 10); // Assuming $10 average value per unit
  }, 0);

  // Filter functions
  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.sku?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredTransactions = transactions.filter(transaction => 
    transaction.product.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <div style={{
          background: 'white',
          padding: '2rem',
          borderRadius: '1rem',
          boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
          textAlign: 'center'
        }}>
          <div className="loading-shimmer" style={{
            width: '60px',
            height: '60px',
            borderRadius: '50%',
            margin: '0 auto 1rem'
          }}></div>
          <h2 style={{ margin: '0 0 0.5rem', color: '#1e293b' }}>Loading Inventory</h2>
          <p style={{ margin: 0, color: '#64748b' }}>Fetching your inventory data...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
      padding: '2rem'
    }}>
      <div className="fade-in">
        {/* Header */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '2rem',
          flexWrap: 'wrap',
          gap: '1rem'
        }}>
          <div>
            <h1 style={{
              fontSize: '2.5rem',
              fontWeight: '700',
              background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              margin: '0 0 0.5rem'
            }}>
              📦 Inventory Management
            </h1>
            <p style={{ color: '#64748b', margin: 0 }}>
              Manage your products, track transactions, and monitor stock levels
            </p>
          </div>
          
          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
            <input
              type="text"
              placeholder="🔍 Search inventory..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="form-input"
              style={{
                width: '250px',
                background: 'white',
                border: '1px solid #e2e8f0',
                borderRadius: '0.75rem',
                padding: '0.75rem 1rem'
              }}
            />
            <button
              className="btn btn-primary hover-lift"
              onClick={() => setShowAddProduct(true)}
            >
              ➕ Quick Add Product
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div style={{
          background: 'white',
          borderRadius: '1rem',
          padding: '1rem',
          marginBottom: '2rem',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
          border: '1px solid #f1f5f9'
        }}>
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            {[
              { key: 'overview' as TabType, label: '📊 Overview', icon: '📊' },
              { key: 'transactions' as TabType, label: '📝 Transactions', icon: '📝', count: transactions.length },
              { key: 'products' as TabType, label: '🛍️ Products', icon: '🛍️', count: products.length },
              { key: 'categories' as TabType, label: '📁 Categories', icon: '📁', count: categories.length }
            ].map(tab => (
              <button
                key={tab.key}
                className={`hover-lift ${activeTab === tab.key ? 'btn-primary' : 'btn-secondary'}`}
                style={{
                  padding: '0.75rem 1.5rem',
                  border: 'none',
                  borderRadius: '0.75rem',
                  fontWeight: '500',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}
                onClick={() => setActiveTab(tab.key)}
              >
                {tab.icon} {tab.label} {tab.count ? `(${tab.count})` : ''}
              </button>
            ))}
          </div>
        </div>

        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="slide-in">
            {/* Metrics Cards */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
              gap: '1.5rem',
              marginBottom: '2rem'
            }}>
              <div className="card hover-lift" style={{
                background: 'linear-gradient(135deg, #3b82f6, #1d4ed8)',
                color: 'white',
                padding: '1.5rem',
                borderRadius: '1rem'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div>
                    <p style={{ margin: '0 0 0.5rem', opacity: 0.9 }}>Total Products</p>
                    <h3 style={{ margin: 0, fontSize: '2.5rem', fontWeight: '700' }}>
                      {totalProducts}
                    </h3>
                  </div>
                  <div style={{ fontSize: '3rem', opacity: 0.8 }}>🛍️</div>
                </div>
              </div>

              <div className="card hover-lift" style={{
                background: 'linear-gradient(135deg, #10b981, #059669)',
                color: 'white',
                padding: '1.5rem',
                borderRadius: '1rem'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div>
                    <p style={{ margin: '0 0 0.5rem', opacity: 0.9 }}>Total Transactions</p>
                    <h3 style={{ margin: 0, fontSize: '2.5rem', fontWeight: '700' }}>
                      {totalTransactions}
                    </h3>
                  </div>
                  <div style={{ fontSize: '3rem', opacity: 0.8 }}>📝</div>
                </div>
              </div>

              <div className="card hover-lift" style={{
                background: 'linear-gradient(135deg, #f59e0b, #d97706)',
                color: 'white',
                padding: '1.5rem',
                borderRadius: '1rem'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div>
                    <p style={{ margin: '0 0 0.5rem', opacity: 0.9 }}>Low Stock Items</p>
                    <h3 style={{ margin: 0, fontSize: '2.5rem', fontWeight: '700' }}>
                      {lowStockProducts.length}
                    </h3>
                  </div>
                  <div style={{ fontSize: '3rem', opacity: 0.8 }}>⚠️</div>
                </div>
              </div>

              <div className="card hover-lift" style={{
                background: 'linear-gradient(135deg, #8b5cf6, #7c3aed)',
                color: 'white',
                padding: '1.5rem',
                borderRadius: '1rem'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div>
                    <p style={{ margin: '0 0 0.5rem', opacity: 0.9 }}>Estimated Value</p>
                    <h3 style={{ margin: 0, fontSize: '2.5rem', fontWeight: '700' }}>
                      ${totalValue.toLocaleString()}
                    </h3>
                  </div>
                  <div style={{ fontSize: '3rem', opacity: 0.8 }}>💰</div>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <QuickActions
              showAddTransaction={showAddTransaction}
              showAddProduct={showAddProduct}
              showAddCategory={showAddCategory}
              setShowAddTransaction={setShowAddTransaction}
              setShowAddProduct={setShowAddProduct}
              setShowAddCategory={setShowAddCategory}
              onAddTransaction={handleAddTransaction}
              onAddProduct={handleAddProduct}
              onAddCategory={handleAddCategory}
              products={products}
              categories={categories}
              transactionForm={transactionForm}
              setTransactionForm={setTransactionForm}
              productForm={productForm}
              setProductForm={setProductForm}
              categoryForm={categoryForm}
              setCategoryForm={setCategoryForm}
            />

            {/* Recent Activity & Low Stock Alerts */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))',
              gap: '1.5rem'
            }}>
              {/* Recent Transactions */}
              <div className="card" style={{ padding: '1.5rem' }}>
                <h3 style={{ margin: '0 0 1rem', color: '#1e293b' }}>📈 Recent Activity</h3>
                <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
                  {transactions.slice(0, 5).map((transaction, index) => (
                    <div key={transaction.id} style={{
                      display: 'flex',
                      alignItems: 'center',
                      padding: '0.75rem',
                      background: index % 2 === 0 ? '#f8fafc' : 'white',
                      borderRadius: '0.5rem',
                      marginBottom: '0.5rem'
                    }}>
                      <div style={{
                        width: '40px',
                        height: '40px',
                        borderRadius: '50%',
                        background: transaction.transactionType === 'add' 
                          ? 'linear-gradient(135deg, #10b981, #059669)' 
                          : 'linear-gradient(135deg, #ef4444, #dc2626)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'white',
                        fontSize: '1.2rem',
                        marginRight: '0.75rem'
                      }}>
                        {transaction.transactionType === 'add' ? '➕' : '➖'}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: '500' }}>{transaction.product.name}</div>
                        <div style={{ color: '#64748b', fontSize: '0.875rem' }}>
                          {transaction.transactionType === 'add' ? 'Added' : 'Removed'} {transaction.quantity} units
                        </div>
                      </div>
                    </div>
                  ))}
                  {transactions.length === 0 && (
                    <div style={{
                      textAlign: 'center',
                      padding: '2rem',
                      color: '#64748b'
                    }}>
                      <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📈</div>
                      <p>No transactions yet. Start by logging your first inventory transaction!</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Low Stock Alerts */}
              <div className="card" style={{ padding: '1.5rem' }}>
                <h3 style={{ margin: '0 0 1rem', color: '#1e293b' }}>⚠️ Low Stock Alerts</h3>
                <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
                  {lowStockProducts.length === 0 ? (
                    <div style={{
                      textAlign: 'center',
                      padding: '2rem',
                      color: '#64748b'
                    }}>
                      <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>✅</div>
                      <p>All products are well stocked!</p>
                    </div>
                  ) : (
                    lowStockProducts.map((product) => {
                      const currentStock = transactions
                        .filter(t => t.product.id === product.id)
                        .reduce((sum, t) => sum + (t.transactionType === 'add' ? t.quantity : -t.quantity), 0);
                      
                      return (
                        <div key={product.id} className="alert alert-warning" style={{
                          display: 'flex',
                          alignItems: 'center',
                          marginBottom: '0.5rem'
                        }}>
                          <div style={{
                            fontSize: '1.5rem',
                            marginRight: '0.75rem'
                          }}>⚠️</div>
                          <div style={{ flex: 1 }}>
                            <div style={{ fontWeight: '500' }}>{product.name}</div>
                            <div style={{ fontSize: '0.875rem' }}>
                              Stock: {currentStock} (Threshold: {product.restockThreshold})
                            </div>
                          </div>
                          <button className="btn btn-primary" style={{ fontSize: '0.75rem' }}>
                            Restock
                          </button>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Transactions Tab */}
        {activeTab === 'transactions' && (
          <div className="slide-in">
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '1.5rem',
              flexWrap: 'wrap',
              gap: '1rem'
            }}>
              <h2 style={{ margin: 0, color: '#1e293b' }}>📝 Inventory Transactions</h2>
              <button 
                className="btn btn-primary hover-lift"
                onClick={() => setShowAddTransaction(true)}
              >
                ➕ Log Transaction
              </button>
            </div>

            {showAddTransaction && (
              <div className="card fade-in" style={{
                padding: '1.5rem',
                marginBottom: '2rem',
                border: '2px solid #3b82f6'
              }}>
                <h3 style={{ margin: '0 0 1rem', color: '#1e293b' }}>📝 Log New Transaction</h3>
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                  gap: '1rem',
                  marginBottom: '1rem'
                }}>
                  <div className="form-group">
                    <label className="form-label">Product:</label>
                    <select
                      value={transactionForm.productId}
                      onChange={(e) => setTransactionForm(prev => ({ ...prev, productId: parseInt(e.target.value) }))}
                      className="form-input"
                    >
                      <option value={0}>Select Product</option>
                      {products.map(product => (
                        <option key={product.id} value={product.id}>{product.name}</option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Transaction Type:</label>
                    <select
                      value={transactionForm.transactionType}
                      onChange={(e) => setTransactionForm(prev => ({ ...prev, transactionType: e.target.value }))}
                      className="form-input"
                    >
                      <option value="add">➕ Add to Stock</option>
                      <option value="remove">➖ Remove from Stock</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Quantity:</label>
                    <input
                      type="number"
                      value={transactionForm.quantity}
                      onChange={(e) => setTransactionForm(prev => ({ ...prev, quantity: parseInt(e.target.value) }))}
                      className="form-input"
                      min="1"
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Notes (Optional):</label>
                    <input
                      type="text"
                      value={transactionForm.notes}
                      onChange={(e) => setTransactionForm(prev => ({ ...prev, notes: e.target.value }))}
                      className="form-input"
                      placeholder="Add notes..."
                    />
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button 
                    className="btn btn-primary hover-lift"
                    onClick={handleAddTransaction}
                    disabled={!transactionForm.productId || !transactionForm.quantity}
                  >
                    💾 Save Transaction
                  </button>
                  <button 
                    className="btn btn-secondary hover-lift"
                    onClick={() => setShowAddTransaction(false)}
                  >
                    ❌ Cancel
                  </button>
                </div>
              </div>
            )}

            {/* Transactions List */}
            <div className="card" style={{ padding: '1.5rem' }}>
              {filteredTransactions.length === 0 ? (
                <div style={{
                  textAlign: 'center',
                  padding: '3rem',
                  color: '#64748b'
                }}>
                  <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>📋</div>
                  <h3>No transactions found</h3>
                  <p>Start by logging your first inventory transaction</p>
                  <button 
                    className="btn btn-primary hover-lift"
                    onClick={() => setShowAddTransaction(true)}
                    style={{ marginTop: '1rem' }}
                  >
                    ➕ Log First Transaction
                  </button>
                </div>
              ) : (
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ borderBottom: '2px solid #e2e8f0' }}>
                        <th style={{ textAlign: 'left', padding: '1rem', fontWeight: '600' }}>Product</th>
                        <th style={{ textAlign: 'left', padding: '1rem', fontWeight: '600' }}>Type</th>
                        <th style={{ textAlign: 'left', padding: '1rem', fontWeight: '600' }}>Quantity</th>
                        <th style={{ textAlign: 'left', padding: '1rem', fontWeight: '600' }}>Notes</th>
                        <th style={{ textAlign: 'left', padding: '1rem', fontWeight: '600' }}>Date</th>
                        <th style={{ textAlign: 'left', padding: '1rem', fontWeight: '600' }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredTransactions.map(transaction => (
                        <tr key={transaction.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                          <td style={{ padding: '1rem' }}>
                            <div style={{ fontWeight: '500' }}>{transaction.product.name}</div>
                            <div style={{ color: '#64748b', fontSize: '0.875rem' }}>
                              {transaction.product.sku && `SKU: ${transaction.product.sku}`}
                            </div>
                          </td>
                          <td style={{ padding: '1rem' }}>
                            <span style={{
                              padding: '0.25rem 0.75rem',
                              borderRadius: '1rem',
                              fontSize: '0.75rem',
                              fontWeight: '500',
                              background: transaction.transactionType === 'add' 
                                ? 'linear-gradient(135deg, #10b981, #059669)' 
                                : 'linear-gradient(135deg, #ef4444, #dc2626)',
                              color: 'white'
                            }}>
                              {transaction.transactionType === 'add' ? '➕ Add' : '➖ Remove'}
                            </span>
                          </td>
                          <td style={{ padding: '1rem', fontWeight: '500' }}>{transaction.quantity}</td>
                          <td style={{ padding: '1rem', color: '#64748b' }}>
                            {editing[transaction.id] ? (
                              <input
                                type="text"
                                value={editing[transaction.id].notes}
                                onChange={(e) => setEditing(prev => ({
                                  ...prev,
                                  [transaction.id]: { ...prev[transaction.id], notes: e.target.value }
                                }))}
                                className="form-input"
                                style={{ fontSize: '0.875rem' }}
                              />
                            ) : (
                              transaction.notes || '-'
                            )}
                          </td>
                          <td style={{ padding: '1rem', color: '#64748b' }}>
                            {new Date(transaction.occurredAt).toLocaleDateString()}
                          </td>
                          <td style={{ padding: '1rem' }}>
                            {editing[transaction.id] ? (
                              <div style={{ display: 'flex', gap: '0.25rem' }}>
                                <button 
                                  className="btn btn-primary"
                                  style={{ fontSize: '0.75rem', padding: '0.25rem 0.5rem' }}
                                  onClick={() => handleUpdateTransaction(transaction.id)}
                                >
                                  💾
                                </button>
                                <button 
                                  className="btn btn-secondary"
                                  style={{ fontSize: '0.75rem', padding: '0.25rem 0.5rem' }}
                                  onClick={() => setEditing(prev => {
                                    const newEditing = { ...prev };
                                    delete newEditing[transaction.id];
                                    return newEditing;
                                  })}
                                >
                                  ❌
                                </button>
                              </div>
                            ) : (
                              <button 
                                className="btn btn-secondary hover-lift"
                                style={{ fontSize: '0.75rem', padding: '0.25rem 0.5rem' }}
                                onClick={() => setEditing(prev => ({
                                  ...prev,
                                  [transaction.id]: { quantity: transaction.quantity, notes: transaction.notes || '' }
                                }))}
                              >
                                ✏️ Edit
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Products Tab */}
        {activeTab === 'products' && (
          <div className="slide-in">
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '1.5rem',
              flexWrap: 'wrap',
              gap: '1rem'
            }}>
              <h2 style={{ margin: 0, color: '#1e293b' }}>🛍️ Product Catalog</h2>
              <button 
                className="btn btn-primary hover-lift"
                onClick={() => setShowAddProduct(true)}
              >
                ➕ Add Product
              </button>
            </div>

            {showAddProduct && (
              <div className="card fade-in" style={{
                padding: '1.5rem',
                marginBottom: '2rem',
                border: '2px solid #3b82f6'
              }}>
                <h3 style={{ margin: '0 0 1rem', color: '#1e293b' }}>🛍️ Add New Product</h3>
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                  gap: '1rem',
                  marginBottom: '1rem'
                }}>
                  <div className="form-group">
                    <label className="form-label">Product Name:</label>
                    <input
                      type="text"
                      value={productForm.name}
                      onChange={(e) => setProductForm(prev => ({ ...prev, name: e.target.value }))}
                      className="form-input"
                      placeholder="Enter product name"
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">SKU (Optional):</label>
                    <input
                      type="text"
                      value={productForm.sku}
                      onChange={(e) => setProductForm(prev => ({ ...prev, sku: e.target.value }))}
                      className="form-input"
                      placeholder="Product SKU"
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Unit:</label>
                    <input
                      type="text"
                      value={productForm.unit}
                      onChange={(e) => setProductForm(prev => ({ ...prev, unit: e.target.value }))}
                      className="form-input"
                      placeholder="e.g., pieces, kg, liters"
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Category:</label>
                    <select
                      value={productForm.categoryId}
                      onChange={(e) => setProductForm(prev => ({ ...prev, categoryId: parseInt(e.target.value) }))}
                      className="form-input"
                    >
                      <option value={0}>No Category</option>
                      {categories.map(category => (
                        <option key={category.id} value={category.id}>{category.name}</option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Restock Threshold:</label>
                    <input
                      type="number"
                      value={productForm.restockThreshold}
                      onChange={(e) => setProductForm(prev => ({ ...prev, restockThreshold: parseInt(e.target.value) }))}
                      className="form-input"
                      min="0"
                    />
                  </div>

                  <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                    <label className="form-label">Description (Optional):</label>
                    <textarea
                      value={productForm.description}
                      onChange={(e) => setProductForm(prev => ({ ...prev, description: e.target.value }))}
                      className="form-input"
                      placeholder="Product description"
                      rows={3}
                    />
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button 
                    className="btn btn-primary hover-lift"
                    onClick={handleAddProduct}
                    disabled={!productForm.name}
                  >
                    💾 Save Product
                  </button>
                  <button 
                    className="btn btn-secondary hover-lift"
                    onClick={() => setShowAddProduct(false)}
                  >
                    ❌ Cancel
                  </button>
                </div>
              </div>
            )}

            {/* Products Grid */}
            {filteredProducts.length === 0 ? (
              <div style={{
                textAlign: 'center',
                padding: '3rem',
                color: '#64748b'
              }}>
                <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>🛍️</div>
                <h3>No products found</h3>
                <p>Add your first product to get started</p>
                <button 
                  className="btn btn-primary hover-lift"
                  onClick={() => setShowAddProduct(true)}
                  style={{ marginTop: '1rem' }}
                >
                  ➕ Add First Product
                </button>
              </div>
            ) : (
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
                gap: '1.5rem'
              }}>
                {filteredProducts.map(product => {
                  const currentStock = transactions
                    .filter(t => t.product.id === product.id)
                    .reduce((sum, t) => sum + (t.transactionType === 'add' ? t.quantity : -t.quantity), 0);
                  
                  const isLowStock = currentStock <= product.restockThreshold;
                  
                  return (
                    <div key={product.id} className="card hover-lift" style={{
                      padding: '1.5rem',
                      border: isLowStock ? '2px solid #f59e0b' : '1px solid #f1f5f9'
                    }}>
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        marginBottom: '1rem'
                      }}>
                        <h4 style={{ margin: 0, color: '#1e293b' }}>{product.name}</h4>
                        {isLowStock && (
                          <span style={{
                            background: 'linear-gradient(135deg, #f59e0b, #d97706)',
                            color: 'white',
                            padding: '0.25rem 0.5rem',
                            borderRadius: '0.5rem',
                            fontSize: '0.75rem',
                            fontWeight: '500'
                          }}>
                            ⚠️ Low Stock
                          </span>
                        )}
                      </div>
                      
                      {product.description && (
                        <p style={{ color: '#64748b', fontSize: '0.875rem', margin: '0 0 1rem' }}>
                          {product.description}
                        </p>
                      )}
                      
                      <div style={{ marginBottom: '1rem' }}>
                        <div style={{
                          display: 'grid',
                          gridTemplateColumns: '1fr 1fr',
                          gap: '0.5rem',
                          fontSize: '0.875rem'
                        }}>
                          {product.sku && (
                            <div>
                              <span style={{ color: '#64748b' }}>SKU:</span>
                              <span style={{ marginLeft: '0.25rem', fontWeight: '500' }}>{product.sku}</span>
                            </div>
                          )}
                          {product.unit && (
                            <div>
                              <span style={{ color: '#64748b' }}>Unit:</span>
                              <span style={{ marginLeft: '0.25rem', fontWeight: '500' }}>{product.unit}</span>
                            </div>
                          )}
                          <div>
                            <span style={{ color: '#64748b' }}>Stock:</span>
                            <span style={{ 
                              marginLeft: '0.25rem', 
                              fontWeight: '500',
                              color: isLowStock ? '#f59e0b' : '#10b981'
                            }}>
                              {currentStock}
                            </span>
                          </div>
                          <div>
                            <span style={{ color: '#64748b' }}>Threshold:</span>
                            <span style={{ marginLeft: '0.25rem', fontWeight: '500' }}>{product.restockThreshold}</span>
                          </div>
                        </div>
                      </div>
                      
                      {product.category && (
                        <div style={{
                          background: '#f1f5f9',
                          color: '#475569',
                          padding: '0.25rem 0.5rem',
                          borderRadius: '0.5rem',
                          fontSize: '0.75rem',
                          marginBottom: '1rem',
                          display: 'inline-block'
                        }}>
                          📁 {product.category.name}
                        </div>
                      )}
                      
                      <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
                        <button 
                          className="btn btn-primary hover-lift"
                          style={{ flex: 1, fontSize: '0.875rem' }}
                          onClick={() => {
                            setTransactionForm(prev => ({ ...prev, productId: product.id }));
                            setShowAddTransaction(true);
                            setActiveTab('transactions');
                          }}
                        >
                          📝 Log Transaction
                        </button>
                        <button 
                          className="btn btn-secondary hover-lift"
                          style={{ fontSize: '0.875rem' }}
                        >
                          ✏️
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Categories Tab */}
        {activeTab === 'categories' && (
          <div className="slide-in">
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '1.5rem',
              flexWrap: 'wrap',
              gap: '1rem'
            }}>
              <h2 style={{ margin: 0, color: '#1e293b' }}>📁 Product Categories</h2>
              <button 
                className="btn btn-primary hover-lift"
                onClick={() => setShowAddCategory(true)}
              >
                ➕ Add Category
              </button>
            </div>

            {showAddCategory && (
              <div className="card fade-in" style={{
                padding: '1.5rem',
                marginBottom: '2rem',
                border: '2px solid #3b82f6'
              }}>
                <h3 style={{ margin: '0 0 1rem', color: '#1e293b' }}>📁 Add New Category</h3>
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                  gap: '1rem',
                  marginBottom: '1rem'
                }}>
                  <div className="form-group">
                    <label className="form-label">Category Name:</label>
                    <input
                      type="text"
                      value={categoryForm.name}
                      onChange={(e) => setCategoryForm(prev => ({ ...prev, name: e.target.value }))}
                      className="form-input"
                      placeholder="Enter category name"
                    />
                  </div>

                  <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                    <label className="form-label">Description (Optional):</label>
                    <textarea
                      value={categoryForm.description}
                      onChange={(e) => setCategoryForm(prev => ({ ...prev, description: e.target.value }))}
                      className="form-input"
                      placeholder="Category description"
                      rows={3}
                    />
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button 
                    className="btn btn-primary hover-lift"
                    onClick={handleAddCategory}
                    disabled={!categoryForm.name}
                  >
                    💾 Save Category
                  </button>
                  <button 
                    className="btn btn-secondary hover-lift"
                    onClick={() => setShowAddCategory(false)}
                  >
                    ❌ Cancel
                  </button>
                </div>
              </div>
            )}

            {/* Categories Grid */}
            {categories.length === 0 ? (
              <div style={{
                textAlign: 'center',
                padding: '3rem',
                color: '#64748b'
              }}>
                <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>📁</div>
                <h3>No categories found</h3>
                <p>Create categories to organize your products</p>
                <button 
                  className="btn btn-primary hover-lift"
                  onClick={() => setShowAddCategory(true)}
                  style={{ marginTop: '1rem' }}
                >
                  ➕ Add First Category
                </button>
              </div>
            ) : (
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
                gap: '1.5rem'
              }}>
                {categories.map(category => {
                  const categoryProducts = products.filter(p => p.categoryId === category.id);
                  
                  return (
                    <div key={category.id} className="card hover-lift" style={{
                      padding: '1.5rem'
                    }}>
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        marginBottom: '1rem'
                      }}>
                        <h4 style={{ margin: 0, color: '#1e293b', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          📁 {category.name}
                        </h4>
                        <span style={{
                          background: '#f1f5f9',
                          color: '#475569',
                          padding: '0.25rem 0.5rem',
                          borderRadius: '0.5rem',
                          fontSize: '0.75rem',
                          fontWeight: '500'
                        }}>
                          {categoryProducts.length} products
                        </span>
                      </div>
                      
                      {category.description && (
                        <p style={{ color: '#64748b', fontSize: '0.875rem', margin: '0 0 1rem' }}>
                          {category.description}
                        </p>
                      )}
                      
                      <div style={{ marginBottom: '1rem' }}>
                        <div style={{ fontSize: '0.875rem', color: '#64748b' }}>
                          Created: {new Date(category.createdAt).toLocaleDateString()}
                        </div>
                      </div>
                      
                      {categoryProducts.length > 0 && (
                        <div style={{ marginBottom: '1rem' }}>
                          <div style={{ fontSize: '0.875rem', fontWeight: '500', marginBottom: '0.5rem' }}>
                            Products in this category:
                          </div>
                          <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                            {categoryProducts.slice(0, 3).map(p => p.name).join(', ')}
                            {categoryProducts.length > 3 && ` and ${categoryProducts.length - 3} more...`}
                          </div>
                        </div>
                      )}
                      
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button 
                          className="btn btn-secondary hover-lift"
                          style={{ flex: 1, fontSize: '0.875rem' }}
                          onClick={() => {
                            setActiveTab('products');
                            setSearchTerm(category.name);
                          }}
                        >
                          👁️ View Products
                        </button>
                        <button 
                          className="btn btn-secondary hover-lift"
                          style={{ fontSize: '0.875rem' }}
                        >
                          ✏️
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
