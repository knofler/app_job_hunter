import { NextRequest, NextResponse } from "next/server";

import { getApiBaseUrl } from "@/lib/api";
const ADMIN_API_KEY = process.env.ADMIN_API_KEY;

async function proxy(request: NextRequest, init?: RequestInit) {
  const apiBaseUrl = getApiBaseUrl();
  const response = await fetch(`${apiBaseUrl}/admin/llm/settings`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(ADMIN_API_KEY ? { "X-Admin-Token": ADMIN_API_KEY } : {}),
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
