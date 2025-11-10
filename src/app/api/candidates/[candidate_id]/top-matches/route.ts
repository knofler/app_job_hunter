import { NextRequest, NextResponse } from "next/server";

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL_INTERNAL || "http://backend:8000";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ [key: string]: string | string[] }> }
) {
  try {
    const { candidate_id } = await params;
    const { searchParams } = new URL(request.url);
    const limit = searchParams.get('limit') || '5';
    const backendUrl = `${BACKEND_URL}/candidates/${candidate_id}/top-matches?limit=${limit}`;

    console.log(`[API Proxy] GET /api/candidates/${candidate_id}/top-matches -> ${backendUrl}`);

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
    console.log(`[API Proxy] Success: Top matches returned`);

    return NextResponse.json(data);
  } catch (error) {
    console.error("[API Proxy] Error proxying to backend:", error);
    return NextResponse.json(
      { error: "Failed to fetch top matches from backend" },
      { status: 500 }
    );
  }
}