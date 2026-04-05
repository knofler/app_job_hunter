import { NextRequest, NextResponse } from "next/server";
import { getApiBaseUrl } from "@/lib/api";

type P = { params: Promise<{ companyId: string }> };

export async function GET(_req: NextRequest, { params }: P) {
  const { companyId } = await params;
  const apiBaseUrl = getApiBaseUrl();
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  const adminToken = process.env.ADMIN_API_KEY;
  if (adminToken) headers["X-Admin-Token"] = adminToken;

  const response = await fetch(`${apiBaseUrl}/api/companies/${companyId}`, {
    headers,
    cache: "no-store",
  });
  const data = await response.json();
  return NextResponse.json(data, { status: response.status });
}
