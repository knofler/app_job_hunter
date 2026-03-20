import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import JobCard from './JobCard';

// Mock the Badge and Button components
jest.mock('@/components/ui/Badge', () => {
  return function MockBadge({ children }: { children: React.ReactNode }) {
    return <span>{children}</span>;
  };
});

jest.mock('@/components/ui/Button', () => {
  return function MockButton({ children, ...props }: { children: React.ReactNode; [key: string]: unknown }) {
    return <button {...props}>{children}</button>;
  };
});

describe('JobCard', () => {
  const mockJob = {
    id: 'job-123',
    company: 'Tech Corp',
    location: 'San Francisco, CA',
    title: 'Senior Software Engineer',
    match_score: 95,
    employment_type: 'Full-time',
    salary_range: '$120k - $150k',
    posted_at: '2025-01-15T10:00:00Z',
  };

  it('renders job title', () => {
    render(<JobCard job={mockJob} />);
    expect(screen.getByText('Senior Software Engineer')).toBeInTheDocument();
  });

  it('renders company name', () => {
    render(<JobCard job={mockJob} />);
    expect(screen.getByText('Tech Corp')).toBeInTheDocument();
  });

  it('renders location', () => {
    render(<JobCard job={mockJob} />);
    expect(screen.getByText('San Francisco, CA')).toBeInTheDocument();
  });

  it('renders match score', () => {
    render(<JobCard job={mockJob} />);
    // Match score is rendered as a number in a ring with "match" label
    expect(screen.getByText('95')).toBeInTheDocument();
    expect(screen.getByText('match')).toBeInTheDocument();
  });

  it('renders employment type when provided', () => {
    render(<JobCard job={mockJob} />);
    expect(screen.getByText('Full-time')).toBeInTheDocument();
  });

  it('renders salary range when provided', () => {
    render(<JobCard job={mockJob} />);
    expect(screen.getByText('$120k - $150k')).toBeInTheDocument();
  });

  it('renders posted date when provided', () => {
    render(<JobCard job={mockJob} />);
    expect(screen.getByText(/Posted/)).toBeInTheDocument();
  });

  it('does not render optional fields when not provided', () => {
    const minimalJob = {
      id: 'job-456',
      company: 'Simple Corp',
      location: 'Austin, TX',
      title: 'Developer',
    };

    render(<JobCard job={minimalJob} />);
    expect(screen.getByText('Developer')).toBeInTheDocument();
    expect(screen.getByText('Simple Corp')).toBeInTheDocument();
    expect(screen.getByText('Austin, TX')).toBeInTheDocument();

    // Match score ring should not be shown when score is 0
    expect(screen.queryByText('match')).not.toBeInTheDocument();

    // Should not contain employment type, salary, or posted date
    expect(screen.queryByText('Full-time')).not.toBeInTheDocument();
    expect(screen.queryByText('$120k - $150k')).not.toBeInTheDocument();
    expect(screen.queryByText(/Posted/)).not.toBeInTheDocument();
  });

  it('rounds match score to nearest integer', () => {
    const jobWithDecimalScore = {
      ...mockJob,
      match_score: 87.6,
    };

    render(<JobCard job={jobWithDecimalScore} />);
    expect(screen.getByText('88')).toBeInTheDocument();
  });

  it('does not show match ring when match score is zero', () => {
    const jobWithZeroScore = {
      ...mockJob,
      match_score: 0,
    };

    render(<JobCard job={jobWithZeroScore} />);
    // The ring is not rendered when matchScore is 0 (due to matchScore > 0 check)
    expect(screen.queryByText('match')).not.toBeInTheDocument();
  });
});
