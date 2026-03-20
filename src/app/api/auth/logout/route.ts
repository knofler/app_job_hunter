import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  let baseUrl = process.env.AUTH0_BASE_URL || 'http://localhost:3010';
  if (process.env.VERCEL_ENV === 'preview' && process.env.VERCEL_URL) {
    baseUrl = `https://${process.env.VERCEL_URL}`;
  }
  const auth0Domain = process.env.AUTH0_ISSUER_BASE_URL;
  const clientId = process.env.AUTH0_CLIENT_ID;

  // Build Auth0 logout URL to clear the Auth0 session as well
  const returnTo = encodeURIComponent(`${baseUrl}/`);
  const auth0LogoutUrl = auth0Domain && clientId
    ? `${auth0Domain}/v2/logout?client_id=${clientId}&returnTo=${returnTo}`
    : `${baseUrl}/`;

  const response = NextResponse.redirect(auth0LogoutUrl);

  // Clear local auth cookies
  response.cookies.set('auth-token', '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 0,
    path: '/',
  });

  response.cookies.set('user-info', '', {
    httpOnly: false,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 0,
    path: '/',
  });

  return response;
}
