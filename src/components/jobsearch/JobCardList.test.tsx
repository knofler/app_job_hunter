import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import JobCardList from './JobCardList';
import { PersonaProvider, useCandidateScope } from '@/context/PersonaContext';
import { fetchFromApi } from '@/lib/api';
import type { JobFilters } from './JobSearchFilters';

// Mock the API module
jest.mock('@/lib/api', () => ({
  fetchFromApi: jest.fn(),
}));

// Mock the fallback data
jest.mock('@/lib/fallback-data', () => ({
  fallbackJobs: [
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

// Mock the PersonaContext
jest.mock('@/context/PersonaContext', () => ({
  useCandidateScope: jest.fn(),
  PersonaProvider: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

// Mock Badge and Button components
jest.mock('@/components/ui/Badge', () => {
  return function MockBadge({ children }: { children: React.ReactNode }) {
    return <span>{children}</span>;
  };
});

jest.mock('@/components/ui/Button', () => {
  return function MockButton({ children, ...props }: { children: React.ReactNode; [key: string]: unknown }) {
    return <button>{children}</button>;
  };
});

// Mock JobListingCard
jest.mock('./JobListingCard', () => {
  return function MockJobListingCard({ job }: { job: { title: string } }) {
    return <div>{job.title}</div>;
  };
});

// Mock IntersectionObserver
global.IntersectionObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  disconnect: jest.fn(),
  unobserve: jest.fn(),
}));

const mockUseCandidateScope = useCandidateScope as jest.Mock;
const mockFetchFromApi = fetchFromApi as jest.MockedFunction<typeof fetchFromApi>;

describe('JobCardList', () => {
  const defaultFilters: JobFilters = {
    search: '',
    hideApplied: false,
    sort: 'match',
    locationType: [],
    jobType: [],
    experience: 'any',
    skills: [],
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseCandidateScope.mockReturnValue({ candidateId: null });
  });

  const renderJobCardList = (filters = defaultFilters) => {
    return render(
      <PersonaProvider>
        <JobCardList filters={filters} />
      </PersonaProvider>
    );
  };

  it('shows persona switch message when no candidate ID is available', () => {
    renderJobCardList();
    expect(screen.getByText('Switch to the candidate persona to see personalised job results.')).toBeInTheDocument();
  });

  it('renders jobs when API call succeeds', async () => {
    const mockJobs = [
      {
        id: 'job-1',
        title: 'Senior Software Engineer',
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
    ];

    mockFetchFromApi.mockResolvedValue({
      items: mockJobs,
      total: 2,
      page: 1,
      page_size: 10,
    });
    mockUseCandidateScope.mockReturnValue({ candidateId: 'candidate-123' });

    renderJobCardList();

    await waitFor(() => {
      expect(screen.getByText('Senior Software Engineer')).toBeInTheDocument();
    });

    expect(screen.getByText('Tech Corp')).toBeInTheDocument();
    expect(screen.getByText('Frontend Developer')).toBeInTheDocument();
    expect(screen.getByText('Web Inc')).toBeInTheDocument();
  });

  it('falls back to cached jobs when API call fails', async () => {
    mockFetchFromApi.mockRejectedValue(new Error('API Error'));
    mockUseCandidateScope.mockReturnValue({ candidateId: 'candidate-123' });

    renderJobCardList();

    await waitFor(() => {
      expect(screen.getByText('Software Engineer')).toBeInTheDocument();
    });

    expect(screen.getByText('Tech Corp')).toBeInTheDocument();
    expect(screen.getByText('Showing cached results')).toBeInTheDocument();
  });

  it('shows no jobs found message when jobs array is empty', async () => {
    mockFetchFromApi.mockResolvedValue({
      items: [],
      total: 0,
      page: 1,
      page_size: 10,
    });
    mockUseCandidateScope.mockReturnValue({ candidateId: 'candidate-123' });

    renderJobCardList();

    await waitFor(() => {
      expect(screen.getByText('No jobs found. Try adjusting your filters.')).toBeInTheDocument();
    });
  });

  it('includes search parameter in API call when search filter is provided', async () => {
    const filtersWithSearch = { ...defaultFilters, search: 'react' };
    mockFetchFromApi.mockResolvedValue({
      items: [],
      total: 0,
      page: 1,
      page_size: 10,
    });
    mockUseCandidateScope.mockReturnValue({ candidateId: 'candidate-123' });

    renderJobCardList(filtersWithSearch);

    await waitFor(() => {
      expect(mockFetchFromApi).toHaveBeenCalledWith(
        expect.stringContaining('search=react')
      );
    });
  });

  it('includes exclude_applied parameter when hideApplied filter is true', async () => {
    const filtersWithHideApplied = { ...defaultFilters, hideApplied: true };
    mockFetchFromApi.mockResolvedValue({
      items: [],
      total: 0,
      page: 1,
      page_size: 10,
    });
    mockUseCandidateScope.mockReturnValue({ candidateId: 'candidate-123' });

    renderJobCardList(filtersWithHideApplied);

    await waitFor(() => {
      expect(mockFetchFromApi).toHaveBeenCalledWith(
        expect.stringContaining('exclude_applied=true')
      );
    });
  });
});
