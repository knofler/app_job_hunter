import { NextRequest, NextResponse } from "next/server";

import { SERVER_BACKEND_URL } from "@/lib/server-backend-url";
const BACKEND_URL = SERVER_BACKEND_URL;
const ADMIN_API_KEY = process.env.ADMIN_API_KEY;

function getAuthHeaders(request: NextRequest): Record<string, string> {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  const authToken = request.cookies.get("auth-token")?.value;
  if (authToken) headers["Authorization"] = `Bearer ${authToken}`;
  if (ADMIN_API_KEY) headers["X-Admin-Token"] = ADMIN_API_KEY;
  // Pass user identity from cookie for Connect Hub user tracking
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

type RouteContext = { params: Promise<{ id: string }> };

// ---------------------------------------------------------------------------
// POST /api/connect/features/[id]/vote — toggle vote on a feature request
// ---------------------------------------------------------------------------

export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;
    const backendUrl = `${BACKEND_URL}/api/connect/features/${id}/vote`;

    const response = await fetch(backendUrl, {
      method: "POST",
      headers: getAuthHeaders(request),
      body: JSON.stringify({ direction: "up" }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return NextResponse.json(
        { error: errorData.error || `Backend error: ${response.status} ${response.statusText}` },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to vote on feature request" },
      { status: 500 }
    );
  }
}
