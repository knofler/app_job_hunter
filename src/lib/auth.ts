import { NextRequest } from 'next/server';

export interface Session {
  accessToken?: string;
  user?: any;
}

export async function getSession(request: NextRequest): Promise<Session | null> {
  try {
    // Get auth token from cookies
    const authTokenCookie = request.cookies.get('auth-token');
    if (!authTokenCookie?.value) {
      return null;
    }

    return {
      accessToken: authTokenCookie.value,
    };
  } catch (error) {
    console.error('Failed to get session:', error);
    return null;
  }
}