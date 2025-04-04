import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React, { useState } from 'react';
import { describe, expect, it, vi } from 'vitest';

import { StatementInput } from './StatementInput';

describe('StatementInput Component', () => {
  const user = userEvent.setup();

  it('renders the label with the value name', () => {
    render(<StatementInput valueName="INTEGRITY" cardId={1} statement="" onChange={() => {}} />);
    // Check label content - using text matcher for flexibility
    expect(screen.getByLabelText(/Why is.*INTEGRITY.*a core value/i)).toBeDefined();
  });

  it('displays the initial statement value', () => {
    render(<StatementInput valueName="HONESTY" cardId={2} statement="Initial text" onChange={() => {}} />);
    expect(screen.getByRole('textbox')).toHaveValue('Initial text');
  });

  it('calls onChange with cardId and new value when text is typed', async () => {
    const mockOnChange = vi.fn();
    // Need a stateful wrapper for controlled component testing
    const TestWrapper = () => {
      const [text, setText] = useState('Start');
      const handleChange = (id: number, value: string) => {
        mockOnChange(id, value); // Call mock
        setText(value); // Update local state
      };
      return <StatementInput valueName="GROWTH" cardId={3} statement={text} onChange={handleChange} />;
    };

    render(<TestWrapper />);

    const textarea = screen.getByRole('textbox');
    expect(textarea).toHaveValue('Start');

    await user.type(textarea, 'ing');

    // Check textarea value updated via state wrapper
    expect(textarea).toHaveValue('Starting');
    // Check mock was called correctly
    expect(mockOnChange).toHaveBeenCalledTimes(3); // Once for each character typed
    expect(mockOnChange).toHaveBeenLastCalledWith(3, 'Starting');
  });

  it('uses cardId to generate unique id for label/input association', () => {
    render(<StatementInput valueName="KINDNESS" cardId={99} statement="" onChange={() => {}} />);
    const textarea = screen.getByRole('textbox');
    expect(textarea.id).toBe('statement-input-99');

    // Query label by its full text content, including the value name
    const labelElement = screen.getByText((content, element) => {
      // Custom matcher to handle potential nested elements within the label
      const hasText = (node: Element | null) => node?.textContent === 'Why is "KINDNESS" a core value for you?';
      const nodeHasText = hasText(element);
      // Check children recursively if needed (though likely not for this structure)
      const childrenDontHaveText = Array.from(element?.children || []).every((child) => !hasText(child));
      return nodeHasText && childrenDontHaveText;
    });

    // Check association via label's htmlFor
    expect(labelElement).toHaveAttribute('for', 'statement-input-99');
  });
});
