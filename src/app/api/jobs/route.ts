import { NextRequest, NextResponse } from "next/server";

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL_INTERNAL || "http://backend:8000";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const queryString = searchParams.toString();
    const backendUrl = `${BACKEND_URL}/jobs${queryString ? `?${queryString}` : ""}`;

    console.log(`[API Proxy] GET /api/jobs -> ${backendUrl}`);

    const response = await fetch(backendUrl, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        ...Object.fromEntries(request.headers.entries()),
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
    console.log(`[API Proxy] Success: ${data.items?.length || 0} jobs returned`);

    return NextResponse.json(data);
  } catch (error) {
    console.error("[API Proxy] Error proxying to backend:", error);
    return NextResponse.json(
      { error: "Failed to fetch jobs from backend" },
      { status: 500 }
    );
  }
}