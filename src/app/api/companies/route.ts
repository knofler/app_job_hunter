import { NextRequest, NextResponse } from "next/server";
import { getApiBaseUrl } from "@/lib/api";

async function proxyCompanies(
  request: NextRequest,
  path: string,
  method?: string,
  body?: unknown
) {
  const apiBaseUrl = getApiBaseUrl();
  const headers: Record<string, string> = {};
  const adminToken = process.env.ADMIN_API_KEY;
  if (adminToken) headers["X-Admin-Token"] = adminToken;
  if (body) headers["Content-Type"] = "application/json";
  const orgId = request.headers.get("x-org-id");
  if (orgId) headers["X-Org-Id"] = orgId;

  const url = `${apiBaseUrl}/api/companies${path}`;
  const options: RequestInit = {
    method: method || request.method,
    headers,
    cache: "no-store",
  };
  if (body) options.body = JSON.stringify(body);

  const response = await fetch(url, options);
  const data = await response.json();
  return NextResponse.json(data, { status: response.status });
}

export async function GET(req: NextRequest) {
  const search = req.nextUrl.search;
  return proxyCompanies(req, `${search}`);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  return proxyCompanies(req, "", "POST", body);
}
