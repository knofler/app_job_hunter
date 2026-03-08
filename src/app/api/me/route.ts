import { getAccessToken, withApiAuthRequired } from '@auth0/nextjs-auth0';
import { NextResponse } from 'next/server';

export const GET = withApiAuthRequired(async function GET() {
  try {
    const { accessToken } = await getAccessToken();

    if (!accessToken) {
      console.error('Proxy /api/me: getAccessToken() returned no token');
      return NextResponse.json({ error: 'No access token available' }, { status: 401 });
    }

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
      console.error(`Proxy /api/me: backend returned ${response.status}: ${errorText}`);
      return NextResponse.json({ error: errorText }, { status: response.status });
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Proxy /api/me error:', error);
    return NextResponse.json({ error: 'Failed to fetch user details from backend' }, { status: 500 });
  }
});
