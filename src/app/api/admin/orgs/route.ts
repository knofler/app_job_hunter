import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { getApiBaseUrl } from "@/lib/api";

export async function GET(request: NextRequest) {
  try {
    const session = await getSession(request);
    const apiBaseUrl = getApiBaseUrl();
    const headers: Record<string, string> = {};

    if (session?.accessToken) {
      headers["Authorization"] = `Bearer ${session.accessToken}`;
    }
    const adminToken = process.env.ADMIN_API_KEY;
    if (adminToken) {
      headers["X-Admin-Token"] = adminToken;
    }

    const response = await fetch(`${apiBaseUrl}/admin/orgs`, {
      headers,
      cache: "no-store",
    });

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Proxy error";
    return NextResponse.json({ detail: message }, { status: 502 });
  }
}
