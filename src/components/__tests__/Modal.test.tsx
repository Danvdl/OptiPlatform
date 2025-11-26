import { describe, test, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import Modal from '../Modal';

describe('Modal', () => {
  test('renders nothing when isOpen is false', () => {
    const { container } = render(
      <Modal isOpen={false} onClose={() => {}} title="Test Modal">
        <p>Content</p>
      </Modal>
    );
    expect(container.firstChild).toBeNull();
  });

  test('renders modal when isOpen is true', () => {
    render(
      <Modal isOpen={true} onClose={() => {}} title="Test Modal">
        <p>Content</p>
      </Modal>
    );
    expect(screen.getByText('Test Modal')).toBeInTheDocument();
    expect(screen.getByText('Content')).toBeInTheDocument();
  });

  test('displays correct title', () => {
    const title = 'My Custom Modal Title';
    render(
      <Modal isOpen={true} onClose={() => {}} title={title}>
        <p>Content</p>
      </Modal>
    );
    expect(screen.getByText(title)).toBeInTheDocument();
  });

  test('renders children content', () => {
    render(
      <Modal isOpen={true} onClose={() => {}} title="Test">
        <div data-testid="custom-content">
          <p>First paragraph</p>
          <p>Second paragraph</p>
        </div>
      </Modal>
    );
    const customContent = screen.getByTestId('custom-content');
    expect(customContent).toBeInTheDocument();
    expect(screen.getByText('First paragraph')).toBeInTheDocument();
    expect(screen.getByText('Second paragraph')).toBeInTheDocument();
  });

  test('calls onClose when close button is clicked', () => {
    const onClose = vi.fn();
    render(
      <Modal isOpen={true} onClose={onClose} title="Test Modal">
        <p>Content</p>
      </Modal>
    );
    
    const closeButton = screen.getByRole('button');
    fireEvent.click(closeButton);
    
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  test('calls onClose when overlay is clicked', () => {
    const onClose = vi.fn();
    const { container } = render(
      <Modal isOpen={true} onClose={onClose} title="Test Modal">
        <p>Content</p>
      </Modal>
    );
    
    // Click the overlay (first div)
    const overlay = container.firstChild as HTMLElement;
    fireEvent.click(overlay);
    
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  test('does not call onClose when modal content is clicked', () => {
    const onClose = vi.fn();
    render(
      <Modal isOpen={true} onClose={onClose} title="Test Modal">
        <p data-testid="content">Content</p>
      </Modal>
    );
    
    // Click inside the modal content
    const content = screen.getByTestId('content');
    fireEvent.click(content);
    
    expect(onClose).not.toHaveBeenCalled();
  });

  test('close button has correct text', () => {
    render(
      <Modal isOpen={true} onClose={() => {}} title="Test Modal">
        <p>Content</p>
      </Modal>
    );
    
    const closeButton = screen.getByRole('button');
    expect(closeButton.textContent).toBe('✕');
  });

  test('handles multiple opens and closes', () => {
    const { rerender } = render(
      <Modal isOpen={false} onClose={() => {}} title="Test Modal">
        <p>Content</p>
      </Modal>
    );
    
    expect(screen.queryByText('Test Modal')).not.toBeInTheDocument();
    
    rerender(
      <Modal isOpen={true} onClose={() => {}} title="Test Modal">
        <p>Content</p>
      </Modal>
    );
    
    expect(screen.getByText('Test Modal')).toBeInTheDocument();
    
    rerender(
      <Modal isOpen={false} onClose={() => {}} title="Test Modal">
        <p>Content</p>
      </Modal>
    );
    
    expect(screen.queryByText('Test Modal')).not.toBeInTheDocument();
  });

  test('renders complex children correctly', () => {
    render(
      <Modal isOpen={true} onClose={() => {}} title="Complex Modal">
        <div>
          <h2>Section Title</h2>
          <form>
            <input type="text" placeholder="Enter name" />
            <button type="submit">Submit</button>
          </form>
        </div>
      </Modal>
    );
    
    expect(screen.getByText('Section Title')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Enter name')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Submit' })).toBeInTheDocument();
  });
});
