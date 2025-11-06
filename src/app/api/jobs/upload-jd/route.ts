import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@auth0/nextjs-auth0/edge';

export async function POST(request: NextRequest) {
  try {
    // Try to get Auth0 session first
    let authHeader = '';
    try {
      const res = NextResponse.next();
      const session = await getSession(request, res);
      if (session?.accessToken) {
        authHeader = `Bearer ${session.accessToken}`;
      }
    } catch (error) {
      // Auth0 session not available, will try admin token
      console.log('Auth0 session not available:', error);
    }

    // Fallback to admin token if no Auth0 session
    if (!authHeader) {
      const adminToken = process.env.NEXT_PUBLIC_ADMIN_TOKEN;
      if (adminToken) {
        authHeader = `X-Admin-Token: ${adminToken}`;
      }
    }

    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await request.formData();

    // Forward to backend API
    const backendUrl = process.env.NEXT_PUBLIC_API_URL_INTERNAL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8010';
    const headers: Record<string, string> = {};

    if (authHeader.startsWith('Bearer ')) {
      headers['Authorization'] = authHeader;
    } else if (authHeader.startsWith('X-Admin-Token: ')) {
      headers['X-Admin-Token'] = authHeader.replace('X-Admin-Token: ', '');
    }

    const response = await fetch(`${backendUrl}/jobs/upload-jd`, {
      method: 'POST',
      headers,
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Backend API error' }));
      return NextResponse.json(errorData, { status: response.status });
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('API proxy error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}