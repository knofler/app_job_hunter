import { NextRequest, NextResponse } from "next/server";
import { getApiBaseUrl } from "@/lib/api";

type P = { params: Promise<{ projectId: string; runId: string }> };

export async function GET(_req: NextRequest, { params }: P) {
  const { projectId, runId } = await params;
  const apiBaseUrl = getApiBaseUrl();
  const headers: Record<string, string> = {};
  const adminToken = process.env.ADMIN_API_KEY;
  if (adminToken) headers["X-Admin-Token"] = adminToken;
  const orgId = _req.headers.get("x-org-id");
  if (orgId) headers["X-Org-Id"] = orgId;

  const url = `${apiBaseUrl}/api/projects/${projectId}/runs/${runId}/pdf`;
  const response = await fetch(url, { method: "GET", headers, cache: "no-store" });

  if (!response.ok) {
    return NextResponse.json(
      { detail: response.statusText },
      { status: response.status },
    );
  }

  const contentType = response.headers.get("content-type") ?? "application/pdf";
  const contentDisposition = response.headers.get("content-disposition");

  const resHeaders: Record<string, string> = {
    "Content-Type": contentType,
    "Cache-Control": "no-cache",
  };
  if (contentDisposition) resHeaders["Content-Disposition"] = contentDisposition;

  return new NextResponse(response.body, { headers: resHeaders });
}
