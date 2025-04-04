import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import type { ValueCard as ValueCardType } from '../types/appState';
import { Column } from './Column';

// Mock the ValueCard component to isolate testing Column logic
vi.mock('./ValueCard', () => ({
  ValueCard: ({ card }: { card: ValueCardType }) => <div data-testid={`mock-value-card-${card.id}`}>{card.name}</div>,
}));

describe('Column Component', () => {
  const mockCards: ValueCardType[] = [
    { id: 1, name: 'CARD 1', column: 'col1', order: 0 },
    { id: 2, name: 'CARD 2', column: 'col1', order: 1 },
  ];

  it('renders the column title', () => {
    render(<Column title="Test Column" columnId="col1" cards={[]} />);
    expect(screen.getByRole('heading', { name: 'Test Column' })).toBeDefined();
  });

  it('renders "Empty" message when no cards are provided', () => {
    render(<Column title="Test Column" columnId="col1" cards={[]} />);
    expect(screen.getByText('Empty')).toBeDefined();
  });

  it('renders ValueCard components for each card provided', () => {
    render(<Column title="Test Column" columnId="col1" cards={mockCards} />);

    // Check that the mock ValueCards are rendered
    expect(screen.getByTestId('mock-value-card-1')).toBeDefined();
    expect(screen.getByText('CARD 1')).toBeDefined();
    expect(screen.getByTestId('mock-value-card-2')).toBeDefined();
    expect(screen.getByText('CARD 2')).toBeDefined();

    // Ensure the "Empty" message is NOT present
    expect(screen.queryByText('Empty')).toBeNull();
  });

  it('includes a data-testid attribute for the column', () => {
    render(<Column title="Test Column" columnId="col1" cards={[]} />);
    expect(screen.getByTestId('column-col1')).toBeDefined();
  });
});
