import { NextRequest, NextResponse } from "next/server";

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL_INTERNAL || "http://backend:8000";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ [key: string]: string | string[] }> }
) {
  try {
    const { candidate_id } = await params;
    const backendUrl = `${BACKEND_URL}/candidates/${candidate_id}/suggested-actions`;

    console.log(`[API Proxy] GET /api/candidates/${candidate_id}/suggested-actions -> ${backendUrl}`);

    const response = await fetch(backendUrl, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        ...(process.env.NEXT_PUBLIC_ADMIN_TOKEN ? { "X-Admin-Token": process.env.NEXT_PUBLIC_ADMIN_TOKEN } : {}),
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
    console.log(`[API Proxy] Success: Suggested actions returned`);

    return NextResponse.json(data);
  } catch (error) {
    console.error("[API Proxy] Error proxying to backend:", error);
    return NextResponse.json(
      { error: "Failed to fetch suggested actions from backend" },
      { status: 500 }
    );
  }
}