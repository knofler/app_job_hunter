import { NextRequest, NextResponse } from "next/server";

import { SERVER_BACKEND_URL } from "@/lib/server-backend-url";
const BACKEND_URL = SERVER_BACKEND_URL;
const ADMIN_API_KEY = process.env.ADMIN_API_KEY;

export async function POST(request: NextRequest) {
  try {
    const orgId = request.headers.get("x-org-id");
    const body = await request.text();

    const response = await fetch(`${BACKEND_URL}/recruiter-workflow/save`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(ADMIN_API_KEY ? { "X-Admin-Token": ADMIN_API_KEY } : {}),
        ...(orgId ? { "X-Org-Id": orgId } : {}),
      },
      body,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: "Backend error" }));
      return NextResponse.json(errorData, { status: response.status });
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("[API Proxy] Error saving workflow:", error);
    return NextResponse.json({ error: "Failed to save workflow" }, { status: 500 });
  }
}
