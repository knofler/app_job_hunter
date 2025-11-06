import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@auth0/nextjs-auth0";

import { getApiBaseUrl } from "@/lib/api";

export async function GET(request: NextRequest) {
  // Get the user's session
  const session = await getSession(request, new NextResponse());
  if (!session?.accessToken) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const apiBaseUrl = getApiBaseUrl();
  const response = await fetch(`${apiBaseUrl}/admin/llm/providers`, {
    headers: {
      "Authorization": `Bearer ${session.accessToken}`,
    },
    cache: "no-store",
  });

  const data = await response.json();
  return NextResponse.json(data, { status: response.status });
}
