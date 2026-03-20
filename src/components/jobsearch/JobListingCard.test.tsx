/**
 * Tests for JobListingCard component
 */

import { render, screen } from '@testing-library/react';
import JobListingCard from './JobListingCard';

// Mock next/link
jest.mock('next/link', () => {
  return ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  );
});

const mockJob = {
  id: 'job-1',
  company: 'Acme Corp',
  location: 'New York, NY',
  title: 'Senior React Developer',
  description: 'Build amazing web applications',
  employment_type: 'Full-time',
  salary_range: '$120k-$160k',
  posted_at: '2025-03-15T00:00:00Z',
  code: 'SR-001',
};

describe('JobListingCard', () => {
  it('renders job title', () => {
    render(<JobListingCard job={mockJob} />);
    expect(screen.getByText('Senior React Developer')).toBeInTheDocument();
  });

  it('renders company name', () => {
    render(<JobListingCard job={mockJob} />);
    expect(screen.getByText('Acme Corp')).toBeInTheDocument();
  });

  it('renders company initials', () => {
    render(<JobListingCard job={mockJob} />);
    expect(screen.getByText('AC')).toBeInTheDocument();
  });

  it('renders job code when provided', () => {
    render(<JobListingCard job={mockJob} />);
    expect(screen.getByText('SR-001')).toBeInTheDocument();
  });

  it('renders description when provided', () => {
    render(<JobListingCard job={mockJob} />);
    expect(screen.getByText('Build amazing web applications')).toBeInTheDocument();
  });

  it('renders employment type badge', () => {
    render(<JobListingCard job={mockJob} />);
    expect(screen.getByText('Full-time')).toBeInTheDocument();
  });

  it('renders salary range', () => {
    render(<JobListingCard job={mockJob} />);
    expect(screen.getByText('$120k-$160k')).toBeInTheDocument();
  });

  it('renders posted date', () => {
    render(<JobListingCard job={mockJob} />);
    expect(screen.getByText('Mar 15')).toBeInTheDocument();
  });

  it('links to job detail page', () => {
    render(<JobListingCard job={mockJob} />);
    const link = screen.getByRole('link');
    expect(link.getAttribute('href')).toBe('/jobs/job-1');
  });

  it('renders "View Details" text', () => {
    render(<JobListingCard job={mockJob} />);
    expect(screen.getByText(/View Details/)).toBeInTheDocument();
  });

  it('handles job without optional fields', () => {
    const minimalJob = {
      id: 'job-2',
      company: 'Beta Inc',
      location: 'Remote',
      title: 'Developer',
    };
    render(<JobListingCard job={minimalJob} />);
    expect(screen.getByText('Developer')).toBeInTheDocument();
    expect(screen.getByText('Beta Inc')).toBeInTheDocument();
    expect(screen.queryByText('Full-time')).not.toBeInTheDocument();
  });
});
