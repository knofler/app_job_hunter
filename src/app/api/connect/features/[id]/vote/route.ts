import { NextRequest, NextResponse } from "next/server";

import { SERVER_BACKEND_URL } from "@/lib/server-backend-url";
const BACKEND_URL = SERVER_BACKEND_URL;
const ADMIN_API_KEY = process.env.ADMIN_API_KEY;

type RouteContext = { params: Promise<{ id: string }> };

// ---------------------------------------------------------------------------
// POST /api/connect/features/[id]/vote — toggle vote on a feature request
// ---------------------------------------------------------------------------

export async function POST(_request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;
    const backendUrl = `${BACKEND_URL}/api/connect/features/${id}/vote`;

    console.log(`[API Proxy] POST /api/connect/features/${id}/vote -> ${backendUrl}`);

    const response = await fetch(backendUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(ADMIN_API_KEY ? { "X-Admin-Token": ADMIN_API_KEY } : {}),
      },
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
    return NextResponse.json(data);
  } catch (error) {
    console.error("[API Proxy] Error proxying POST /api/connect/features/[id]/vote:", error);
    return NextResponse.json(
      { error: "Failed to vote on feature request" },
      { status: 500 }
    );
  }
}
