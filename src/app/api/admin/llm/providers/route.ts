import { NextResponse } from "next/server";

import { getApiBaseUrl } from "@/lib/api";
const ADMIN_API_KEY = process.env.ADMIN_API_KEY;

export async function GET() {
  if (!ADMIN_API_KEY) {
    return NextResponse.json(
      { detail: "ADMIN_API_KEY is not configured on the frontend server." },
      { status: 503 },
    );
  }

  const apiBaseUrl = getApiBaseUrl();
  const response = await fetch(`${apiBaseUrl}/admin/llm/providers`, {
    headers: {
      "X-Admin-Token": ADMIN_API_KEY,
    },
    cache: "no-store",
  });

  const data = await response.json();
  return NextResponse.json(data, { status: response.status });
}
