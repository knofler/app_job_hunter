import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const adminToken = process.env.ADMIN_API_KEY || process.env.NEXT_PUBLIC_ADMIN_TOKEN;
    const backendUrl = process.env.NEXT_PUBLIC_API_URL_INTERNAL || 'http://backend:8010';

    const formData = await request.formData();

    const headers: Record<string, string> = {};
    if (adminToken) headers['X-Admin-Token'] = adminToken;

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
    console.error('[upload-jd proxy] error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}