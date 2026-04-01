import { NextRequest, NextResponse } from "next/server";
import { getApiBaseUrl } from "@/lib/api";

export async function GET(req: NextRequest, { params }: { params: Promise<{ ticketId: string }> }) {
  const { ticketId } = await params;
  const apiBaseUrl = getApiBaseUrl();
  const headers: Record<string, string> = {};
  const adminToken = process.env.ADMIN_API_KEY;
  if (adminToken) headers["X-Admin-Token"] = adminToken;
  const orgId = req.headers.get("x-org-id");
  if (orgId) headers["X-Org-Id"] = orgId;
  const cookies = req.cookies;
  const authToken = cookies.get("auth-token")?.value;
  if (authToken) headers["Authorization"] = `Bearer ${authToken}`;
  const userInfo = cookies.get("user-info")?.value;
  if (userInfo) {
    try {
      const decoded = JSON.parse(decodeURIComponent(userInfo));
      if (decoded.sub) headers["X-Connect-User-Sub"] = decoded.sub;
    } catch { /* ignore */ }
  }

  const response = await fetch(`${apiBaseUrl}/api/connect/status?ticket_id=${ticketId}`, {
    headers,
    cache: "no-store",
  });
  const data = await response.json();
  return NextResponse.json(data, { status: response.status });
}
