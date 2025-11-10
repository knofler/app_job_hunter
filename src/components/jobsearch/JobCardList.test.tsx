// @ts-nocheck
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-require-imports */
import { PersonaProvider } from '@/context/PersonaContext';

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

// Mock IntersectionObserver
global.IntersectionObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  disconnect: jest.fn(),
  unobserve: jest.fn(),
}));

const mockUseCandidateScope = require('@/context/PersonaContext').useCandidateScope;
const mockFetchFromApi = require('@/lib/api').fetchFromApi;

describe('JobCardList', () => {
  const defaultFilters = {
    search: '',
    hideApplied: false,
    sort: 'match' as const,
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

  it('shows loading state initially when candidate ID is available', () => {
    mockUseCandidateScope.mockReturnValue({ candidateId: 'candidate-123' });
    renderJobCardList();
    expect(screen.getByText('Loading jobs...')).toBeInTheDocument();
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

    expect(screen.getByText('Tech Corp • San Francisco, CA')).toBeInTheDocument();
    expect(screen.getByText('Frontend Developer')).toBeInTheDocument();
    expect(screen.getByText('Web Inc • New York, NY')).toBeInTheDocument();
  });

  it('falls back to cached jobs when API call fails', async () => {
    mockFetchFromApi.mockRejectedValue(new Error('API Error'));
    mockUseCandidateScope.mockReturnValue({ candidateId: 'candidate-123' });

    renderJobCardList();

    await waitFor(() => {
      expect(screen.getByText('Software Engineer')).toBeInTheDocument();
    });

    expect(screen.getByText('Tech Corp • San Francisco, CA')).toBeInTheDocument();
    expect(screen.getByText('Showing cached job listings while the API is unavailable.')).toBeInTheDocument();
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

  it('sorts jobs by match score by default', async () => {
    const mockJobs = [
      { id: 'job-1', title: 'Job A', company: 'Company A', location: 'Location A', match_score: 80 },
      { id: 'job-2', title: 'Job B', company: 'Company B', location: 'Location B', match_score: 90 },
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
      expect(screen.getByText('Job B')).toBeInTheDocument();
    });

    const jobElements = screen.getAllByText(/Job [AB]/);
    expect(jobElements[0]).toHaveTextContent('Job B'); // Higher score first
    expect(jobElements[1]).toHaveTextContent('Job A');
  });

  it('sorts jobs by date when sort filter is date', async () => {
    const filtersWithDateSort = { ...defaultFilters, sort: 'date' as const };
    const mockJobs = [
      { id: 'job-1', title: 'Job A', company: 'Company A', location: 'Location A', posted_at: '2025-01-01T00:00:00Z' },
      { id: 'job-2', title: 'Job B', company: 'Company B', location: 'Location B', posted_at: '2025-01-02T00:00:00Z' },
    ];

    mockFetchFromApi.mockResolvedValue({
      items: mockJobs,
      total: 2,
      page: 1,
      page_size: 10,
    });
    mockUseCandidateScope.mockReturnValue({ candidateId: 'candidate-123' });

    renderJobCardList(filtersWithDateSort);

    await waitFor(() => {
      expect(screen.getByText('Job B')).toBeInTheDocument();
    });

    const jobElements = screen.getAllByText(/Job [AB]/);
    expect(jobElements[0]).toHaveTextContent('Job B'); // More recent first
    expect(jobElements[1]).toHaveTextContent('Job A');
  });

  it('shows end of list message when no more jobs available', async () => {
    mockFetchFromApi.mockResolvedValue({
      items: [{ id: 'job-1', title: 'Job 1', company: 'Company 1', location: 'Location 1' }],
      total: 1,
      page: 1,
      page_size: 10,
    });
    mockUseCandidateScope.mockReturnValue({ candidateId: 'candidate-123' });

    renderJobCardList();

    await waitFor(() => {
      expect(screen.getByText("You’ve reached the end of the job list.")).toBeInTheDocument();
    });
  });
});