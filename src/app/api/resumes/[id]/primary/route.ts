import { NextRequest, NextResponse } from "next/server";

import { SERVER_BACKEND_URL } from "@/lib/server-backend-url";
const BACKEND_URL = SERVER_BACKEND_URL;

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ [key: string]: string | string[] }> }
) {
  try {
    const orgId = request.headers.get("x-org-id");
    const { id } = await params;
    const backendUrl = `${BACKEND_URL}/resumes/${id}/primary`;

    console.log(`[API Proxy] PATCH /api/resumes/${id}/primary -> ${backendUrl}`);

    const response = await fetch(backendUrl, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        ...(process.env.ADMIN_API_KEY ? { "X-Admin-Token": process.env.ADMIN_API_KEY } : {}),
        ...(orgId ? { "X-Org-Id": orgId } : {}),
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
    console.log(`[API Proxy] Success: Resume set as primary`);

    return NextResponse.json(data);
  } catch (error) {
    console.error("[API Proxy] Error proxying to backend:", error);
    return NextResponse.json(
      { error: "Failed to set resume as primary" },
      { status: 500 }
    );
  }
}
