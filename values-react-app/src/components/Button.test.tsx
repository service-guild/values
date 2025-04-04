import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { Button } from './Button';

describe('Button Component', () => {
  it('renders children correctly', () => {
    render(<Button>Click Me</Button>);
    expect(screen.getByRole('button', { name: 'Click Me' })).toBeDefined();
  });

  it('calls onClick handler when clicked', async () => {
    const user = userEvent.setup();
    const handleClick = vi.fn(); // Create a mock function

    render(<Button onClick={handleClick}>Click Me</Button>);

    const button = screen.getByRole('button', { name: 'Click Me' });
    await user.click(button);

    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('is disabled when disabled prop is true', async () => {
    const user = userEvent.setup();
    const handleClick = vi.fn();

    render(
      <Button onClick={handleClick} disabled>
        Click Me
      </Button>,
    );

    const button = screen.getByRole('button', { name: 'Click Me' });
    expect(button).toBeDisabled();

    // Try clicking the disabled button
    await user.click(button).catch(() => {}); // Catch potential errors from clicking disabled elements

    // onClick should not have been called
    expect(handleClick).not.toHaveBeenCalled();
  });

  it('applies primary variant styles by default', () => {
    render(<Button>Primary</Button>);
    const button = screen.getByRole('button', { name: 'Primary' });
    // Basic check for a class expected in the primary variant
    expect(button.className).toContain('bg-blue-500');
  });

  it('applies secondary variant styles when specified', () => {
    render(<Button variant="secondary">Secondary</Button>);
    const button = screen.getByRole('button', { name: 'Secondary' });
    expect(button.className).toContain('bg-gray-200');
  });

  it('applies danger variant styles when specified', () => {
    render(<Button variant="danger">Danger</Button>);
    const button = screen.getByRole('button', { name: 'Danger' });
    expect(button.className).toContain('bg-red-500');
  });

  it('merges custom className prop', () => {
    render(<Button className="extra-class">Merge</Button>);
    const button = screen.getByRole('button', { name: 'Merge' });
    expect(button.className).toContain('bg-blue-500'); // Default variant
    expect(button.className).toContain('extra-class'); // Custom class
  });
});
