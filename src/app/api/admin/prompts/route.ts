import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@auth0/nextjs-auth0";

import { getApiBaseUrl } from "@/lib/api";

async function proxy(request: NextRequest, init?: RequestInit) {
  const apiBaseUrl = getApiBaseUrl();
  const url = new URL(request.url);
  const promptId = url.pathname.split('/').pop();

  // Get the user's session
  const session = await getSession(request, new NextResponse());
  if (!session?.accessToken) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Handle different routes
  let endpoint = `${apiBaseUrl}/prompts`;
  if (promptId && promptId !== 'prompts') {
    endpoint += `/${promptId}`;
  }

  const response = await fetch(endpoint, {
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