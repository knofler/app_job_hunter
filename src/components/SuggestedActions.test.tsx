import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import SuggestedActions from './SuggestedActions';
import { useCandidateScope } from '@/context/PersonaContext';
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
  fallbackSuggestedActions: [
    {
      id: 'action-1',
      text: 'Update your LinkedIn profile with recent projects',
      priority: 'High',
      category: 'Networking',
    },
    {
      id: 'action-2',
      text: 'Tailor your resume for software engineering roles',
      priority: 'Medium',
      category: 'Resume',
    },
  ],
}));

describe('SuggestedActions', () => {
  const mockFetchFromApi = jest.fn();
  const mockUseCandidateScope = useCandidateScope as jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseCandidateScope.mockReturnValue({ candidateId: null });
  });

  const renderSuggestedActions = () => {
    return render(<SuggestedActions />);
  };

  it('renders the component title', () => {
    renderSuggestedActions();
    expect(screen.getByText('Top AI-Suggested Actions')).toBeInTheDocument();
  });

  it('shows fallback message when no candidate ID is available', () => {
    renderSuggestedActions();
    expect(screen.getByText('Switch to the candidate persona to see personalised actions.')).toBeInTheDocument();
  });

  it('shows loading state initially when candidate ID is available', () => {
    mockUseCandidateScope.mockReturnValue({ candidateId: 'candidate-123' });
    renderSuggestedActions();
    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  it('renders suggested actions when API call succeeds', async () => {
    const mockActions = [
      {
        id: 'action-1',
        text: 'Complete your portfolio website',
        priority: 'High',
        category: 'Career Development',
      },
      {
        id: 'action-2',
        text: 'Network with 3 professionals this week',
        priority: 'Medium',
        category: 'Networking',
      },
    ];

    mockUseCandidateScope.mockReturnValue({ candidateId: 'candidate-123' });
    mockFetchFromApi.mockResolvedValue({ actions: mockActions });

    renderSuggestedActions();

    // Wait for the API call to resolve
    await screen.findByText('Complete your portfolio website');

    expect(screen.getByText('Complete your portfolio website')).toBeInTheDocument();
    expect(screen.getByText('Network with 3 professionals this week')).toBeInTheDocument();
    expect(screen.getByText('High • Career Development')).toBeInTheDocument();
    expect(screen.getByText('Medium • Networking')).toBeInTheDocument();
  });

  it('falls back to cached data when API call fails', async () => {
    mockUseCandidateScope.mockReturnValue({ candidateId: 'candidate-123' });
    mockFetchFromApi.mockRejectedValue(new Error('API Error'));

    renderSuggestedActions();

    // Wait for fallback data to be shown
    await screen.findByText('Update your LinkedIn profile with recent projects');

    expect(screen.getByText('Update your LinkedIn profile with recent projects')).toBeInTheDocument();
    expect(screen.getByText('Tailor your resume for software engineering roles')).toBeInTheDocument();
    expect(screen.getByText('Showing cached actions while the API is unavailable.')).toBeInTheDocument();
  });

  it('renders actions without priority and category metadata', async () => {
    const mockActions = [
      {
        id: 'action-1',
        text: 'Apply to 5 new positions',
      },
    ];

    mockUseCandidateScope.mockReturnValue({ candidateId: 'candidate-123' });
    mockFetchFromApi.mockResolvedValue({ actions: mockActions });

    renderSuggestedActions();

    await screen.findByText('Apply to 5 new positions');

    expect(screen.getByText('Apply to 5 new positions')).toBeInTheDocument();
    // Should not show metadata span
    expect(screen.queryByText(/•/)).not.toBeInTheDocument();
  });
});