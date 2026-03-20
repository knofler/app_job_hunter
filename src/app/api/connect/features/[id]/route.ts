import { NextRequest, NextResponse } from "next/server";

import { SERVER_BACKEND_URL } from "@/lib/server-backend-url";
const BACKEND_URL = SERVER_BACKEND_URL;
const ADMIN_API_KEY = process.env.ADMIN_API_KEY;

type RouteContext = { params: Promise<{ id: string }> };

// ---------------------------------------------------------------------------
// GET /api/connect/features/[id] — get a single feature request
// ---------------------------------------------------------------------------

export async function GET(_request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;
    const backendUrl = `${BACKEND_URL}/api/connect/features/${id}`;

    console.log(`[API Proxy] GET /api/connect/features/${id} -> ${backendUrl}`);

    const response = await fetch(backendUrl, {
      method: "GET",
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
    console.error("[API Proxy] Error proxying GET /api/connect/features/[id]:", error);
    return NextResponse.json(
      { error: "Failed to fetch feature request from backend" },
      { status: 500 }
    );
  }
}

// ---------------------------------------------------------------------------
// PATCH /api/connect/features/[id] — update a feature request
// ---------------------------------------------------------------------------

export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;
    const body = await request.json();
    const backendUrl = `${BACKEND_URL}/api/connect/features/${id}`;

    console.log(`[API Proxy] PATCH /api/connect/features/${id} -> ${backendUrl}`);

    const response = await fetch(backendUrl, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        ...(ADMIN_API_KEY ? { "X-Admin-Token": ADMIN_API_KEY } : {}),
      },
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
    return NextResponse.json(data);
  } catch (error) {
    console.error("[API Proxy] Error proxying PATCH /api/connect/features/[id]:", error);
    return NextResponse.json(
      { error: "Failed to update feature request" },
      { status: 500 }
    );
  }
}
