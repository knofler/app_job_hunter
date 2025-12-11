import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";

import { getApiBaseUrl } from "@/lib/api";

async function proxy(request: NextRequest, init?: RequestInit) {
  // Get the user's session
  const session = await getSession(request);
  
  const apiBaseUrl = getApiBaseUrl();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  // Try JWT first if available
  if (session?.accessToken) {
    headers["Authorization"] = `Bearer ${session.accessToken}`;
  }
  
  // Always include X-Admin-Token as fallback
  const adminToken = process.env.ADMIN_API_KEY || process.env.NEXT_PUBLIC_ADMIN_TOKEN;
  if (adminToken) {
    headers["X-Admin-Token"] = adminToken;
  }

  // Add any additional headers from init
  if (init?.headers) {
    Object.assign(headers, init.headers as Record<string, string>);
  }

  const response = await fetch(`${apiBaseUrl}/admin/llm/settings`, {
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

export async function PUT(request: NextRequest) {
  const payload = await request.text();
  return proxy(request, {
    method: "PUT",
    body: payload,
  });
}
