import { NextRequest, NextResponse } from "next/server";

import { SERVER_BACKEND_URL } from "@/lib/server-backend-url";
const BACKEND_URL = SERVER_BACKEND_URL;

// Increase Vercel serverless body size limit from 4.5MB to 50MB for resume uploads
export const maxDuration = 60; // seconds
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const backendUrl = `${BACKEND_URL}/resumes/`;

    console.log(`[API Proxy] POST /api/resumes/ -> ${backendUrl}`);

    // Forward the FormData as-is
    const formData = await request.formData();

    const response = await fetch(backendUrl, {
      method: "POST",
      headers: {
        ...(process.env.NEXT_PUBLIC_ADMIN_TOKEN ? { "X-Admin-Token": process.env.NEXT_PUBLIC_ADMIN_TOKEN } : {}),
      },
      body: formData,
    });

    if (!response.ok) {
      console.error(`[API Proxy] Backend error: ${response.status} ${response.statusText}`);
      const errorData = await response.json().catch(() => ({ error: response.statusText }));
      console.error(`[API Proxy] Error details:`, errorData);
      return NextResponse.json(
        { error: `Backend error: ${response.status}`, details: errorData },
        { status: response.status }
      );
    }

    const data = await response.json();
    console.log(`[API Proxy] Success: Resume uploaded`, data);

    return NextResponse.json(data);
  } catch (error) {
    console.error("[API Proxy] Error proxying to backend:", error);
    return NextResponse.json(
      { error: "Failed to upload resume" },
      { status: 500 }
    );
  }
}