import { NextRequest, NextResponse } from "next/server";
import { getApiBaseUrl } from "@/lib/api";

export async function POST(req: NextRequest) {
  const apiBaseUrl = getApiBaseUrl();
  const body = await req.json();
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  const adminToken = process.env.ADMIN_API_KEY;
  if (adminToken) headers["X-Admin-Token"] = adminToken;
  const orgId = req.headers.get("x-org-id");
  if (orgId) headers["X-Org-Id"] = orgId;

  const response = await fetch(`${apiBaseUrl}/api/product/subscribe`, {
    method: "POST",
    headers,
    body: JSON.stringify(body),
    cache: "no-store",
  });
  const data = await response.json();
  return NextResponse.json(data, { status: response.status });
}
