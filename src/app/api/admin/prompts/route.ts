import { NextRequest, NextResponse } from "next/server";

async function proxy(request: NextRequest, init?: RequestInit) {
  const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL_INTERNAL || 'http://backend:8000';
  
  // Build the backend endpoint for the base prompts path
  const endpoint = `${apiBaseUrl}/api/admin/prompts`;

  console.log('Proxy request:', {
    method: init?.method || 'GET',
    frontendUrl: request.url,
    backendEndpoint: endpoint,
    apiBaseUrl
  });

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  // Always include X-Admin-Token as fallback
  const adminToken = process.env.NEXT_PUBLIC_ADMIN_TOKEN || 'fallback-token-change-in-prod';
  if (adminToken) {
    headers["X-Admin-Token"] = adminToken;
  }

  // Add any additional headers from init
  if (init?.headers) {
    Object.assign(headers, init.headers as Record<string, string>);
  }

  try {
    console.log('Making fetch request to:', endpoint);
    const response = await fetch(endpoint, {
      ...init,
      headers,
      cache: "no-store",
    });
    console.log('Backend response status:', response.status);

    const body = await response.text();
    console.log('Backend response body length:', body.length);
    
    const data = body ? JSON.parse(body) : null;
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error('Proxy error:', error);
    return NextResponse.json({ error: 'Proxy failed', details: (error as Error).message }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  return proxy(request);
}

export async function POST(request: NextRequest) {
  const payload = await request.text();
  return proxy(request, {
    method: "POST",
    body: payload,
  });
}