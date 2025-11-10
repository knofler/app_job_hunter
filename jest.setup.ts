import '@testing-library/jest-dom';

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter() {
    return {
      push: jest.fn(),
      replace: jest.fn(),
      prefetch: jest.fn(),
    };
  },
  useSearchParams() {
    return new URLSearchParams();
  },
  usePathname() {
    return '';
  },
}));

// Mock environment variables
process.env.NEXT_PUBLIC_API_BASE_URL = 'http://localhost:8010';
process.env.NEXT_PUBLIC_AUTH0_DOMAIN = 'test.auth0.com';
process.env.NEXT_PUBLIC_AUTH0_CLIENT_ID = 'test-client-id';
process.env.NEXT_PUBLIC_AUTH0_AUDIENCE = 'test-audience';