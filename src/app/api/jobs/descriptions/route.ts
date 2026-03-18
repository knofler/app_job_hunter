import { NextRequest, NextResponse } from "next/server";

import { SERVER_BACKEND_URL } from "@/lib/server-backend-url";
const BACKEND_URL = SERVER_BACKEND_URL;

export async function GET(request: NextRequest) {
  const orgId = request.headers.get("x-org-id");
  const { searchParams } = new URL(request.url);
  const queryString = searchParams.toString();
  const url = `${BACKEND_URL}/jobs/descriptions${queryString ? `?${queryString}` : ""}`;
  const adminToken = process.env.ADMIN_API_KEY;
  const response = await fetch(url, {
    headers: {
      "Content-Type": "application/json",
      ...(adminToken ? { "X-Admin-Token": adminToken } : {}),
      ...(orgId ? { "X-Org-Id": orgId } : {}),
    },
  });
  const data = await response.json().catch(() => ({}));
  return NextResponse.json(data, { status: response.status });
}
