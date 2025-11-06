import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@auth0/nextjs-auth0";

import { getApiBaseUrl } from "@/lib/api";

export async function GET(request: NextRequest) {
  // Get the user's session
  const session = await getSession(request, new NextResponse());
  
  const apiBaseUrl = getApiBaseUrl();
  const headers: Record<string, string> = {};

  // Try JWT first if available
  if (session?.accessToken) {
    headers["Authorization"] = `Bearer ${session.accessToken}`;
  }
  
  // Always include X-Admin-Token as fallback
  const adminToken = process.env.ADMIN_API_KEY || process.env.NEXT_PUBLIC_ADMIN_TOKEN;
  if (adminToken) {
    headers["X-Admin-Token"] = adminToken;
  }

  const response = await fetch(`${apiBaseUrl}/admin/llm/providers`, {
    headers,
    cache: "no-store",
  });

  const data = await response.json();
  return NextResponse.json(data, { status: response.status });
}
