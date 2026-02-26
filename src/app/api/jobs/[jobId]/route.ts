import { NextRequest, NextResponse } from "next/server";

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL_INTERNAL || "http://backend:8000";

type P = { params: Promise<{ jobId: string }> };

export async function GET(_req: NextRequest, { params }: P) {
  const { jobId } = await params;
  const response = await fetch(`${BACKEND_URL}/jobs/${jobId}`, {
    headers: { "Content-Type": "application/json" },
  });
  const data = await response.json().catch(() => ({}));
  return NextResponse.json(data, { status: response.status });
}
