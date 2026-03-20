import { NextRequest, NextResponse } from "next/server";

import { SERVER_BACKEND_URL } from "@/lib/server-backend-url";
const BACKEND_URL = SERVER_BACKEND_URL;
const ADMIN_API_KEY = process.env.ADMIN_API_KEY;

// ---------------------------------------------------------------------------
// GET /api/connect/help — list help articles
// ---------------------------------------------------------------------------

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const queryString = searchParams.toString();
    const backendUrl = `${BACKEND_URL}/api/connect/help${queryString ? `?${queryString}` : ""}`;

    console.log(`[API Proxy] GET /api/connect/help -> ${backendUrl}`);

    const response = await fetch(backendUrl, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        ...(ADMIN_API_KEY ? { "X-Admin-Token": ADMIN_API_KEY } : {}),
      },
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
    console.error("[API Proxy] Error proxying GET /api/connect/help:", error);
    return NextResponse.json(
      { error: "Failed to fetch help articles from backend" },
      { status: 500 }
    );
  }
}

// ---------------------------------------------------------------------------
// POST /api/connect/help — create a help article (admin)
// ---------------------------------------------------------------------------

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const backendUrl = `${BACKEND_URL}/api/connect/help`;

    console.log(`[API Proxy] POST /api/connect/help -> ${backendUrl}`);

    const response = await fetch(backendUrl, {
      method: "POST",
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
    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    console.error("[API Proxy] Error proxying POST /api/connect/help:", error);
    return NextResponse.json(
      { error: "Failed to create help article" },
      { status: 500 }
    );
  }
}
