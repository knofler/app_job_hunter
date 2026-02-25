import { NextRequest, NextResponse } from "next/server";

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL_INTERNAL || "http://backend:8000";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const queryString = searchParams.toString();
  const url = `${BACKEND_URL}/jobs/descriptions${queryString ? `?${queryString}` : ""}`;
  const response = await fetch(url, { headers: { "Content-Type": "application/json" } });
  const data = await response.json().catch(() => ({}));
  return NextResponse.json(data, { status: response.status });
}
