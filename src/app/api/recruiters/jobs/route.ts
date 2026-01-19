import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    // For debugging - always use admin token
    const adminToken = process.env.NEXT_PUBLIC_ADMIN_TOKEN;
    if (!adminToken) {
      return NextResponse.json({ error: 'Admin token not configured' }, { status: 500 });
    }

    const { searchParams } = new URL(request.url);
    const page = searchParams.get('page') || '1';
    const pageSize = searchParams.get('page_size') || '10';

    // Forward to backend API - use /recruiters/jobs to get jobs for the authenticated recruiter
    const backendUrl = process.env.NEXT_PUBLIC_API_URL_INTERNAL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8010';

    const response = await fetch(`${backendUrl}/recruiters/jobs?page=${page}&page_size=${pageSize}`, {
      headers: {
        'X-Admin-Token': adminToken,
      },
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