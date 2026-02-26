import { NextRequest, NextResponse } from "next/server";

import { SERVER_BACKEND_URL } from "@/lib/server-backend-url";
const BACKEND_URL = SERVER_BACKEND_URL;

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ [key: string]: string | string[] }> }
) {
  try {
    const { candidate_id } = await params;
    const backendUrl = `${BACKEND_URL}/candidates/${candidate_id}`;

    console.log(`[API Proxy] GET /api/candidates/${candidate_id} -> ${backendUrl}`);

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
    console.log(`[API Proxy] Success: Candidate profile returned`);

    return NextResponse.json(data);
  } catch (error) {
    console.error("[API Proxy] Error proxying to backend:", error);
    return NextResponse.json(
      { error: "Failed to fetch candidate profile from backend" },
      { status: 500 }
    );
  }
}