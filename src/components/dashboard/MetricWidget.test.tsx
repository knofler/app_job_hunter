/**
 * Tests for MetricWidget component
 */

import { render, screen } from '@testing-library/react';
import MetricWidget from './MetricWidget';

describe('MetricWidget', () => {
  it('renders title and value', () => {
    render(<MetricWidget title="Total Applications" value={42} />);
    expect(screen.getByText('Total Applications')).toBeInTheDocument();
    expect(screen.getByText('42')).toBeInTheDocument();
  });

  it('renders string value', () => {
    render(<MetricWidget title="Status" value="Active" />);
    expect(screen.getByText('Active')).toBeInTheDocument();
  });

  it('renders subtitle when provided', () => {
    render(<MetricWidget title="Score" value={85} subtitle="Last 30 days" />);
    expect(screen.getByText('Last 30 days')).toBeInTheDocument();
  });

  it('does not render subtitle when not provided', () => {
    render(<MetricWidget title="Score" value={85} />);
    expect(screen.queryByText('Last 30 days')).not.toBeInTheDocument();
  });

  it('renders positive trend', () => {
    render(<MetricWidget title="Score" value={85} trend={{ value: 12, isPositive: true }} />);
    expect(screen.getByText('12%')).toBeInTheDocument();
  });

  it('renders negative trend', () => {
    render(<MetricWidget title="Score" value={85} trend={{ value: 5, isPositive: false }} />);
    expect(screen.getByText('5%')).toBeInTheDocument();
  });

  it('renders icon when provided', () => {
    render(<MetricWidget title="Score" value={85} icon={<span data-testid="icon">I</span>} />);
    expect(screen.getByTestId('icon')).toBeInTheDocument();
  });
});
