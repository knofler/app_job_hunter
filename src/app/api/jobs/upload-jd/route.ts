import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    // For debugging - always use admin token
    const adminToken = process.env.NEXT_PUBLIC_ADMIN_TOKEN;
    if (!adminToken) {
      return NextResponse.json({ error: 'Admin token not configured' }, { status: 500 });
    }

    const formData = await request.formData();

    // Forward to backend API
    const backendUrl = process.env.NEXT_PUBLIC_API_URL_INTERNAL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8010';
    const headers: Record<string, string> = {
      'X-Admin-Token': adminToken,
    };

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