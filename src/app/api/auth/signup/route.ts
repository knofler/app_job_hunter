import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  // Redirect to Auth0 signup
  const auth0Domain = process.env.AUTH0_ISSUER_BASE_URL?.replace('https://', '') || 'your-domain.auth0.com';
  const clientId = process.env.AUTH0_CLIENT_ID || '';
  const audience = process.env.AUTH0_AUDIENCE || 'https://ai-job-hunter-api';
  let baseUrl = process.env.AUTH0_BASE_URL || 'http://localhost:3000';

  // Ensure baseUrl has protocol for production
  if (!baseUrl.startsWith('http')) {
    baseUrl = `https://${baseUrl}`;
  }

  const signupUrl = `https://${auth0Domain}/authorize?` +
    new URLSearchParams({
      client_id: clientId,
      redirect_uri: `${baseUrl}/api/auth/callback`,
      response_type: 'code',
      scope: 'openid profile email',
      audience: audience,
      screen_hint: 'signup', // This tells Auth0 to show the signup screen
    });

  return NextResponse.redirect(signupUrl);
}