/**
 * Tests for src/lib/auth.ts
 * Covers: getSession function
 */

import { getSession } from './auth';

// Minimal mock for NextRequest
function createMockRequest(cookies: Record<string, string> = {}): any {
  return {
    cookies: {
      get(name: string) {
        const value = cookies[name];
        return value ? { value } : undefined;
      },
    },
  };
}

describe('getSession', () => {
  it('returns session with accessToken when auth-token cookie exists', async () => {
    const request = createMockRequest({ 'auth-token': 'my-token-123' });
    const session = await getSession(request);
    expect(session).toEqual({ accessToken: 'my-token-123' });
  });

  it('returns null when auth-token cookie is missing', async () => {
    const request = createMockRequest({});
    const session = await getSession(request);
    expect(session).toBeNull();
  });

  it('returns null when auth-token cookie value is empty', async () => {
    const request = createMockRequest({ 'auth-token': '' });
    const session = await getSession(request);
    expect(session).toBeNull();
  });

  it('returns null when cookies.get throws an error', async () => {
    jest.spyOn(console, 'error').mockImplementation(() => {});
    const request = {
      cookies: {
        get() { throw new Error('Cookie error'); },
      },
    };
    const session = await getSession(request as any);
    expect(session).toBeNull();
  });
});
