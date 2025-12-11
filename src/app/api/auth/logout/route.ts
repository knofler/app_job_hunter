import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  // Redirect to Auth0 logout
  const auth0Domain = process.env.AUTH0_ISSUER_BASE_URL?.replace('https://', '') || 'your-domain.auth0.com';
  const baseUrl = process.env.AUTH0_BASE_URL || 'http://localhost:3000';

  const logoutUrl = `https://${auth0Domain}/v2/logout?` +
    new URLSearchParams({
      client_id: process.env.AUTH0_CLIENT_ID || '',
      returnTo: baseUrl,
    });

  return NextResponse.redirect(logoutUrl);
}