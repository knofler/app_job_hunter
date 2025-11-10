/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-require-imports */
/// <reference types="jest" />
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import ApplicationPipeline from './ApplicationPipeline';
import { useCandidateScope } from '@/context/PersonaContext';

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
  fallbackPipelineCounts: {
    'Draft': 2,
    'Saved': 3,
    'Applied': 5,
    'Shortlisted': 1,
    'Interview Round 1': 2,
    'Offer': 1,
    'Rejected': 4,
  },
}));

describe('ApplicationPipeline', () => {
  const mockUseCandidateScope = useCandidateScope as jest.Mock;
  const mockFetchFromApi = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseCandidateScope.mockReturnValue({ candidateId: null });
    // @ts-expect-error
    global.fetchFromApi = mockFetchFromApi;
  });

  const renderApplicationPipeline = () => {
    return render(<ApplicationPipeline />);
  };

  it('renders the component title', () => {
    renderApplicationPipeline();
    expect(screen.getByText('Application Pipeline')).toBeInTheDocument();
  });

  it('shows fallback message when no candidate ID is available', () => {
    renderApplicationPipeline();
    expect(screen.getByText('Switch to the candidate persona to review your applications.')).toBeInTheDocument();
  });

  it('shows loading state initially when candidate ID is available', () => {
    mockUseCandidateScope.mockReturnValue({ candidateId: 'candidate-123' });
    renderApplicationPipeline();
    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  it('renders pipeline stages with correct counts when API call succeeds', async () => {
    mockUseCandidateScope.mockReturnValue({ candidateId: 'candidate-123' });
    const mockPipeline = {
      'Draft': 1,
      'Saved': 2,
      'Applied': 8,
      'Shortlisted': 3,
      'Interview Round 1': 1,
      'Interview Round 2': 1,
      'Offer': 2,
      'Rejected': 6,
    };

    mockFetchFromApi.mockResolvedValue({ pipeline: mockPipeline });

    renderApplicationPipeline();

    // Wait for the API call to resolve
    await screen.findByText('Saved Jobs');

    // Check pipeline stage labels
    expect(screen.getByText('Saved Jobs')).toBeInTheDocument();
    expect(screen.getByText('Applied')).toBeInTheDocument();
    expect(screen.getByText('Interviewing')).toBeInTheDocument();
    expect(screen.getByText('Offer')).toBeInTheDocument();
    expect(screen.getByText('Other')).toBeInTheDocument();

    // Check counts (Saved Jobs = Draft + Saved = 1 + 2 = 3)
    expect(screen.getByText('3 jobs')).toBeInTheDocument();
    expect(screen.getByText('8 jobs')).toBeInTheDocument();
    expect(screen.getByText('5 jobs')).toBeInTheDocument(); // Interviewing = Shortlisted + Interview Round 1 + Interview Round 2 = 3 + 1 + 1 = 5
    expect(screen.getByText('2 jobs')).toBeInTheDocument(); // Offer
    expect(screen.getByText('6 jobs')).toBeInTheDocument(); // Other = Rejected
  });

  it('falls back to cached data when API call fails', async () => {
    mockUseCandidateScope.mockReturnValue({ candidateId: 'candidate-123' });
    mockFetchFromApi.mockRejectedValue(new Error('API Error'));

    renderApplicationPipeline();

    await screen.findByText('Saved Jobs');

    expect(screen.getAllByText('5 jobs')).toHaveLength(2); // Saved Jobs and Applied both have 5 jobs
    expect(screen.getByText('Showing cached pipeline while the API is unavailable.')).toBeInTheDocument();
  });

  it('handles singular job count correctly', async () => {
    mockUseCandidateScope.mockReturnValue({ candidateId: 'candidate-123' });
    const mockPipeline = {
      'Offer': 1,
    };

    mockFetchFromApi.mockResolvedValue({ pipeline: mockPipeline });

    renderApplicationPipeline();

    await screen.findByText('1 job');
    expect(screen.getByText('1 job')).toBeInTheDocument();
  });

  it('does not show Other section when no untracked statuses exist', async () => {
    mockUseCandidateScope.mockReturnValue({ candidateId: 'candidate-123' });
    const mockPipeline = {
      'Draft': 1,
      'Applied': 2,
      'Shortlisted': 1,
    };

    mockFetchFromApi.mockResolvedValue({ pipeline: mockPipeline });

    renderApplicationPipeline();

    await screen.findByText('Saved Jobs');

    expect(screen.queryByText('Other')).not.toBeInTheDocument();
  });
});