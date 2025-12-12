import { NextRequest, NextResponse } from "next/server";

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL_INTERNAL || "http://backend:8000";

export async function POST(request: NextRequest) {
  try {
    const backendUrl = `${BACKEND_URL}/resumes/upload-resume`;

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
      return NextResponse.json(
        { error: `Backend error: ${response.status} ${response.statusText}` },
        { status: response.status }
      );
    }

    const data = await response.json();
    console.log(`[API Proxy] Success: Resume uploaded`);

    return NextResponse.json(data);
  } catch (error) {
    console.error("[API Proxy] Error proxying to backend:", error);
    return NextResponse.json(
      { error: "Failed to upload resume" },
      { status: 500 }
    );
  }
}