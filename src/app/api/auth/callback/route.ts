import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  const error = searchParams.get('error');

  if (error) {
    console.error('Auth0 callback error:', error);
    return NextResponse.redirect(new URL('/', request.url));
  }

  if (!code) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  try {
    // Exchange authorization code for tokens
    const tokenResponse = await fetch(`https://${process.env.AUTH0_ISSUER_BASE_URL?.replace('https://', '')}/oauth/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        grant_type: 'authorization_code',
        client_id: process.env.AUTH0_CLIENT_ID,
        client_secret: process.env.AUTH0_CLIENT_SECRET,
        code: code,
        redirect_uri: (() => {
          let baseUrl = process.env.AUTH0_BASE_URL || 'http://localhost:3000';
          if (!baseUrl.startsWith('http')) {
            baseUrl = `https://${baseUrl}`;
          }
          return `${baseUrl}/api/auth/callback`;
        })(),
      }),
    });

    if (!tokenResponse.ok) {
      throw new Error('Failed to exchange code for tokens');
    }

    const tokens = await tokenResponse.json();

    // Get user info
    const userResponse = await fetch(`https://${process.env.AUTH0_ISSUER_BASE_URL?.replace('https://', '')}/userinfo`, {
      headers: {
        'Authorization': `Bearer ${tokens.access_token}`,
      },
    });

    if (!userResponse.ok) {
      throw new Error('Failed to get user info');
    }

    const user = await userResponse.json();

    // Create response with redirect to dashboard
    const response = NextResponse.redirect(new URL('/dashboard', request.url));

    // Set session cookies (simplified - in production you'd use proper session management)
    response.cookies.set('auth-token', tokens.access_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: tokens.expires_in,
    });

    response.cookies.set('user-info', JSON.stringify(user), {
      httpOnly: false, // Client needs to read this
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 days
    });

    return response;
  } catch (error) {
    console.error('Auth callback error:', error);
    return NextResponse.redirect(new URL('/', request.url));
  }
}