import { NextRequest } from "next/server";
import { proxyProjects } from "../../../_proxy";
type P = { params: Promise<{ projectId: string }> };
export async function POST(req: NextRequest, { params }: P) {
  const { projectId } = await params;
  const body = await req.json();
  return proxyProjects(req, `/${projectId}/context/score`, "POST", body);
}
