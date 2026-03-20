/**
 * Tests for LoadingSpinner component
 */

import { render, screen } from '@testing-library/react';
import LoadingSpinner from './LoadingSpinner';

describe('LoadingSpinner', () => {
  it('renders the spinner SVG', () => {
    const { container } = render(<LoadingSpinner />);
    expect(container.querySelector('svg')).toBeInTheDocument();
  });

  it('does not render text by default', () => {
    const { container } = render(<LoadingSpinner />);
    expect(container.querySelector('p')).not.toBeInTheDocument();
  });

  it('renders text when provided', () => {
    render(<LoadingSpinner text="Loading data..." />);
    expect(screen.getByText('Loading data...')).toBeInTheDocument();
  });

  it('applies sm size class', () => {
    const { container } = render(<LoadingSpinner size="sm" />);
    const svg = container.querySelector('svg');
    expect(svg?.getAttribute('class')).toContain('h-4');
  });

  it('applies lg size class', () => {
    const { container } = render(<LoadingSpinner size="lg" />);
    const svg = container.querySelector('svg');
    expect(svg?.getAttribute('class')).toContain('h-12');
  });

  it('applies xl size class', () => {
    const { container } = render(<LoadingSpinner size="xl" />);
    const svg = container.querySelector('svg');
    expect(svg?.getAttribute('class')).toContain('h-16');
  });

  it('applies custom className', () => {
    const { container } = render(<LoadingSpinner className="my-custom" />);
    expect(container.firstElementChild?.className).toContain('my-custom');
  });
});
