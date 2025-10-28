import { NextResponse } from "next/server";

import { getApiBaseUrl } from "@/lib/api";
const ADMIN_API_KEY = process.env.ADMIN_API_KEY;

export async function GET() {
  const apiBaseUrl = getApiBaseUrl();
  const headers: Record<string, string> = {};
  if (ADMIN_API_KEY) {
    headers["X-Admin-Token"] = ADMIN_API_KEY;
  }

  const response = await fetch(`${apiBaseUrl}/admin/llm/providers`, {
    headers,
    cache: "no-store",
  });

  const data = await response.json();
  return NextResponse.json(data, { status: response.status });
}
