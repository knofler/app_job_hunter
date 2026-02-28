import { NextRequest, NextResponse } from "next/server";
import { SERVER_BACKEND_URL } from "@/lib/server-backend-url";

export async function POST(req: NextRequest) {
  const body = await req.json();

  const adminToken =
    process.env.ADMIN_API_KEY || process.env.NEXT_PUBLIC_ADMIN_TOKEN;

  // Strip the /api suffix if present — backend path is /api/assessments/single/stream
  const base = SERVER_BACKEND_URL.replace(/\/api$/, "");
  const url = `${base}/api/assessments/single/stream`;

  const upstream = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(adminToken ? { "X-Admin-Token": adminToken } : {}),
    },
    body: JSON.stringify(body),
  });

  if (upstream.headers.get("content-type")?.includes("text/event-stream")) {
    return new NextResponse(upstream.body, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        "X-Accel-Buffering": "no",
      },
    });
  }

  const data = await upstream.json().catch(() => ({ detail: "Unknown error" }));
  return NextResponse.json(data, { status: upstream.status });
}
