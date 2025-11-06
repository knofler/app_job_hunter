import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@auth0/nextjs-auth0";

import { getApiBaseUrl } from "@/lib/api";

async function proxy(request: NextRequest, init?: RequestInit) {
  // Get the user's session
  const session = await getSession(request, new NextResponse());
  if (!session?.accessToken) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const apiBaseUrl = getApiBaseUrl();
  const response = await fetch(`${apiBaseUrl}/admin/llm/settings`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${session.accessToken}`,
      ...(init?.headers ?? {}),
    },
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
