import { NextRequest, NextResponse } from "next/server";
import { getApiBaseUrl } from "@/lib/api";

export async function proxyToSeed(request: NextRequest, path: string, method: "GET" | "POST" = "GET") {
  const apiBaseUrl = getApiBaseUrl();
  const headers: Record<string, string> = {};
  const adminToken = process.env.ADMIN_API_KEY || process.env.NEXT_PUBLIC_ADMIN_TOKEN;
  if (adminToken) headers["X-Admin-Token"] = adminToken;

  const response = await fetch(`${apiBaseUrl}/admin/seed/${path}`, {
    method,
    headers,
    cache: "no-store",
  });

  const data = await response.json();
  return NextResponse.json(data, { status: response.status });
}
