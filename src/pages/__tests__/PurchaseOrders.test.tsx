import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import PurchaseOrders from '../../pages/PurchaseOrders';

jest.mock('../../utils/advancedApi', () => ({
  fetchPurchaseOrders: jest.fn(async () => []),
  createPurchaseOrder: jest.fn(async (input: any) => ({
    id: 999,
    poNumber: 'PO-TEST-001',
    supplierName: input.supplierName,
    status: 'draft',
    priority: input.priority,
    totalAmount: 0,
    currency: 'USD',
    orderDate: new Date().toISOString(),
    expectedDeliveryDate: input.expectedDeliveryDate,
    itemCount: 0,
  })),
}));

describe('PurchaseOrders page', () => {
  it('opens create PO modal, submits, and closes', async () => {
    render(<PurchaseOrders />);

    expect(await screen.findByText(/Total Orders/i)).toBeInTheDocument();

  fireEvent.click(screen.getByTestId('po-open'));
    expect(screen.getByText('🛒 Create Purchase Order')).toBeInTheDocument();

    // Fill form using testids to avoid locale/label flakiness
    fireEvent.change(screen.getByTestId('po-supplier'), { target: { value: 'Tech Supply Co' } });
    fireEvent.change(screen.getByTestId('po-priority'), { target: { value: 'high' } });
    fireEvent.change(screen.getByTestId('po-expected-delivery'), { target: { value: '2025-08-15' } });

  fireEvent.click(screen.getByTestId('po-submit'));

    await waitFor(() => {
      expect(screen.queryByText('🛒 Create Purchase Order')).not.toBeInTheDocument();
    });

    // New row should reflect new supplier
    expect(await screen.findByText('Tech Supply Co')).toBeInTheDocument();
  });
});
