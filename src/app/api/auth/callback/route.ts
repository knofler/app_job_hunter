import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@auth0/nextjs-auth0';

export async function GET(request: NextRequest) {
  try {
    // Get the session to verify the callback
    const session = await getSession(request, new NextResponse());

    if (session) {
      // Redirect to dashboard on successful authentication
      return NextResponse.redirect(new URL('/dashboard', request.url));
    } else {
      // Redirect to home on failed authentication
      return NextResponse.redirect(new URL('/', request.url));
    }
  } catch (error) {
    console.error('Auth callback error:', error);
    return NextResponse.redirect(new URL('/', request.url));
  }
}