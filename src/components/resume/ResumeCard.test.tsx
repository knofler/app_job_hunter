/**
 * Tests for ResumeCard component
 */

import { render, screen, fireEvent } from '@testing-library/react';
import ResumeCard from './ResumeCard';

const mockResume = {
  id: 'r1',
  name: 'Software Engineer Resume',
  uploadedAt: 'March 15, 2025',
  healthScore: 92,
  type: 'Technical',
  isPrimary: false,
};

describe('ResumeCard', () => {
  it('renders resume name', () => {
    render(<ResumeCard resume={mockResume} />);
    expect(screen.getByText('Software Engineer Resume')).toBeInTheDocument();
  });

  it('renders uploaded date', () => {
    render(<ResumeCard resume={mockResume} />);
    expect(screen.getByText('March 15, 2025')).toBeInTheDocument();
  });

  it('renders health score when provided', () => {
    render(<ResumeCard resume={mockResume} />);
    expect(screen.getByText('92/100')).toBeInTheDocument();
    expect(screen.getByText('Health Score')).toBeInTheDocument();
  });

  it('does not render health score when not provided', () => {
    const resumeNoScore = { ...mockResume, healthScore: undefined };
    render(<ResumeCard resume={resumeNoScore} />);
    expect(screen.queryByText('Health Score')).not.toBeInTheDocument();
  });

  it('shows Primary badge when isPrimary is true', () => {
    const primaryResume = { ...mockResume, isPrimary: true };
    render(<ResumeCard resume={primaryResume} />);
    expect(screen.getByText('Primary')).toBeInTheDocument();
  });

  it('does not show Primary badge when isPrimary is false', () => {
    render(<ResumeCard resume={mockResume} />);
    expect(screen.queryByText('Primary')).not.toBeInTheDocument();
  });

  it('renders View button when onView is provided', () => {
    const onView = jest.fn();
    render(<ResumeCard resume={mockResume} onView={onView} />);
    expect(screen.getByText('View')).toBeInTheDocument();
  });

  it('calls onView with resume id when View clicked', () => {
    const onView = jest.fn();
    render(<ResumeCard resume={mockResume} onView={onView} />);
    fireEvent.click(screen.getByText('View'));
    expect(onView).toHaveBeenCalledWith('r1');
  });

  it('calls onDelete with resume id when delete clicked', () => {
    const onDelete = jest.fn();
    render(<ResumeCard resume={mockResume} onDelete={onDelete} />);
    // The delete button doesn't have text, find it by the SVG container
    const buttons = screen.getAllByRole('button');
    const deleteButton = buttons[buttons.length - 1]; // Last button is delete
    fireEvent.click(deleteButton);
    expect(onDelete).toHaveBeenCalledWith('r1');
  });

  it('renders set primary button with correct aria-label', () => {
    const onSetPrimary = jest.fn();
    render(<ResumeCard resume={mockResume} onSetPrimary={onSetPrimary} />);
    expect(screen.getByLabelText('Set as primary')).toBeInTheDocument();
  });

  it('calls onSetPrimary when star button clicked', () => {
    const onSetPrimary = jest.fn();
    render(<ResumeCard resume={mockResume} onSetPrimary={onSetPrimary} />);
    fireEvent.click(screen.getByLabelText('Set as primary'));
    expect(onSetPrimary).toHaveBeenCalledWith('r1');
  });
});
