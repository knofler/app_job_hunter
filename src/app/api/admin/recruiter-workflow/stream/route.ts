import { NextRequest } from "next/server";
import { getApiBaseUrl } from "@/lib/api";

export async function POST(request: NextRequest) {
  const apiBaseUrl = getApiBaseUrl();
  const adminToken = process.env.ADMIN_API_KEY;
  const body = await request.text();

  const upstream = await fetch(`${apiBaseUrl}/recruiter-workflow/generate-stream`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(adminToken ? { "X-Admin-Token": adminToken } : {}),
    },
    body,
  });

  if (!upstream.ok || !upstream.body) {
    return new Response(
      JSON.stringify({ detail: "Upstream stream request failed" }),
      { status: upstream.status, headers: { "Content-Type": "application/json" } }
    );
  }

  return new Response(upstream.body, {
    status: 200,
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
