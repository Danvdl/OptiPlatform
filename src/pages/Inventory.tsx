import { useEffect, useState } from 'react';
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
  Category
} from '../utils/inventoryApi';

type TabType = 'transactions' | 'products' | 'categories';

export default function Inventory() {
  const [activeTab, setActiveTab] = useState<TabType>('transactions');
  const [transactions, setTransactions] = useState<InventoryItem[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  
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
    } catch (error) {
      console.error('Failed to load inventory data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

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
    } catch (error) {
      console.error('Failed to add transaction:', error);
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
    } catch (error) {
      console.error('Failed to add product:', error);
    }
  };

  const handleAddCategory = async () => {
    if (!categoryForm.name) return;
    try {
      await createCategory(categoryForm);
      setCategoryForm({ name: '', description: '' });
      setShowAddCategory(false);
      await loadData();
    } catch (error) {
      console.error('Failed to add category:', error);
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
    } catch (error) {
      console.error('Failed to update transaction:', error);
    }
  };

  if (loading) {
    return (
      <div style={{ padding: '2rem' }}>
        <h1>Inventory Management</h1>
        <p>Loading inventory data...</p>
      </div>
    );
  }

  return (
    <div style={{ padding: '2rem' }}>
      <h1>Inventory Management</h1>
      
      {/* Tab Navigation */}
      <div style={{ borderBottom: '2px solid #e9ecef', marginBottom: '2rem' }}>
        <div style={{ display: 'flex', gap: '1rem' }}>
          {[
            { key: 'transactions' as TabType, label: '📦 Transactions', count: transactions.length },
            { key: 'products' as TabType, label: '🛍️ Products', count: products.length },
            { key: 'categories' as TabType, label: '📁 Categories', count: categories.length }
          ].map(tab => (
            <button
              key={tab.key}
              style={{
                ...tabStyle,
                backgroundColor: activeTab === tab.key ? '#007bff' : 'transparent',
                color: activeTab === tab.key ? 'white' : '#007bff',
                borderBottom: activeTab === tab.key ? '2px solid #007bff' : '2px solid transparent'
              }}
              onClick={() => setActiveTab(tab.key)}
            >
              {tab.label} ({tab.count})
            </button>
          ))}
        </div>
      </div>

      {/* Transactions Tab */}
      {activeTab === 'transactions' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h2>Inventory Transactions</h2>
            <button 
              style={buttonStyle}
              onClick={() => setShowAddTransaction(true)}
            >
              ➕ Log Transaction
            </button>
          </div>

          {showAddTransaction && (
            <div style={{ ...cardStyle, marginBottom: '2rem' }}>
              <h3>Log New Transaction</h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                <div>
                  <label>Product:</label>
                  <select
                    value={transactionForm.productId}
                    onChange={(e) => setTransactionForm(prev => ({ ...prev, productId: parseInt(e.target.value) }))}
                    style={inputStyle}
                  >
                    <option value={0}>Select Product</option>
                    {products.map(product => (
                      <option key={product.id} value={product.id}>
                        {product.name} {product.sku && `(${product.sku})`}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label>Transaction Type:</label>
                  <select
                    value={transactionForm.transactionType}
                    onChange={(e) => setTransactionForm(prev => ({ ...prev, transactionType: e.target.value }))}
                    style={inputStyle}
                  >
                    <option value="add">Add Stock</option>
                    <option value="remove">Remove Stock</option>
                    <option value="adjustment">Adjustment</option>
                  </select>
                </div>
                <div>
                  <label>Quantity:</label>
                  <input
                    type="number"
                    value={transactionForm.quantity}
                    onChange={(e) => setTransactionForm(prev => ({ ...prev, quantity: parseInt(e.target.value) || 0 }))}
                    style={inputStyle}
                  />
                </div>
              </div>
              <div style={{ marginTop: '1rem' }}>
                <label>Notes (optional):</label>
                <textarea
                  value={transactionForm.notes}
                  onChange={(e) => setTransactionForm(prev => ({ ...prev, notes: e.target.value }))}
                  style={{ ...inputStyle, minHeight: '80px', resize: 'vertical' }}
                  placeholder="Add any notes about this transaction..."
                />
              </div>
              <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                <button style={buttonStyle} onClick={handleAddTransaction}>
                  Save Transaction
                </button>
                <button 
                  style={{ ...buttonStyle, backgroundColor: '#6c757d' }}
                  onClick={() => setShowAddTransaction(false)}
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          <div style={cardStyle}>
            {transactions.length === 0 ? (
              <p>No transactions recorded yet.</p>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ borderBottom: '2px solid #e9ecef' }}>
                      <th style={tableHeaderStyle}>Product</th>
                      <th style={tableHeaderStyle}>Type</th>
                      <th style={tableHeaderStyle}>Quantity</th>
                      <th style={tableHeaderStyle}>Notes</th>
                      <th style={tableHeaderStyle}>Date</th>
                      <th style={tableHeaderStyle}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {transactions.map((tx) => (
                      <tr key={tx.id} style={{ borderBottom: '1px solid #f1f3f4' }}>
                        <td style={tableCellStyle}>
                          <div>
                            <strong>{tx.product.name}</strong>
                            {tx.product.sku && <div style={{ fontSize: '0.8rem', color: '#666' }}>SKU: {tx.product.sku}</div>}
                          </div>
                        </td>
                        <td style={tableCellStyle}>
                          <span style={{
                            padding: '2px 6px',
                            borderRadius: '3px',
                            fontSize: '0.8rem',
                            backgroundColor: tx.transactionType === 'add' ? '#e8f5e8' : 
                                             tx.transactionType === 'remove' ? '#ffebee' : '#fff3e0',
                            color: tx.transactionType === 'add' ? '#2e7d32' : 
                                   tx.transactionType === 'remove' ? '#c62828' : '#f57c00'
                          }}>
                            {tx.transactionType}
                          </span>
                        </td>
                        <td style={tableCellStyle}>
                          {editing[tx.id] ? (
                            <input
                              type="number"
                              value={editing[tx.id].quantity}
                              onChange={(e) =>
                                setEditing(prev => ({
                                  ...prev,
                                  [tx.id]: { ...prev[tx.id], quantity: parseInt(e.target.value) || 0 }
                                }))
                              }
                              style={{ ...inputStyle, width: '80px' }}
                            />
                          ) : (
                            `${tx.quantity} ${tx.product.unit || 'units'}`
                          )}
                        </td>
                        <td style={tableCellStyle}>
                          {editing[tx.id] ? (
                            <textarea
                              value={editing[tx.id].notes}
                              onChange={(e) =>
                                setEditing(prev => ({
                                  ...prev,
                                  [tx.id]: { ...prev[tx.id], notes: e.target.value }
                                }))
                              }
                              style={{ ...inputStyle, width: '150px', minHeight: '60px' }}
                            />
                          ) : (
                            tx.notes || '-'
                          )}
                        </td>
                        <td style={tableCellStyle}>
                          {new Date(tx.occurredAt).toLocaleDateString()}
                        </td>
                        <td style={tableCellStyle}>
                          {editing[tx.id] ? (
                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                              <button
                                style={{ ...buttonStyle, padding: '0.25rem 0.5rem', fontSize: '0.8rem' }}
                                onClick={() => handleUpdateTransaction(tx.id)}
                              >
                                Save
                              </button>
                              <button
                                style={{ 
                                  ...buttonStyle, 
                                  backgroundColor: '#6c757d',
                                  padding: '0.25rem 0.5rem', 
                                  fontSize: '0.8rem' 
                                }}
                                onClick={() => setEditing(prev => {
                                  const newEditing = { ...prev };
                                  delete newEditing[tx.id];
                                  return newEditing;
                                })}
                              >
                                Cancel
                              </button>
                            </div>
                          ) : (
                            <button
                              style={{ ...buttonStyle, padding: '0.25rem 0.5rem', fontSize: '0.8rem' }}
                              onClick={() => setEditing(prev => ({
                                ...prev,
                                [tx.id]: { quantity: tx.quantity, notes: tx.notes || '' }
                              }))}
                            >
                              Edit
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
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h2>Products</h2>
            <button 
              style={buttonStyle}
              onClick={() => setShowAddProduct(true)}
            >
              ➕ Add Product
            </button>
          </div>

          {showAddProduct && (
            <div style={{ ...cardStyle, marginBottom: '2rem' }}>
              <h3>Add New Product</h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem' }}>
                <div>
                  <label>Product Name*:</label>
                  <input
                    type="text"
                    value={productForm.name}
                    onChange={(e) => setProductForm(prev => ({ ...prev, name: e.target.value }))}
                    style={inputStyle}
                    placeholder="Enter product name"
                  />
                </div>
                <div>
                  <label>SKU:</label>
                  <input
                    type="text"
                    value={productForm.sku}
                    onChange={(e) => setProductForm(prev => ({ ...prev, sku: e.target.value }))}
                    style={inputStyle}
                    placeholder="Enter SKU"
                  />
                </div>
                <div>
                  <label>Unit:</label>
                  <input
                    type="text"
                    value={productForm.unit}
                    onChange={(e) => setProductForm(prev => ({ ...prev, unit: e.target.value }))}
                    style={inputStyle}
                    placeholder="e.g., pieces, kg, liters"
                  />
                </div>
                <div>
                  <label>Category:</label>
                  <select
                    value={productForm.categoryId}
                    onChange={(e) => setProductForm(prev => ({ ...prev, categoryId: parseInt(e.target.value) }))}
                    style={inputStyle}
                  >
                    <option value={0}>No Category</option>
                    {categories.map(category => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label>Restock Threshold:</label>
                  <input
                    type="number"
                    value={productForm.restockThreshold}
                    onChange={(e) => setProductForm(prev => ({ ...prev, restockThreshold: parseInt(e.target.value) || 5 }))}
                    style={inputStyle}
                    min="0"
                  />
                </div>
              </div>
              <div style={{ marginTop: '1rem' }}>
                <label>Description:</label>
                <textarea
                  value={productForm.description}
                  onChange={(e) => setProductForm(prev => ({ ...prev, description: e.target.value }))}
                  style={{ ...inputStyle, minHeight: '80px', resize: 'vertical' }}
                  placeholder="Product description..."
                />
              </div>
              <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                <button style={buttonStyle} onClick={handleAddProduct}>
                  Save Product
                </button>
                <button 
                  style={{ ...buttonStyle, backgroundColor: '#6c757d' }}
                  onClick={() => setShowAddProduct(false)}
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          <div style={cardStyle}>
            {products.length === 0 ? (
              <p>No products created yet.</p>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1rem' }}>
                {products.map(product => (
                  <div key={product.id} style={{ 
                    border: '1px solid #e9ecef', 
                    borderRadius: '6px', 
                    padding: '1rem',
                    backgroundColor: '#f8f9fa'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '0.5rem' }}>
                      <h4 style={{ margin: 0 }}>{product.name}</h4>
                      {product.category && (
                        <span style={{
                          backgroundColor: '#e3f2fd',
                          color: '#1976d2',
                          padding: '2px 6px',
                          borderRadius: '3px',
                          fontSize: '0.8rem'
                        }}>
                          {product.category.name}
                        </span>
                      )}
                    </div>
                    {product.sku && <p style={{ margin: '0.25rem 0', fontSize: '0.9rem', color: '#666' }}>SKU: {product.sku}</p>}
                    {product.description && <p style={{ margin: '0.5rem 0', fontSize: '0.9rem' }}>{product.description}</p>}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1rem' }}>
                      <span style={{ fontSize: '0.9rem', color: '#666' }}>
                        Restock at {product.restockThreshold} {product.unit || 'units'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Categories Tab */}
      {activeTab === 'categories' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h2>Categories</h2>
            <button 
              style={buttonStyle}
              onClick={() => setShowAddCategory(true)}
            >
              ➕ Add Category
            </button>
          </div>

          {showAddCategory && (
            <div style={{ ...cardStyle, marginBottom: '2rem' }}>
              <h3>Add New Category</h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label>Category Name*:</label>
                  <input
                    type="text"
                    value={categoryForm.name}
                    onChange={(e) => setCategoryForm(prev => ({ ...prev, name: e.target.value }))}
                    style={inputStyle}
                    placeholder="Enter category name"
                  />
                </div>
                <div>
                  <label>Description:</label>
                  <input
                    type="text"
                    value={categoryForm.description}
                    onChange={(e) => setCategoryForm(prev => ({ ...prev, description: e.target.value }))}
                    style={inputStyle}
                    placeholder="Category description"
                  />
                </div>
              </div>
              <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                <button style={buttonStyle} onClick={handleAddCategory}>
                  Save Category
                </button>
                <button 
                  style={{ ...buttonStyle, backgroundColor: '#6c757d' }}
                  onClick={() => setShowAddCategory(false)}
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          <div style={cardStyle}>
            {categories.length === 0 ? (
              <p>No categories created yet.</p>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '1rem' }}>
                {categories.map(category => (
                  <div key={category.id} style={{ 
                    border: '1px solid #e9ecef', 
                    borderRadius: '6px', 
                    padding: '1rem',
                    backgroundColor: '#f8f9fa'
                  }}>
                    <h4 style={{ margin: '0 0 0.5rem 0' }}>{category.name}</h4>
                    {category.description && (
                      <p style={{ margin: '0.5rem 0', fontSize: '0.9rem', color: '#666' }}>
                        {category.description}
                      </p>
                    )}
                    <div style={{ marginTop: '1rem', fontSize: '0.9rem', color: '#666' }}>
                      {category.products?.length || 0} products
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

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

const buttonStyle: React.CSSProperties = {
  backgroundColor: '#007bff',
  color: 'white',
  border: 'none',
  padding: '0.75rem 1.5rem',
  borderRadius: '6px',
  cursor: 'pointer',
  fontSize: '0.9rem',
  fontWeight: '500'
};

const tabStyle: React.CSSProperties = {
  backgroundColor: 'transparent',
  border: 'none',
  padding: '1rem 1.5rem',
  cursor: 'pointer',
  fontSize: '1rem',
  fontWeight: '500',
  borderRadius: '6px 6px 0 0'
};

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '0.5rem',
  border: '1px solid #ced4da',
  borderRadius: '4px',
  fontSize: '0.9rem'
};

const tableHeaderStyle: React.CSSProperties = {
  textAlign: 'left',
  padding: '0.75rem',
  fontWeight: 'bold',
  color: '#495057'
};

const tableCellStyle: React.CSSProperties = {
  padding: '0.75rem',
  color: '#6c757d',
  verticalAlign: 'top'
};
