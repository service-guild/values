import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { ValueDefinitionDisplay } from './ValueDefinitionDisplay';

describe('ValueDefinitionDisplay Component', () => {
  const testName = 'TEST VALUE';
  const testDescription = 'This is a test description.';

  it('renders the name and description correctly', () => {
    render(<ValueDefinitionDisplay name={testName} description={testDescription} />);

    // Check for name (within its span)
    const nameElement = screen.getByText(`${testName}:`);
    expect(nameElement).toBeDefined();
    expect(nameElement.tagName).toBe('SPAN');

    // Check for description (within its span)
    const descriptionElement = screen.getByText(testDescription);
    expect(descriptionElement).toBeDefined();
    expect(descriptionElement.tagName).toBe('SPAN');

    // Check parent is LI
    expect(nameElement.parentElement?.tagName).toBe('LI');
  });
});
