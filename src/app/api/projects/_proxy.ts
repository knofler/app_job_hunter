import { NextRequest, NextResponse } from "next/server";
import { getApiBaseUrl } from "@/lib/api";

export async function proxyProjects(
  request: NextRequest,
  path: string,
  method?: string,
  body?: unknown
) {
  const apiBaseUrl = getApiBaseUrl();
  const headers: Record<string, string> = {};
  const adminToken = process.env.ADMIN_API_KEY || process.env.NEXT_PUBLIC_ADMIN_TOKEN;
  if (adminToken) headers["X-Admin-Token"] = adminToken;
  if (body) headers["Content-Type"] = "application/json";

  const url = `${apiBaseUrl}/projects${path}`;
  const fetchMethod = method || request.method;

  const options: RequestInit = {
    method: fetchMethod,
    headers,
    cache: "no-store",
  };
  if (body) options.body = JSON.stringify(body);

  const response = await fetch(url, options);

  // Pass streaming responses through directly
  if (response.headers.get("content-type")?.includes("text/event-stream")) {
    return new NextResponse(response.body, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        "X-Accel-Buffering": "no",
      },
    });
  }

  const data = await response.json();
  return NextResponse.json(data, { status: response.status });
}
