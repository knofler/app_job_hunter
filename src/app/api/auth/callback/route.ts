import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  const error = searchParams.get('error');
  const state = searchParams.get('state');

  console.log('Auth0 callback received:', { code: !!code, error, state });

  if (error) {
    console.error('Auth0 callback error:', error);
    const redirectUrl = process.env.AUTH0_BASE_URL || 'http://localhost:3010';
    return NextResponse.redirect(`${redirectUrl}/`);
  }

  if (!code) {
    console.error('No authorization code received');
    const redirectUrl = process.env.AUTH0_BASE_URL || 'http://localhost:3010';
    return NextResponse.redirect(`${redirectUrl}/`);
  }

  try {
    // Ensure base URL has protocol
    let baseUrl = process.env.AUTH0_BASE_URL || 'http://localhost:3000';
    if (!baseUrl.startsWith('http')) {
      baseUrl = `https://${baseUrl}`;
    }

    const redirectUri = `${baseUrl}/api/auth/callback`;
    console.log('Using redirect URI:', redirectUri);

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
        redirect_uri: redirectUri,
      }),
    });

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text();
      console.error('Token exchange failed:', tokenResponse.status, errorText);
      throw new Error(`Failed to exchange code for tokens: ${tokenResponse.status}`);
    }

    const tokens = await tokenResponse.json();
    console.log('Tokens received:', { access_token: !!tokens.access_token, id_token: !!tokens.id_token });

    // Try to decode ID token for custom claims (roles)
    let customClaims = {};
    try {
      if (tokens.id_token) {
        const idTokenParts = tokens.id_token.split('.');
        if (idTokenParts.length === 3) {
          // Use a more compatible base64 decoding
          const payload = idTokenParts[1].replace(/-/g, '+').replace(/_/g, '/');
          const decoded = JSON.parse(atob(payload));
          customClaims = decoded;
          console.log('ID token decoded successfully');
        }
      }
    } catch (decodeError) {
      console.warn('Failed to decode ID token:', decodeError);
    }

    // Get user info from /userinfo endpoint
    const userResponse = await fetch(`https://${process.env.AUTH0_ISSUER_BASE_URL?.replace('https://', '')}/userinfo`, {
      headers: {
        'Authorization': `Bearer ${tokens.access_token}`,
      },
    });

    if (!userResponse.ok) {
      console.error('Failed to get user info:', userResponse.status);
      throw new Error('Failed to get user info');
    }

    const userInfo = await userResponse.json();
    console.log('User info received:', { sub: userInfo.sub, email: userInfo.email });

    // Merge user info with custom claims
    const user = {
      ...userInfo,
      ...customClaims,
    };

    console.log('Final user object:', { sub: user.sub, email: user.email, roles: user['https://ai-job-hunter/roles'] });

    // Create response with redirect to dashboard
    const redirectUrl = process.env.AUTH0_BASE_URL || 'http://localhost:3010';
    const response = NextResponse.redirect(`${redirectUrl}/dashboard`);

    // Set session cookies
    response.cookies.set('auth-token', tokens.access_token, {
      httpOnly: true,
      secure: false, // Allow on localhost
      sameSite: 'lax',
      maxAge: tokens.expires_in || 86400, // 24 hours default
      path: '/',
    });

    response.cookies.set('user-info', JSON.stringify(user), {
      httpOnly: false, // Client needs to read this
      secure: false, // Allow on localhost
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: '/',
    });

    console.log('Authentication successful, redirecting to dashboard');
    return response;

  } catch (error) {
    console.error('Auth callback error:', error);
    // Redirect to home with error
    const redirectUrl = process.env.AUTH0_BASE_URL || 'http://localhost:3010';
    return NextResponse.redirect(`${redirectUrl}/`);
  }
}