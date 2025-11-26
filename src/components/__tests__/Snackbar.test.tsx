import { describe, test, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';
import Snackbar from '../Snackbar';

describe('Snackbar', () => {
  const defaultProps = {
    message: 'Test message',
    onClose: vi.fn(),
  };

  describe('rendering', () => {
    test('renders message correctly', () => {
      render(<Snackbar {...defaultProps} />);
      expect(screen.getByText('Test message')).toBeInTheDocument();
    });

    test('renders with error type by default', () => {
      const { container } = render(<Snackbar {...defaultProps} />);
      expect(container.querySelector('.snackbar-error')).toBeInTheDocument();
      expect(screen.getByText('❌')).toBeInTheDocument();
    });

    test('renders with success type', () => {
      const { container } = render(<Snackbar {...defaultProps} type="success" />);
      expect(container.querySelector('.snackbar-success')).toBeInTheDocument();
      expect(screen.getByText('✅')).toBeInTheDocument();
    });

    test('renders with warning type', () => {
      const { container } = render(<Snackbar {...defaultProps} type="warning" />);
      expect(container.querySelector('.snackbar-warning')).toBeInTheDocument();
      expect(screen.getByText('⚠️')).toBeInTheDocument();
    });

    test('renders with info type', () => {
      const { container } = render(<Snackbar {...defaultProps} type="info" />);
      expect(container.querySelector('.snackbar-info')).toBeInTheDocument();
      expect(screen.getByText('ℹ️')).toBeInTheDocument();
    });

    test('renders error code when provided', () => {
      render(<Snackbar {...defaultProps} code="E2000" />);
      expect(screen.getByText('Code: E2000')).toBeInTheDocument();
    });

    test('does not render code section when code is not provided', () => {
      render(<Snackbar {...defaultProps} />);
      expect(screen.queryByText(/Code:/)).not.toBeInTheDocument();
    });

    test('renders close button', () => {
      render(<Snackbar {...defaultProps} />);
      expect(screen.getByRole('button')).toBeInTheDocument();
      expect(screen.getByText('×')).toBeInTheDocument();
    });
  });

  describe('interactions', () => {
    test('calls onClose when close button is clicked', () => {
      const onClose = vi.fn();
      render(<Snackbar {...defaultProps} onClose={onClose} />);
      
      fireEvent.click(screen.getByRole('button'));
      expect(onClose).toHaveBeenCalled();
    });

    test('calls onClose when snackbar container is clicked', () => {
      const onClose = vi.fn();
      const { container } = render(<Snackbar {...defaultProps} onClose={onClose} />);
      
      const snackbar = container.querySelector('.snackbar');
      if (snackbar) {
        fireEvent.click(snackbar);
        expect(onClose).toHaveBeenCalled();
      }
    });
  });

  describe('auto-close behavior', () => {
    test('auto-closes after default duration (3000ms)', async () => {
      vi.useFakeTimers();
      const onClose = vi.fn();
      render(<Snackbar {...defaultProps} onClose={onClose} />);
      
      expect(onClose).not.toHaveBeenCalled();
      
      vi.advanceTimersByTime(3000);
      expect(onClose).toHaveBeenCalledTimes(1);
      
      vi.useRealTimers();
    });

    test('auto-closes after custom duration', async () => {
      vi.useFakeTimers();
      const onClose = vi.fn();
      render(<Snackbar {...defaultProps} onClose={onClose} duration={5000} />);
      
      vi.advanceTimersByTime(4999);
      expect(onClose).not.toHaveBeenCalled();
      
      vi.advanceTimersByTime(1);
      expect(onClose).toHaveBeenCalledTimes(1);
      
      vi.useRealTimers();
    });

    test('does not auto-close when autoClose is false', async () => {
      vi.useFakeTimers();
      const onClose = vi.fn();
      render(<Snackbar {...defaultProps} onClose={onClose} autoClose={false} />);
      
      vi.advanceTimersByTime(10000);
      expect(onClose).not.toHaveBeenCalled();
      
      vi.useRealTimers();
    });
  });

  describe('custom styling', () => {
    test('applies custom style prop', () => {
      const customStyle = { backgroundColor: 'red', marginTop: '50px' };
      const { container } = render(<Snackbar {...defaultProps} style={customStyle} />);
      
      const snackbar = container.querySelector('.snackbar') as HTMLElement;
      expect(snackbar?.style.backgroundColor).toBe('red');
      expect(snackbar?.style.marginTop).toBe('50px');
    });
  });

  describe('icon display', () => {
    test('displays correct icon for each type', () => {
      const types: Array<{ type: 'error' | 'success' | 'warning' | 'info'; icon: string }> = [
        { type: 'error', icon: '❌' },
        { type: 'success', icon: '✅' },
        { type: 'warning', icon: '⚠️' },
        { type: 'info', icon: 'ℹ️' },
      ];

      types.forEach(({ type, icon }) => {
        const { unmount } = render(<Snackbar {...defaultProps} type={type} />);
        expect(screen.getByText(icon)).toBeInTheDocument();
        unmount();
      });
    });
  });

  describe('message variations', () => {
    test('renders long message', () => {
      const longMessage = 'This is a very long message that should still render correctly in the snackbar component without any issues.';
      render(<Snackbar {...defaultProps} message={longMessage} />);
      expect(screen.getByText(longMessage)).toBeInTheDocument();
    });

    test('renders message with special characters', () => {
      const specialMessage = 'Error: Invalid input! @#$%^&*()';
      render(<Snackbar {...defaultProps} message={specialMessage} />);
      expect(screen.getByText(specialMessage)).toBeInTheDocument();
    });

    test('renders empty message', () => {
      render(<Snackbar {...defaultProps} message="" />);
      expect(screen.getByRole('button')).toBeInTheDocument(); // Still renders component
    });
  });

  describe('cleanup', () => {
    test('clears timeout on unmount', () => {
      vi.useFakeTimers();
      const onClose = vi.fn();
      const { unmount } = render(<Snackbar {...defaultProps} onClose={onClose} />);
      
      unmount();
      vi.advanceTimersByTime(3000);
      
      expect(onClose).not.toHaveBeenCalled();
      vi.useRealTimers();
    });

    test('resets timer when message changes', () => {
      vi.useFakeTimers();
      const onClose = vi.fn();
      const { rerender } = render(<Snackbar {...defaultProps} onClose={onClose} message="First" />);
      
      vi.advanceTimersByTime(2000);
      rerender(<Snackbar {...defaultProps} onClose={onClose} message="Second" />);
      
      vi.advanceTimersByTime(2000);
      expect(onClose).not.toHaveBeenCalled();
      
      vi.advanceTimersByTime(1000);
      expect(onClose).toHaveBeenCalledTimes(1);
      
      vi.useRealTimers();
    });
  });
});
