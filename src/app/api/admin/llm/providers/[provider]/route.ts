import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { getApiBaseUrl } from "@/lib/api";

export async function GET(
  request: NextRequest,
  { params }: { params: { provider: string } }
) {
  const session = await getSession(request);
  const apiBaseUrl = getApiBaseUrl();
  const headers: Record<string, string> = {};

  if (session?.accessToken) {
    headers["Authorization"] = `Bearer ${session.accessToken}`;
  }
  const adminToken = process.env.ADMIN_API_KEY || process.env.NEXT_PUBLIC_ADMIN_TOKEN;
  if (adminToken) {
    headers["X-Admin-Token"] = adminToken;
  }

  const response = await fetch(
    `${apiBaseUrl}/api/admin/llm/providers/${params.provider}/defaults`,
    { headers, cache: "no-store" }
  );
  const data = await response.json();
  return NextResponse.json(data, { status: response.status });
}
