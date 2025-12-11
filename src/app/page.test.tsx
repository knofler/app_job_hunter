import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { useUser } from '@/context/UserContext';
import Page from './page';

// Mock the useUser hook
jest.mock('@/context/UserContext', () => ({
  UserProvider: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  useUser: jest.fn(),
}));

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
  }),
}));

describe('Home Page', () => {
  const mockUseUser = useUser as jest.Mock;

  beforeEach(() => {
    mockUseUser.mockReturnValue({
      user: null,
      isLoading: false,
    });
  });

  it('renders the main heading', () => {
    render(<Page />);
    const heading = screen.getByRole('heading', { level: 1 });
    expect(heading).toBeInTheDocument();
  });

  it('renders without crashing', () => {
    const { container } = render(<Page />);
    expect(container).toBeInTheDocument();
  });
});