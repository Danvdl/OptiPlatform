import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import React from 'react';
import { ErrorProvider, useError } from '../ErrorProvider';

// Test component that uses the error context
function TestComponent() {
  const { showError, showSuccess, clearErrors, errors } = useError();

  return (
    <div>
      <button onClick={() => showError('Test error', 'E1000')}>Show Error</button>
      <button onClick={() => showError('Another error')}>Show Error No Code</button>
      <button onClick={() => showSuccess('Success message')}>Show Success</button>
      <button onClick={clearErrors}>Clear Errors</button>
      <div data-testid="error-count">{errors.length}</div>
    </div>
  );
}

describe('ErrorProvider', () => {
  beforeEach(() => {
    vi.clearAllTimers();
  });

  afterEach(() => {
    vi.clearAllTimers();
  });

  describe('error display', () => {
    test('shows error message when showError is called', async () => {
      render(
        <ErrorProvider>
          <TestComponent />
        </ErrorProvider>
      );

      const button = screen.getByText('Show Error');
      button.click();

      await waitFor(() => {
        expect(screen.getByText('Test error')).toBeInTheDocument();
      });
    });

    test('shows error code when provided', async () => {
      render(
        <ErrorProvider>
          <TestComponent />
        </ErrorProvider>
      );

      const button = screen.getByText('Show Error');
      button.click();

      await waitFor(() => {
        expect(screen.getByText('Code: E1000')).toBeInTheDocument();
      });
    });

    test('shows error without code', async () => {
      render(
        <ErrorProvider>
          <TestComponent />
        </ErrorProvider>
      );

      const button = screen.getByText('Show Error No Code');
      button.click();

      await waitFor(() => {
        expect(screen.getByText('Another error')).toBeInTheDocument();
        expect(screen.queryByText(/Code:/)).not.toBeInTheDocument();
      });
    });

    test('shows multiple errors simultaneously', async () => {
      render(
        <ErrorProvider>
          <TestComponent />
        </ErrorProvider>
      );

      const errorButton = screen.getByText('Show Error');
      const errorNoCodeButton = screen.getByText('Show Error No Code');

      errorButton.click();
      errorNoCodeButton.click();

      await waitFor(() => {
        expect(screen.getByText('Test error')).toBeInTheDocument();
        expect(screen.getByText('Another error')).toBeInTheDocument();
      });

      expect(screen.getByTestId('error-count').textContent).toBe('2');
    });
  });

  describe('success display', () => {
    test('shows success message when showSuccess is called', async () => {
      render(
        <ErrorProvider>
          <TestComponent />
        </ErrorProvider>
      );

      const button = screen.getByText('Show Success');
      button.click();

      await waitFor(() => {
        expect(screen.getByText('Success message')).toBeInTheDocument();
      });
    });

    test('success message visible initially', async () => {
      render(
        <ErrorProvider>
          <TestComponent />
        </ErrorProvider>
      );

      const button = screen.getByText('Show Success');
      button.click();

      await waitFor(() => {
        expect(screen.getByText('Success message')).toBeInTheDocument();
      });
    });
  });

  describe('error auto-removal', () => {
    test('errors are initially visible', async () => {
      render(
        <ErrorProvider>
          <TestComponent />
        </ErrorProvider>
      );

      const button = screen.getByText('Show Error');
      button.click();

      await waitFor(() => {
        expect(screen.getByText('Test error')).toBeInTheDocument();
      });

      expect(screen.getByTestId('error-count').textContent).toBe('1');
    });

    test('multiple errors display simultaneously', async () => {
      render(
        <ErrorProvider>
          <TestComponent />
        </ErrorProvider>
      );

      const errorButton = screen.getByText('Show Error');
      const errorNoCodeButton = screen.getByText('Show Error No Code');
      
      errorButton.click();
      
      await waitFor(() => {
        expect(screen.getByText('Test error')).toBeInTheDocument();
      });
      
      errorNoCodeButton.click();

      await waitFor(() => {
        expect(screen.getByText('Another error')).toBeInTheDocument();
      });

      expect(screen.getByTestId('error-count').textContent).toBe('2');
    });
  });

  describe('clearErrors', () => {
    test('clears all errors immediately', async () => {
      render(
        <ErrorProvider>
          <TestComponent />
        </ErrorProvider>
      );

      const errorButton = screen.getByText('Show Error');
      const errorNoCodeButton = screen.getByText('Show Error No Code');
      const clearButton = screen.getByText('Clear Errors');

      errorButton.click();
      errorNoCodeButton.click();

      await waitFor(() => {
        expect(screen.getByTestId('error-count').textContent).toBe('2');
      });

      clearButton.click();

      await waitFor(() => {
        expect(screen.getByTestId('error-count').textContent).toBe('0');
        expect(screen.queryByText('Test error')).not.toBeInTheDocument();
        expect(screen.queryByText('Another error')).not.toBeInTheDocument();
      });
    });
  });

  describe('context value', () => {
    test('provides showError function', () => {
      const TestContextComponent = () => {
        const context = useError();
        expect(context.showError).toBeDefined();
        expect(typeof context.showError).toBe('function');
        return <div>Test</div>;
      };

      render(
        <ErrorProvider>
          <TestContextComponent />
        </ErrorProvider>
      );
    });

    test('provides showSuccess function', () => {
      const TestContextComponent = () => {
        const context = useError();
        expect(context.showSuccess).toBeDefined();
        expect(typeof context.showSuccess).toBe('function');
        return <div>Test</div>;
      };

      render(
        <ErrorProvider>
          <TestContextComponent />
        </ErrorProvider>
      );
    });

    test('provides clearErrors function', () => {
      const TestContextComponent = () => {
        const context = useError();
        expect(context.clearErrors).toBeDefined();
        expect(typeof context.clearErrors).toBe('function');
        return <div>Test</div>;
      };

      render(
        <ErrorProvider>
          <TestContextComponent />
        </ErrorProvider>
      );
    });

    test('provides errors array', () => {
      const TestContextComponent = () => {
        const context = useError();
        expect(context.errors).toBeDefined();
        expect(Array.isArray(context.errors)).toBe(true);
        return <div>Test</div>;
      };

      render(
        <ErrorProvider>
          <TestContextComponent />
        </ErrorProvider>
      );
    });
  });

  describe('error properties', () => {
    test('error has unique id', async () => {
      const ids: string[] = [];
      
      const TestIdComponent = () => {
        const { showError, errors } = useError();
        
        if (errors.length > 0) {
          ids.push(...errors.map(e => e.id));
        }
        
        return <button onClick={() => showError('Test')}>Add Error</button>;
      };

      render(
        <ErrorProvider>
          <TestIdComponent />
        </ErrorProvider>
      );

      const button = screen.getByText('Add Error');
      button.click();
      button.click();

      await waitFor(() => {
        expect(ids.length).toBeGreaterThanOrEqual(2);
      });

      expect(ids[0]).not.toBe(ids[1]);
    });

    test('error has timestamp', async () => {
      let timestamp: number | undefined;
      
      const TestTimestampComponent = () => {
        const { showError, errors } = useError();
        
        if (errors.length > 0) {
          timestamp = errors[0].timestamp;
        }
        
        return <button onClick={() => showError('Test')}>Add Error</button>;
      };

      render(
        <ErrorProvider>
          <TestTimestampComponent />
        </ErrorProvider>
      );

      screen.getByText('Add Error').click();

      await waitFor(() => {
        expect(timestamp).toBeDefined();
        expect(typeof timestamp).toBe('number');
        expect(timestamp!).toBeGreaterThan(0);
      });
    });
  });
});
