import { NextRequest, NextResponse } from "next/server";

import { SERVER_BACKEND_URL } from "@/lib/server-backend-url";
const BACKEND_URL = SERVER_BACKEND_URL;

type P = { params: Promise<{ jobId: string }> };

export async function GET(_req: NextRequest, { params }: P) {
  const orgId = _req.headers.get("x-org-id");
  const { jobId } = await params;
  const response = await fetch(`${BACKEND_URL}/jobs/${jobId}`, {
    headers: {
      "Content-Type": "application/json",
      ...(orgId ? { "X-Org-Id": orgId } : {}),
    },
  });
  const data = await response.json().catch(() => ({}));
  return NextResponse.json(data, { status: response.status });
}
