import { NextRequest, NextResponse } from "next/server";

import { SERVER_BACKEND_URL } from "@/lib/server-backend-url";
const BACKEND_URL = SERVER_BACKEND_URL;

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ [key: string]: string | string[] }> }
) {
  try {
    const { id } = await params;
    const backendUrl = `${BACKEND_URL}/resumes/resume/${id}`;

    console.log(`[API Proxy] GET /api/resumes/${id} -> ${backendUrl}`);

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
    console.log(`[API Proxy] Success: Resume returned`);

    return NextResponse.json(data);
  } catch (error) {
    console.error("[API Proxy] Error proxying to backend:", error);
    return NextResponse.json(
      { error: "Failed to fetch resume from backend" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ [key: string]: string | string[] }> }
) {
  try {
    const { id } = await params;
    const backendUrl = `${BACKEND_URL}/resumes/${id}`;

    console.log(`[API Proxy] PATCH /api/resumes/${id} -> ${backendUrl}`);

    const body = await request.json();

    const response = await fetch(backendUrl, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        ...(process.env.NEXT_PUBLIC_ADMIN_TOKEN ? { "X-Admin-Token": process.env.NEXT_PUBLIC_ADMIN_TOKEN } : {}),
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      console.error(`[API Proxy] Backend error: ${response.status} ${response.statusText}`);
      return NextResponse.json(
        { error: `Backend error: ${response.status} ${response.statusText}` },
        { status: response.status }
      );
    }

    const data = await response.json();
    console.log(`[API Proxy] Success: Resume updated`);

    return NextResponse.json(data);
  } catch (error) {
    console.error("[API Proxy] Error proxying to backend:", error);
    return NextResponse.json(
      { error: "Failed to update resume" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ [key: string]: string | string[] }> }
) {
  try {
    const { id } = await params;
    const backendUrl = `${BACKEND_URL}/resumes/${id}`;

    console.log(`[API Proxy] DELETE /api/resumes/${id} -> ${backendUrl}`);

    const response = await fetch(backendUrl, {
      method: "DELETE",
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

    console.log(`[API Proxy] Success: Resume deleted`);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[API Proxy] Error proxying to backend:", error);
    return NextResponse.json(
      { error: "Failed to delete resume" },
      { status: 500 }
    );
  }
}