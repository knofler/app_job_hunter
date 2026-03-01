import { getAccessToken, withApiAuthRequired } from '@auth0/nextjs-auth0';
import { NextResponse } from 'next/server';

export const GET = withApiAuthRequired(async function GET() {
  try {
    const { accessToken } = await getAccessToken();
    const backendUrl = process.env.NEXT_PUBLIC_API_URL_INTERNAL || 
                       process.env.NEXT_PUBLIC_API_URL_LOCAL || 
                       'http://localhost:8010';

    const response = await fetch(`${backendUrl}/api/me`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      return NextResponse.json({ error: errorText }, { status: response.status });
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Proxy /api/me error:', error);
    return NextResponse.json({ error: 'Failed to fetch user details from backend' }, { status: 500 });
  }
});
