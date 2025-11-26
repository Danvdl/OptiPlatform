import { describe, test, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import QuickActions from '../QuickActions';

describe('QuickActions', () => {
  const defaultProps = {
    showAddTransaction: false,
    showAddProduct: false,
    showAddCategory: false,
    setShowAddTransaction: vi.fn(),
    setShowAddProduct: vi.fn(),
    setShowAddCategory: vi.fn(),
    onAddTransaction: vi.fn(),
    onAddProduct: vi.fn(),
    onAddCategory: vi.fn(),
    products: [
      { id: 1, name: 'Product 1' },
      { id: 2, name: 'Product 2' },
    ],
    categories: [
      { id: 1, name: 'Category 1' },
      { id: 2, name: 'Category 2' },
    ],
    transactionForm: { productId: 0, type: '', quantity: 0 },
    setTransactionForm: vi.fn(),
    productForm: { name: '', categoryId: 0 },
    setProductForm: vi.fn(),
    categoryForm: { name: '' },
    setCategoryForm: vi.fn(),
  };

  describe('rendering', () => {
    test('renders quick actions title', () => {
      render(<QuickActions {...defaultProps} />);
      expect(screen.getByText(/Quick Actions/i)).toBeInTheDocument();
    });

    test('renders action buttons', () => {
      render(<QuickActions {...defaultProps} />);
      expect(screen.getByText(/Log Transaction/i)).toBeInTheDocument();
      expect(screen.getByText(/Add Product/i)).toBeInTheDocument();
      expect(screen.getByText(/Add Category/i)).toBeInTheDocument();
    });
  });

  describe('button interactions', () => {
    test('clicking Log Transaction button calls setShowAddTransaction', () => {
      const setShowAddTransaction = vi.fn();
      render(<QuickActions {...defaultProps} setShowAddTransaction={setShowAddTransaction} />);
      
      fireEvent.click(screen.getByText(/Log Transaction/i));
      expect(setShowAddTransaction).toHaveBeenCalledWith(true);
    });

    test('clicking Add Product button calls setShowAddProduct', () => {
      const setShowAddProduct = vi.fn();
      render(<QuickActions {...defaultProps} setShowAddProduct={setShowAddProduct} />);
      
      fireEvent.click(screen.getByText(/Add Product/i));
      expect(setShowAddProduct).toHaveBeenCalledWith(true);
    });

    test('clicking Add Category button calls setShowAddCategory', () => {
      const setShowAddCategory = vi.fn();
      render(<QuickActions {...defaultProps} setShowAddCategory={setShowAddCategory} />);
      
      fireEvent.click(screen.getByText(/Add Category/i));
      expect(setShowAddCategory).toHaveBeenCalledWith(true);
    });
  });

  describe('modals', () => {
    test('transaction modal closed by default', () => {
      render(<QuickActions {...defaultProps} />);
      expect(screen.queryByText(/Log New Transaction/i)).not.toBeInTheDocument();
    });

    test('transaction modal opens when showAddTransaction is true', () => {
      render(<QuickActions {...defaultProps} showAddTransaction={true} />);
      expect(screen.getByText(/Log New Transaction/i)).toBeInTheDocument();
    });

    test('product modal opens when showAddProduct is true', () => {
      render(<QuickActions {...defaultProps} showAddProduct={true} />);
      expect(screen.getByText(/Add New Product/i)).toBeInTheDocument();
    });

    test('category modal opens when showAddCategory is true', () => {
      render(<QuickActions {...defaultProps} showAddCategory={true} />);
      expect(screen.getByText(/Add New Category/i)).toBeInTheDocument();
    });
  });
});
