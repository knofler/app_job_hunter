import { NextRequest, NextResponse } from "next/server";

import { SERVER_BACKEND_URL } from "@/lib/server-backend-url";
const BACKEND_URL = SERVER_BACKEND_URL;
const ADMIN_API_KEY = process.env.ADMIN_API_KEY;

function getAuthHeaders(request: NextRequest): Record<string, string> {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  const authToken = request.cookies.get("auth-token")?.value;
  if (authToken) headers["Authorization"] = `Bearer ${authToken}`;
  if (ADMIN_API_KEY) headers["X-Admin-Token"] = ADMIN_API_KEY;
  const userInfoCookie = request.cookies.get("user-info")?.value;
  if (userInfoCookie) {
    try {
      const u = JSON.parse(decodeURIComponent(userInfoCookie));
      if (u.sub) headers["X-Connect-User-Sub"] = u.sub;
      if (u.name) headers["X-Connect-User-Name"] = u.name;
    } catch { /* ignore */ }
  }
  return headers;
}

// ---------------------------------------------------------------------------
// GET /api/connect/bugs — list bug reports
// ---------------------------------------------------------------------------

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const queryString = searchParams.toString();
    const backendUrl = `${BACKEND_URL}/api/connect/bugs${queryString ? `?${queryString}` : ""}`;

    console.log(`[API Proxy] GET /api/connect/bugs -> ${backendUrl}`);

    const response = await fetch(backendUrl, {
      method: "GET",
      headers: getAuthHeaders(request),
    });

    if (!response.ok) {
      console.error(`[API Proxy] Backend error: ${response.status} ${response.statusText}`);
      return NextResponse.json(
        { error: `Backend error: ${response.status} ${response.statusText}` },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("[API Proxy] Error proxying GET /api/connect/bugs:", error);
    return NextResponse.json(
      { error: "Failed to fetch bug reports from backend" },
      { status: 500 }
    );
  }
}

// ---------------------------------------------------------------------------
// POST /api/connect/bugs — create a bug report
// ---------------------------------------------------------------------------

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const backendUrl = `${BACKEND_URL}/api/connect/bugs`;

    // Inject user name from cookie
    const userInfoCookie = request.cookies.get("user-info")?.value;
    if (userInfoCookie) {
      try {
        const userInfo = JSON.parse(decodeURIComponent(userInfoCookie));
        if (userInfo.name) body.reporter_name = userInfo.name;
      } catch { /* ignore */ }
    }

    const response = await fetch(backendUrl, {
      method: "POST",
      headers: getAuthHeaders(request),
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      console.error(`[API Proxy] Backend error: ${response.status} ${response.statusText}`);
      const errorData = await response.json().catch(() => ({}));
      return NextResponse.json(
        { error: errorData.error || `Backend error: ${response.status} ${response.statusText}` },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    console.error("[API Proxy] Error proxying POST /api/connect/bugs:", error);
    return NextResponse.json(
      { error: "Failed to create bug report" },
      { status: 500 }
    );
  }
}
