import Modal from '../components/Modal';

interface QuickActionsProps {
  showAddTransaction: boolean;
  showAddProduct: boolean;
  showAddCategory: boolean;
  setShowAddTransaction: (show: boolean) => void;
  setShowAddProduct: (show: boolean) => void;
  setShowAddCategory: (show: boolean) => void;
  onAddTransaction: () => void;
  onAddProduct: () => void;
  onAddCategory: () => void;
  products: any[];
  categories: any[];
  transactionForm: any;
  setTransactionForm: (form: any) => void;
  productForm: any;
  setProductForm: (form: any) => void;
  categoryForm: any;
  setCategoryForm: (form: any) => void;
}

export default function QuickActions({
  showAddTransaction,
  showAddProduct,
  showAddCategory,
  setShowAddTransaction,
  setShowAddProduct,
  setShowAddCategory,
  onAddTransaction,
  onAddProduct,
  onAddCategory,
  products,
  categories,
  transactionForm,
  setTransactionForm,
  productForm,
  setProductForm,
  categoryForm,
  setCategoryForm,
}: QuickActionsProps) {
  return (
    <>
      {/* Quick Actions Grid */}
      <div style={styles.quickActionsContainer}>
        <h3 style={styles.sectionTitle}>🚀 Quick Actions</h3>
        <div style={styles.actionsGrid}>
          <button 
            className="btn btn-secondary hover-lift"
            onClick={() => setShowAddTransaction(true)}
            style={styles.actionButton}
          >
            📝 Log Transaction
          </button>
          <button 
            className="btn btn-secondary hover-lift"
            onClick={() => setShowAddProduct(true)}
            style={styles.actionButton}
          >
            🛍️ Add Product
          </button>
          <button 
            className="btn btn-secondary hover-lift"
            onClick={() => setShowAddCategory(true)}
            style={styles.actionButton}
          >
            📁 Add Category
          </button>
          <button 
            className="btn btn-secondary hover-lift"
            onClick={() => window.location.href = '/reports'}
            style={styles.actionButton}
          >
            📊 View Reports
          </button>
        </div>
      </div>

      {/* Transaction Modal */}
      <Modal
        isOpen={showAddTransaction}
        onClose={() => setShowAddTransaction(false)}
        title="📝 Log New Transaction"
      >
        <div style={styles.formGrid}>
          <div className="form-group">
            <label className="form-label">Product:</label>
            <select
              value={transactionForm.productId}
              onChange={(e) => setTransactionForm(prev => ({ ...prev, productId: parseInt(e.target.value) }))}
              className="form-input"
              style={styles.input}
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
              style={styles.input}
            >
              <option value="add">Add Stock</option>
              <option value="remove">Remove Stock</option>
              <option value="transfer">Transfer</option>
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Quantity:</label>
            <input
              type="number"
              value={transactionForm.quantity}
              onChange={(e) => setTransactionForm(prev => ({ ...prev, quantity: parseInt(e.target.value) || 0 }))}
              className="form-input"
              style={styles.input}
              placeholder="Enter quantity"
            />
          </div>

          <div className="form-group" style={{ gridColumn: '1 / -1' }}>
            <label className="form-label">Notes:</label>
            <textarea
              value={transactionForm.notes}
              onChange={(e) => setTransactionForm(prev => ({ ...prev, notes: e.target.value }))}
              className="form-input"
              style={{ ...styles.input, minHeight: '80px', resize: 'vertical' as const }}
              placeholder="Optional notes about this transaction"
            />
          </div>
        </div>

        <div style={styles.buttonGroup}>
          <button
            onClick={() => setShowAddTransaction(false)}
            className="btn btn-secondary"
            style={styles.cancelButton}
          >
            Cancel
          </button>
          <button
            onClick={onAddTransaction}
            className="btn btn-primary"
            style={styles.submitButton}
            disabled={!transactionForm.productId || !transactionForm.quantity}
          >
            Log Transaction
          </button>
        </div>
      </Modal>

      {/* Product Modal */}
      <Modal
        isOpen={showAddProduct}
        onClose={() => setShowAddProduct(false)}
        title="🛍️ Add New Product"
      >
        <div style={styles.formGrid}>
          <div className="form-group">
            <label className="form-label">Product Name:</label>
            <input
              type="text"
              value={productForm.name}
              onChange={(e) => setProductForm(prev => ({ ...prev, name: e.target.value }))}
              className="form-input"
              style={styles.input}
              placeholder="Enter product name"
            />
          </div>

          <div className="form-group">
            <label className="form-label">SKU:</label>
            <input
              type="text"
              value={productForm.sku}
              onChange={(e) => setProductForm(prev => ({ ...prev, sku: e.target.value }))}
              className="form-input"
              style={styles.input}
              placeholder="Product SKU"
            />
          </div>

          <div className="form-group">
            <label className="form-label">Category:</label>
            <select
              value={productForm.categoryId}
              onChange={(e) => setProductForm(prev => ({ ...prev, categoryId: parseInt(e.target.value) }))}
              className="form-input"
              style={styles.input}
            >
              <option value={0}>Select Category</option>
              {categories.map(category => (
                <option key={category.id} value={category.id}>{category.name}</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Unit:</label>
            <input
              type="text"
              value={productForm.unit}
              onChange={(e) => setProductForm(prev => ({ ...prev, unit: e.target.value }))}
              className="form-input"
              style={styles.input}
              placeholder="e.g., pieces, kg, liters"
            />
          </div>

          <div className="form-group">
            <label className="form-label">Restock Threshold:</label>
            <input
              type="number"
              value={productForm.restockThreshold}
              onChange={(e) => setProductForm(prev => ({ ...prev, restockThreshold: parseInt(e.target.value) || 0 }))}
              className="form-input"
              style={styles.input}
              placeholder="Minimum stock level"
            />
          </div>

          <div className="form-group" style={{ gridColumn: '1 / -1' }}>
            <label className="form-label">Description:</label>
            <textarea
              value={productForm.description}
              onChange={(e) => setProductForm(prev => ({ ...prev, description: e.target.value }))}
              className="form-input"
              style={{ ...styles.input, minHeight: '80px', resize: 'vertical' as const }}
              placeholder="Product description"
            />
          </div>
        </div>

        <div style={styles.buttonGroup}>
          <button
            onClick={() => setShowAddProduct(false)}
            className="btn btn-secondary"
            style={styles.cancelButton}
          >
            Cancel
          </button>
          <button
            onClick={onAddProduct}
            className="btn btn-primary"
            style={styles.submitButton}
            disabled={!productForm.name.trim()}
          >
            Add Product
          </button>
        </div>
      </Modal>

      {/* Category Modal */}
      <Modal
        isOpen={showAddCategory}
        onClose={() => setShowAddCategory(false)}
        title="📁 Add New Category"
      >
        <div style={styles.formGrid}>
          <div className="form-group">
            <label className="form-label">Category Name:</label>
            <input
              type="text"
              value={categoryForm.name}
              onChange={(e) => setCategoryForm(prev => ({ ...prev, name: e.target.value }))}
              className="form-input"
              style={styles.input}
              placeholder="Enter category name"
            />
          </div>

          <div className="form-group" style={{ gridColumn: '1 / -1' }}>
            <label className="form-label">Description:</label>
            <textarea
              value={categoryForm.description}
              onChange={(e) => setCategoryForm(prev => ({ ...prev, description: e.target.value }))}
              className="form-input"
              style={{ ...styles.input, minHeight: '80px', resize: 'vertical' as const }}
              placeholder="Category description"
            />
          </div>
        </div>

        <div style={styles.buttonGroup}>
          <button
            onClick={() => setShowAddCategory(false)}
            className="btn btn-secondary"
            style={styles.cancelButton}
          >
            Cancel
          </button>
          <button
            onClick={onAddCategory}
            className="btn btn-primary"
            style={styles.submitButton}
            disabled={!categoryForm.name.trim()}
          >
            Add Category
          </button>
        </div>
      </Modal>
    </>
  );
}

const styles = {
  quickActionsContainer: {
    backgroundColor: 'white',
    borderRadius: '8px',
    padding: '1.5rem',
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
    marginBottom: '1.5rem',
  },
  sectionTitle: {
    margin: '0 0 1rem 0',
    color: '#1e293b',
    fontSize: '1.1rem',
    fontWeight: 'bold',
  },
  actionsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '1rem',
  },
  actionButton: {
    padding: '1rem',
    justifyContent: 'flex-start',
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
  },
  formGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '1rem',
    marginBottom: '1.5rem',
  },
  input: {
    width: '100%',
    padding: '0.75rem',
    border: '1px solid #e2e8f0',
    borderRadius: '6px',
    fontSize: '0.9rem',
  },
  buttonGroup: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '0.75rem',
    paddingTop: '1rem',
    borderTop: '1px solid #e2e8f0',
  },
  cancelButton: {
    padding: '0.75rem 1.5rem',
  },
  submitButton: {
    padding: '0.75rem 1.5rem',
  },
};
