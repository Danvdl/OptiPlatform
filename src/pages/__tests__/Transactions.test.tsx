import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import Transactions from '../../pages/Transactions';

jest.mock('../../utils/advancedApi', () => ({
  fetchAdvancedTransactions: jest.fn(async () => []),
  createAdvancedTransaction: jest.fn(async (input: any) => ({
    id: 123,
    productName: input.productName,
    type: input.type,
    quantity: input.quantity,
    status: 'pending',
    occurredAt: new Date().toISOString(),
  })),
}));

describe('Transactions page', () => {
  it('opens create transaction modal, submits, and closes', async () => {
    render(<Transactions />);

    // Wait for loading state to finish
    expect(await screen.findByText(/Transaction History/i)).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /new transaction/i }));
    expect(screen.getByText('➕ Create New Transaction')).toBeInTheDocument();

  // Fill form
  fireEvent.change(screen.getByTestId('txn-product'), { target: { value: 'Wireless Mouse' } });
  fireEvent.change(screen.getByTestId('txn-type'), { target: { value: 'adjustment' } });
  fireEvent.change(screen.getByTestId('txn-quantity'), { target: { value: '5' } });

    fireEvent.click(screen.getByRole('button', { name: /create transaction/i }));

    await waitFor(() => {
      expect(screen.queryByText('➕ Create New Transaction')).not.toBeInTheDocument();
    });
  });
});
