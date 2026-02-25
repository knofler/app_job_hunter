import { NextRequest } from "next/server";
import { proxyProjects } from "../../_proxy";
type P = { params: Promise<{ projectId: string }> };
export async function GET(_req: NextRequest, { params }: P) {
  const { projectId } = await params;
  return proxyProjects(_req, `/${projectId}/context`);
}
export async function PUT(req: NextRequest, { params }: P) {
  const { projectId } = await params;
  const body = await req.json();
  return proxyProjects(req, `/${projectId}/context`, "PUT", body);
}
