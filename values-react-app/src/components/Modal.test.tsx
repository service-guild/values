import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { Modal } from './Modal';

describe('Modal Component', () => {
  const user = userEvent.setup();
  let mockOnClose: () => void;

  beforeEach(() => {
    // Reset mock before each test
    mockOnClose = vi.fn();
    // Ensure portal root exists if needed, though RTL usually handles it
  });

  it('does not render when isOpen is false', () => {
    render(
      <Modal isOpen={false} onClose={mockOnClose} title="Test Modal">
        <div>Modal Content</div>
      </Modal>,
    );
    // Use queryByRole as getByRole would throw if not found
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('renders correctly when isOpen is true', () => {
    render(
      <Modal isOpen={true} onClose={mockOnClose} title="Test Modal">
        <div>Modal Content</div>
      </Modal>,
    );
    expect(screen.getByRole('dialog')).toBeDefined();
    expect(screen.getByRole('heading', { name: 'Test Modal' })).toBeDefined();
    expect(screen.getByText('Modal Content')).toBeDefined();
    expect(screen.getByLabelText('Close modal')).toBeDefined();
  });

  it('calls onClose when the close button is clicked', async () => {
    render(
      <Modal isOpen={true} onClose={mockOnClose} title="Test Modal">
        <div>Modal Content</div>
      </Modal>,
    );
    const closeButton = screen.getByLabelText('Close modal');
    await user.click(closeButton);
    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it('calls onClose when the overlay is clicked', async () => {
    render(
      <Modal isOpen={true} onClose={mockOnClose} title="Test Modal">
        <div>Modal Content</div>
      </Modal>,
    );
    // Overlay is the div with role=dialog
    const overlay = screen.getByRole('dialog');
    await user.click(overlay);
    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it('does NOT call onClose when the modal content is clicked', async () => {
    render(
      <Modal isOpen={true} onClose={mockOnClose} title="Test Modal">
        <div>Modal Content</div>
      </Modal>,
    );
    const content = screen.getByText('Modal Content');
    await user.click(content);
    expect(mockOnClose).not.toHaveBeenCalled();
  });

  it('calls onClose when the Escape key is pressed', async () => {
    render(
      <Modal isOpen={true} onClose={mockOnClose} title="Test Modal">
        <div>Modal Content</div>
      </Modal>,
    );
    // fireEvent is sometimes simpler for keyboard events on document
    fireEvent.keyDown(document, { key: 'Escape', code: 'Escape' });
    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it('does not render title if title prop is not provided', () => {
    render(
      <Modal isOpen={true} onClose={mockOnClose}>
        <div>Modal Content</div>
      </Modal>,
    );
    expect(screen.queryByRole('heading')).toBeNull();
  });
});
