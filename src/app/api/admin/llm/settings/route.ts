import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";

import { getApiBaseUrl } from "@/lib/api";

async function proxy(request: NextRequest, init?: RequestInit) {
  try {
    const session = await getSession(request);
    
    const apiBaseUrl = getApiBaseUrl();
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };

    if (session?.accessToken) {
      headers["Authorization"] = `Bearer ${session.accessToken}`;
    }
    
    const adminToken = process.env.ADMIN_API_KEY || process.env.NEXT_PUBLIC_ADMIN_TOKEN;
    if (adminToken) {
      headers["X-Admin-Token"] = adminToken;
    }

    if (init?.headers) {
      Object.assign(headers, init.headers as Record<string, string>);
    }

    const response = await fetch(`${apiBaseUrl}/api/admin/llm/settings`, {
      ...init,
      headers,
      cache: "no-store",
    });

    const body = await response.text();
    let data: unknown = null;
    if (body) {
      try {
        data = JSON.parse(body);
      } catch {
        data = { detail: body };
      }
    }
    return NextResponse.json(data, { status: response.status });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Proxy error";
    return NextResponse.json({ detail: message }, { status: 502 });
  }
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
