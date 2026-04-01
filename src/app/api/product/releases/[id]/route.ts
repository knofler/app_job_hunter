import { NextRequest, NextResponse } from "next/server";
import { getApiBaseUrl } from "@/lib/api";

function proxyHeaders(req: NextRequest): Record<string, string> {
  const headers: Record<string, string> = {};
  const adminToken = process.env.ADMIN_API_KEY;
  if (adminToken) headers["X-Admin-Token"] = adminToken;
  const orgId = req.headers.get("x-org-id");
  if (orgId) headers["X-Org-Id"] = orgId;
  return headers;
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const apiBaseUrl = getApiBaseUrl();
  const response = await fetch(`${apiBaseUrl}/api/product/releases/${id}`, {
    headers: proxyHeaders(req),
    cache: "no-store",
  });
  const data = await response.json();
  return NextResponse.json(data, { status: response.status });
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const apiBaseUrl = getApiBaseUrl();
  const body = await req.json();
  const headers = { ...proxyHeaders(req), "Content-Type": "application/json" };
  const response = await fetch(`${apiBaseUrl}/api/product/releases/${id}`, {
    method: "PATCH",
    headers,
    body: JSON.stringify(body),
    cache: "no-store",
  });
  const data = await response.json();
  return NextResponse.json(data, { status: response.status });
}
