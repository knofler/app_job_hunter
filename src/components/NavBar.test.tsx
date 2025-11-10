import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { UserProvider } from '@auth0/nextjs-auth0/client';
import { useRouter, usePathname } from 'next/navigation';
import NavBar from './NavBar';

// Mock Next.js navigation hooks
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
  usePathname: jest.fn(),
}));

// Mock Auth0 hook
jest.mock('@auth0/nextjs-auth0/client', () => ({
  useUser: jest.fn(),
  UserProvider: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

// Mock PersonaContext
jest.mock('@/context/PersonaContext', () => ({
  usePersona: jest.fn(),
  PersonaProvider: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

const mockUseRouter = useRouter as jest.MockedFunction<typeof useRouter>;
const mockUsePathname = usePathname as jest.MockedFunction<typeof usePathname>;
const mockUsePersona = require('@/context/PersonaContext').usePersona;

describe('NavBar', () => {
  const mockRouter = {
    push: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseRouter.mockReturnValue(mockRouter);
    mockUsePathname.mockReturnValue('/dashboard');
  });

  const renderNavBar = (user = null, isLoading = false, persona = 'candidate') => {
    const mockUseUser = require('@auth0/nextjs-auth0/client').useUser;
    mockUseUser.mockReturnValue({ user, isLoading });

    mockUsePersona.mockReturnValue({
      persona,
      setPersona: jest.fn(),
    });

    return render(
      <UserProvider>
        <NavBar />
      </UserProvider>
    );
  };

  it('renders the app title', () => {
    renderNavBar();
    expect(screen.getByText('AI Job Hunter')).toBeInTheDocument();
  });

  it('renders candidate navigation items when persona is candidate', () => {
    renderNavBar();
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
    expect(screen.getByText('Jobs')).toBeInTheDocument();
    expect(screen.getByText('My Jobs')).toBeInTheDocument();
    expect(screen.getByText('Resumes')).toBeInTheDocument();
    expect(screen.getByText('Candidates')).toBeInTheDocument();
    expect(screen.getByText('Recruiters')).toBeInTheDocument();
  });

  it('renders recruiter navigation items when persona is recruiter', () => {
    renderNavBar(null, false, 'recruiter');
    expect(screen.getByText('Recruiter Dashboard')).toBeInTheDocument();
    expect(screen.getByText('Upload JD')).toBeInTheDocument();
    expect(screen.getByText('Recruiter AI')).toBeInTheDocument();
  });

  it('renders admin navigation items when persona is admin', () => {
    renderNavBar(null, false, 'admin');
    expect(screen.getByText('LLM Settings')).toBeInTheDocument();
    expect(screen.getByText('AI Prompts')).toBeInTheDocument();
  });

  it('shows login and signup buttons when user is not authenticated', () => {
    renderNavBar(null);
    expect(screen.getByText('Login')).toBeInTheDocument();
    expect(screen.getByText('Sign Up')).toBeInTheDocument();
  });

  it('shows user profile and logout when authenticated', () => {
    const mockUser = { name: 'John Doe', email: 'john@example.com' };
    renderNavBar(mockUser);
    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('Logout')).toBeInTheDocument();
  });

  it('shows loading state when user is loading', () => {
    renderNavBar(null, true);
    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  it('changes persona and navigates when persona select changes', () => {
    const mockSetPersona = jest.fn();
    const mockUseUser = require('@auth0/nextjs-auth0/client').useUser;
    mockUseUser.mockReturnValue({ user: null, isLoading: false });

    mockUsePersona.mockReturnValue({
      persona: 'candidate',
      setPersona: mockSetPersona,
    });

    render(
      <UserProvider>
        <NavBar />
      </UserProvider>
    );

    const select = screen.getByRole('combobox');
    fireEvent.change(select, { target: { value: 'recruiter' } });

    expect(mockSetPersona).toHaveBeenCalledWith('recruiter');
    expect(mockRouter.push).toHaveBeenCalledWith('/recruiters/dashboard');
  });

  it('highlights active navigation item', () => {
    mockUsePathname.mockReturnValue('/jobs');
    renderNavBar();

    const jobsLink = screen.getByText('Jobs');
    expect(jobsLink).toHaveClass('text-blue-700', 'font-semibold');
  });
});