import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  // Create response that clears cookies and redirects to home
  const baseUrl = process.env.AUTH0_BASE_URL || 'http://localhost:3010';
  const response = NextResponse.redirect(`${baseUrl}/`);

  // Clear the auth cookies
  response.cookies.set('auth-token', '', {
    httpOnly: true,
    secure: false,
    sameSite: 'lax',
    maxAge: 0, // Expire immediately
    path: '/',
  });

  response.cookies.set('user-info', '', {
    httpOnly: false,
    secure: false,
    sameSite: 'lax',
    maxAge: 0, // Expire immediately
    path: '/',
  });

  return response;
}
