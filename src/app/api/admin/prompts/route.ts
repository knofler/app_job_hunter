import { NextRequest, NextResponse } from "next/server";

async function proxy(request: NextRequest, init?: RequestInit) {
  const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://backend:8000';
  const url = new URL(request.url);
  const promptId = url.pathname.split('/').pop();

  // Handle different routes
  let endpoint = `${apiBaseUrl}/prompts`;
  if (promptId && promptId !== 'prompts') {
    endpoint += `/${promptId}`;
  }

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

  const response = await fetch(endpoint, {
    ...init,
    headers,
    cache: "no-store",
  });

  const body = await response.text();
  const data = body ? JSON.parse(body) : null;
  return NextResponse.json(data, { status: response.status });
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

export async function PUT(request: NextRequest) {
  const payload = await request.text();
  return proxy(request, {
    method: "PUT",
    body: payload,
  });
}

export async function DELETE(request: NextRequest) {
  return proxy(request, {
    method: "DELETE",
  });
}