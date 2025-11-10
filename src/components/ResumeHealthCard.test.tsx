import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import ResumeHealthCard from './ResumeHealthCard';
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
  fallbackResumeHealth: {
    score: 85,
    sub_scores: [
      { label: 'Content', value: 90 },
      { label: 'Format', value: 80 },
      { label: 'Keywords', value: 85 },
    ],
  },
}));

describe('ResumeHealthCard', () => {
  const mockFetchFromApi = require('@/lib/api').fetchFromApi;
  const mockUseCandidateScope = require('@/context/PersonaContext').useCandidateScope;

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseCandidateScope.mockReturnValue({ candidateId: null });
  });

  const renderResumeHealthCard = () => {
    return render(<ResumeHealthCard />);
  };

  it('shows fallback message when no candidate ID is available', () => {
    renderResumeHealthCard();
    expect(screen.getByText('Switch to the candidate persona to view resume health.')).toBeInTheDocument();
  });

  it('shows loading state initially when candidate ID is available', () => {
    mockUseCandidateScope.mockReturnValue({ candidateId: 'candidate-123' });
    renderResumeHealthCard();
    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  it('renders resume health score and sub-scores when API call succeeds', async () => {
    mockUseCandidateScope.mockReturnValue({ candidateId: 'candidate-123' });
    const mockResponse = {
      score: 92,
      sub_scores: [
        { label: 'Content Quality', value: 95 },
        { label: 'ATS Compatibility', value: 90 },
        { label: 'Keyword Optimization', value: 91 },
      ],
    };

    mockFetchFromApi.mockResolvedValue(mockResponse);

    renderResumeHealthCard();

    // Wait for the API call to resolve
    await screen.findByText('92/100');

    expect(screen.getByText('92/100')).toBeInTheDocument();
    expect(screen.getByText('Resume Health')).toBeInTheDocument();
    expect(screen.getByText('95')).toBeInTheDocument();
    expect(screen.getByText('Content Quality')).toBeInTheDocument();
    expect(screen.getByText('90')).toBeInTheDocument();
    expect(screen.getByText('ATS Compatibility')).toBeInTheDocument();
    expect(screen.getByText('91')).toBeInTheDocument();
    expect(screen.getByText('Keyword Optimization')).toBeInTheDocument();
  });

  it('falls back to cached data when API call fails', async () => {
    mockUseCandidateScope.mockReturnValue({ candidateId: 'candidate-123' });
    mockFetchFromApi.mockRejectedValue(new Error('API Error'));

    renderResumeHealthCard();

    await screen.findByText('85/100');

    expect(screen.getByText('85/100')).toBeInTheDocument();
    expect(screen.getByText('90')).toBeInTheDocument();
    expect(screen.getByText('Content')).toBeInTheDocument();
    expect(screen.getByText('Showing cached data while the API is unavailable.')).toBeInTheDocument();
  });

  it('handles empty sub-scores array', async () => {
    mockUseCandidateScope.mockReturnValue({ candidateId: 'candidate-123' });
    const mockResponse = {
      score: 75,
      sub_scores: [],
    };

    mockFetchFromApi.mockResolvedValue(mockResponse);

    renderResumeHealthCard();

    await screen.findByText('75/100');

    expect(screen.getByText('75/100')).toBeInTheDocument();
    expect(screen.getByText('Resume Health')).toBeInTheDocument();
    // Should not have any sub-score elements
    expect(screen.queryByText('Content')).not.toBeInTheDocument();
  });
});