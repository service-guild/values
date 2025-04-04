import React, { useEffect } from 'react';
import ReactDOM from 'react-dom';

import { Button } from './Button';

// Assuming a Button component exists

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  // Optional props for size, etc.
}

export function Modal({ isOpen, onClose, title, children }: ModalProps) {
  // Effect to handle escape key closing
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
    } else {
      document.removeEventListener('keydown', handleEscape);
    }

    // Cleanup listener on unmount or when modal closes
    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  // Use React Portal to render the modal at the root level
  return ReactDOM.createPortal(
    <div
      className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center p-4"
      onClick={onClose} // Close on overlay click
      role="dialog"
      aria-modal="true"
      aria-labelledby={title ? 'modal-title' : undefined}
    >
      <div
        className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full relative"
        onClick={(e) => e.stopPropagation()} // Prevent closing when clicking inside content
      >
        {/* Close Button */}
        <Button
          className="absolute top-2 right-2 p-1 text-gray-400 hover:text-gray-600" // Minimal styling
          onClick={onClose}
          aria-label="Close modal"
          variant="secondary" // Use secondary or create a specific 'icon' variant
          style={{
            // More specific styling for a small close button
            minWidth: 'auto',
            padding: '0.25rem',
            lineHeight: '1',
            background: 'transparent',
            border: 'none',
          }}
        >
          &times; {/* Simple X icon */}
        </Button>

        {/* Title */}
        {title && (
          <h2 id="modal-title" className="text-xl font-semibold mb-4">
            {title}
          </h2>
        )}

        {/* Content */}
        <div>{children}</div>
      </div>
    </div>,
    document.body, // Mount directly to body
  );
}
