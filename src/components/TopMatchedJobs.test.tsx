import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import TopMatchedJobs from './TopMatchedJobs';
import { PersonaProvider } from '@/context/PersonaContext';

// Mock the persona context
jest.mock('@/context/PersonaContext', () => ({
  PersonaProvider: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  useCandidateScope: jest.fn(),
}));

// Mock the API module
jest.mock('@/lib/api', () => ({
  fetchFromApi: jest.fn(),
}));

// Mock the fallback data
jest.mock('@/lib/fallback-data', () => ({
  fallbackTopMatches: [
    {
      id: 'job-1',
      title: 'Software Engineer',
      company: 'Tech Corp',
      location: 'San Francisco, CA',
      match_score: 95,
    },
    {
      id: 'job-2',
      title: 'Frontend Developer',
      company: 'Web Inc',
      location: 'New York, NY',
      match_score: 88,
    },
  ],
}));

describe('TopMatchedJobs', () => {
  const mockFetchFromApi = require('@/lib/api').fetchFromApi;
  const mockUseCandidateScope = require('@/context/PersonaContext').useCandidateScope;

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseCandidateScope.mockReturnValue({ candidateId: null });
  });

  const renderTopMatchedJobs = () => {
    return render(<TopMatchedJobs />);
  };

  it('renders the component title', () => {
    renderTopMatchedJobs();
    expect(screen.getByText('Top Matched Jobs')).toBeInTheDocument();
  });

  it('shows fallback message when no candidate ID is available', () => {
    renderTopMatchedJobs();
    expect(screen.getByText('Switch to the candidate persona to see personalised job matches.')).toBeInTheDocument();
  });

  it('shows loading state initially when candidate ID is available', () => {
    mockUseCandidateScope.mockReturnValue({ candidateId: 'candidate-123' });

    renderTopMatchedJobs();
    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  it('renders job matches when API call succeeds', async () => {
    const mockJobs = [
      {
        id: 'job-1',
        title: 'Senior Software Engineer',
        company: 'Tech Corp',
        location: 'San Francisco, CA',
        match_score: 95,
      },
    ];

    mockFetchFromApi.mockResolvedValue({ jobs: mockJobs });
    mockUseCandidateScope.mockReturnValue({ candidateId: 'candidate-123' });

    renderTopMatchedJobs();

    // Wait for the API call to resolve
    await screen.findByText('Senior Software Engineer');

    expect(screen.getByText('Senior Software Engineer')).toBeInTheDocument();
    expect(screen.getByText('Tech Corp • San Francisco, CA')).toBeInTheDocument();
    expect(screen.getByText('95% Match')).toBeInTheDocument();
  });

  it('falls back to cached data when API call fails', async () => {
    mockFetchFromApi.mockRejectedValue(new Error('API Error'));
    mockUseCandidateScope.mockReturnValue({ candidateId: 'candidate-123' });

    renderTopMatchedJobs();

    // Wait for fallback data to be shown
    await screen.findByText('Software Engineer');

    expect(screen.getByText('Software Engineer')).toBeInTheDocument();
    expect(screen.getByText('Tech Corp • San Francisco, CA')).toBeInTheDocument();
    expect(screen.getByText('Showing cached matches while the API is unavailable.')).toBeInTheDocument();
  });

  it('shows no matches message when jobs array is empty', async () => {
    mockUseCandidateScope.mockReturnValue({ candidateId: 'candidate-123' });
    mockFetchFromApi.mockResolvedValue({ jobs: [] });

    renderTopMatchedJobs();

    await screen.findByText('No matches yet. Keep refining your profile!');
    expect(screen.getByText('No matches yet. Keep refining your profile!')).toBeInTheDocument();
  });
});