import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  // Derive base URL from the incoming request — works for prod, preview, and local
  const baseUrl = new URL(request.url).origin;
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
